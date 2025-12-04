import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateOrderDto {
    tripId?: string;
    description: string;
    weight: number;
    dimensions?: string;
    estimatedPrice: number;
    notes?: string;
    // Para pedidos avulsos (sem trip)
    origin?: {
        name: string;
        lat: number;
        lng: number;
    };
    destination?: {
        name: string;
        lat: number;
        lng: number;
    };
}

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateOrderDto, customerId: string) {
        // Se tem tripId, é um pedido para um percurso existente
        if (data.tripId) {
            const trip = await this.prisma.trip.findUnique({
                where: { id: data.tripId },
                include: { driver: true },
            });

            if (!trip) {
                throw new NotFoundException('Percurso nao encontrado');
            }

            if (trip.driverId === customerId) {
                throw new BadRequestException('Voce nao pode fazer um pedido para seu proprio percurso');
            }

            // Verifica se ja existe um pedido pendente do mesmo cliente para este percurso
            const existingOrder = await this.prisma.order.findFirst({
                where: {
                    tripId: data.tripId,
                    customerId,
                    status: { in: ['PENDING', 'ACCEPTED'] },
                },
            });

            if (existingOrder) {
                throw new BadRequestException('Voce ja possui um pedido para este percurso');
            }

            return this.prisma.order.create({
                data: {
                    customerId,
                    driverId: trip.driverId,
                    tripId: data.tripId,
                    description: data.description,
                    weight: data.weight,
                    dimensions: data.dimensions,
                    estimatedPrice: data.estimatedPrice,
                    notes: data.notes,
                },
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, profilePhoto: true },
                    },
                    driver: {
                        select: { id: true, name: true, phone: true, profilePhoto: true },
                    },
                    trip: {
                        select: {
                            id: true,
                            originName: true,
                            destName: true,
                            departureAt: true,
                        },
                    },
                },
            });
        }

        // Pedido avulso (sem trip) - aguardando motoristas
        return this.prisma.order.create({
            data: {
                customerId,
                description: data.description,
                weight: data.weight,
                dimensions: data.dimensions,
                estimatedPrice: data.estimatedPrice,
                notes: data.notes,
                originName: data.origin?.name,
                originLat: data.origin?.lat,
                originLng: data.origin?.lng,
                destName: data.destination?.name,
                destLat: data.destination?.lat,
                destLng: data.destination?.lng,
            },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
            },
        });
    }

    async findMyOrders(userId: string, userRole: string) {
        let where: any;

        console.log('[OrdersService.findMyOrders] Buscando pedidos:', { userId, userRole });

        // Verifica se é motorista (aceita DRIVER ou driver)
        const isDriver = userRole?.toUpperCase() === 'DRIVER';

        if (isDriver) {
            // Motorista vê:
            // 1. Pedidos atribuídos a ele (driverId = userId)
            // 2. Todos os pedidos avulsos pendentes ou aceitos (disponíveis para motoristas)
            where = {
                OR: [
                    { driverId: userId },
                    {
                        tripId: null, // Pedidos avulsos (sem viagem específica)
                        status: { in: ['PENDING', 'ACCEPTED'] },
                    },
                ],
            };
        } else {
            // Cliente vê apenas seus próprios pedidos
            where = { customerId: userId };
        }

        console.log('[OrdersService.findMyOrders] Query where:', JSON.stringify(where));

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                driver: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                trip: {
                    select: {
                        id: true,
                        originName: true,
                        destName: true,
                        departureAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log('[OrdersService.findMyOrders] Pedidos encontrados:', orders.length);
        orders.forEach(o => {
            console.log(`  - Order ${o.id}: status=${o.status}, tripId=${o.tripId}, driverId=${o.driverId}, customerId=${o.customerId}`);
        });

        // Formata os dados para o mobile
        return orders.map(order => ({
            id: order.id,
            status: order.status,
            createdAt: order.createdAt.toISOString(),
            tripId: order.tripId,
            // IDs do cliente e motorista para filtragem no mobile
            customerId: order.customerId,
            driverId: order.driverId,
            // Usa dados do trip se existir, senão usa os dados do pedido avulso
            tripOrigin: order.trip?.originName || order.originName || '',
            tripDestination: order.trip?.destName || order.destName || '',
            tripDate: order.trip?.departureAt?.toLocaleDateString('pt-BR') || new Date(order.createdAt).toLocaleDateString('pt-BR'),
            description: order.description,
            weight: order.weight,
            estimatedPrice: order.estimatedPrice,
            notes: order.notes,
            customer: order.customer,
            driver: order.driver,
            // Campos adicionais para pedidos avulsos
            originLat: order.originLat,
            originLng: order.originLng,
            destLat: order.destLat,
            destLng: order.destLng,
            // Indica se é um pedido avulso (sem motorista)
            isStandalone: !order.driverId,
            // Campos de cancelamento
            cancellationReason: order.cancellationReason,
            cancelledBy: order.cancelledBy,
            cancelledAt: order.cancelledAt?.toISOString(),
            // Campos de rejeição
            rejectionReason: order.rejectionReason,
            rejectedAt: order.rejectedAt?.toISOString(),
        }));
    }

    async findOne(id: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true, email: true },
                },
                driver: {
                    select: { id: true, name: true, phone: true, profilePhoto: true, email: true },
                },
                trip: true,
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true, profilePhoto: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Verifica se o usuario tem acesso ao pedido
        // Cliente: só vê seus pedidos
        // Motorista: vê pedidos atribuídos a ele OU pedidos avulsos pendentes
        const isCustomer = order.customerId === userId;
        const isAssignedDriver = order.driverId === userId;
        const isStandaloneOrder = !order.driverId && order.status === 'PENDING';

        if (!isCustomer && !isAssignedDriver && !isStandaloneOrder) {
            throw new ForbiddenException('Voce nao tem acesso a este pedido');
        }

        return order;
    }

    async accept(id: string, driverId: string) {
        console.log('[OrdersService.accept] Iniciando aceitação:', { orderId: id, driverId });

        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        console.log('[OrdersService.accept] Pedido encontrado:', {
            orderId: order.id,
            currentDriverId: order.driverId,
            tripId: order.tripId,
            status: order.status
        });

        // Pedidos com trip só podem ser aceitos pelo motorista do trip
        if (order.tripId && order.driverId && order.driverId !== driverId) {
            throw new ForbiddenException('Voce nao pode aceitar este pedido');
        }

        // Pedidos avulsos podem ser aceitos enquanto estiverem PENDING ou ACCEPTED
        // (múltiplos motoristas podem demonstrar interesse)
        if (order.tripId && order.status !== 'PENDING') {
            throw new BadRequestException('Este pedido nao pode ser aceito');
        }

        // Para pedidos avulsos, só bloqueia se já estiver IN_PROGRESS, COMPLETED, REJECTED ou CANCELLED
        if (!order.tripId && !['PENDING', 'ACCEPTED'].includes(order.status)) {
            throw new BadRequestException('Este pedido nao esta mais disponivel');
        }

        // Se o pedido avulso já foi aceito por outro motorista, apenas registra interesse
        // mas não muda o motorista principal (o cliente decide)
        const isFirstAcceptance = !order.driverId;

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                // Só atribui motorista se for a primeira aceitação
                ...(isFirstAcceptance && { driverId }),
                status: 'ACCEPTED',
                acceptedAt: order.acceptedAt || new Date(),
            },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                driver: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                trip: {
                    select: { originName: true, destName: true },
                },
            },
        });

        console.log('[OrdersService.accept] Pedido atualizado:', {
            orderId: updatedOrder.id,
            newDriverId: updatedOrder.driverId,
            newStatus: updatedOrder.status,
            isFirstAcceptance
        });

        return {
            ...updatedOrder,
            isFirstAcceptance,
            message: isFirstAcceptance
                ? 'Pedido aceito! Voce foi o primeiro motorista a aceitar.'
                : 'Interesse registrado! O cliente ja recebeu outra proposta, mas voce pode conversar com ele.',
        };
    }

    async reject(id: string, driverId: string, reason?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { trip: true },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Verifica se o motorista pode rejeitar:
        // 1. É o motorista atribuído ao pedido
        // 2. É o motorista do trip associado
        // 3. É um motorista e o pedido é avulso (sem driverId)
        const isAssignedDriver = order.driverId === driverId;
        const isTripDriver = order.trip?.driverId === driverId;

        // Verifica se é um motorista para pedidos avulsos
        const user = await this.prisma.user.findUnique({
            where: { id: driverId },
            select: { role: true },
        });
        const isDriverOnStandaloneOrder = user?.role === 'DRIVER' && !order.driverId;

        if (!isAssignedDriver && !isTripDriver && !isDriverOnStandaloneOrder) {
            throw new ForbiddenException('Voce nao pode recusar este pedido');
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException('Este pedido nao pode ser recusado');
        }

        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectionReason: reason,
                driverId: driverId, // Atribui o motorista que rejeitou
            },
        });
    }

    async cancel(id: string, userId: string, reason?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Cliente pode cancelar pedidos pendentes ou aceitos
        // Motorista pode cancelar pedidos aceitos (mas nao iniciados)
        const isCustomer = order.customerId === userId;
        const isDriver = order.driverId === userId;

        if (!isCustomer && !isDriver) {
            throw new ForbiddenException('Voce nao pode cancelar este pedido');
        }

        // Cliente pode cancelar qualquer pedido que não esteja concluído ou já cancelado
        if (isCustomer && ['COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw new BadRequestException('Este pedido nao pode ser cancelado');
        }

        // Motorista só pode cancelar pedidos aceitos (não iniciados)
        if (isDriver && !['PENDING', 'ACCEPTED'].includes(order.status)) {
            throw new BadRequestException('Este pedido nao pode ser cancelado');
        }

        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancellationReason: reason || 'Cancelado sem motivo informado',
                cancelledBy: isCustomer ? 'customer' : 'driver',
                cancelledAt: new Date(),
            },
        });
    }

    async startProgress(id: string, driverId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        if (order.driverId !== driverId) {
            throw new ForbiddenException('Voce nao pode iniciar este pedido');
        }

        if (order.status !== 'ACCEPTED') {
            throw new BadRequestException('Este pedido nao pode ser iniciado');
        }

        return this.prisma.order.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });
    }

    async complete(id: string, driverId: string, finalPrice?: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        if (order.driverId !== driverId) {
            throw new ForbiddenException('Voce nao pode concluir este pedido');
        }

        if (order.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Este pedido nao pode ser concluido');
        }

        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                finalPrice: finalPrice || order.estimatedPrice,
            },
        });
    }

    async reopen(id: string, customerId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Apenas o cliente que criou o pedido pode reabri-lo
        if (order.customerId !== customerId) {
            throw new ForbiddenException('Voce nao pode reabrir este pedido');
        }

        // Só pode reabrir pedidos cancelados ou rejeitados
        if (!['CANCELLED', 'REJECTED'].includes(order.status)) {
            throw new BadRequestException('Este pedido nao pode ser reaberto');
        }

        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'PENDING',
                // Limpa os campos de cancelamento/rejeição
                cancellationReason: null,
                cancelledBy: null,
                cancelledAt: null,
                rejectionReason: null,
                rejectedAt: null,
                // Remove o motorista se o pedido foi rejeitado por ele
                // mas mantém se foi cancelado pelo cliente
                driverId: order.cancelledBy === 'customer' ? order.driverId : null,
                // Limpa datas de aceitação
                acceptedAt: null,
                readAt: null,
            },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                driver: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
                trip: {
                    select: { originName: true, destName: true },
                },
            },
        });
    }

    // Contadores para notificacoes (apenas pedidos não lidos)
    async countPendingOrders(userId: string, userRole: string) {
        let where: any;

        if (userRole === 'DRIVER') {
            // Motorista conta:
            // 1. Pedidos atribuídos a ele pendentes não lidos
            // 2. Pedidos avulsos pendentes não lidos
            where = {
                status: 'PENDING' as const,
                readAt: null,
                OR: [
                    { driverId: userId },
                    { driverId: null },
                ],
            };
        } else {
            where = { customerId: userId, status: 'PENDING' as const, readAt: null };
        }

        return this.prisma.order.count({ where });
    }

    // Marca todos os pedidos como lidos
    async markAsRead(userId: string, userRole: string) {
        const where = userRole === 'DRIVER'
            ? { driverId: userId, readAt: null }
            : { customerId: userId, readAt: null };

        await this.prisma.order.updateMany({
            where,
            data: { readAt: new Date() },
        });

        return { success: true };
    }
}
