"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, customerId) {
        var _a, _b, _c, _d, _e, _f;
        if (data.tripId) {
            const trip = await this.prisma.trip.findUnique({
                where: { id: data.tripId },
                include: { driver: true },
            });
            if (!trip) {
                throw new common_1.NotFoundException('Percurso nao encontrado');
            }
            if (trip.driverId === customerId) {
                throw new common_1.BadRequestException('Voce nao pode fazer um pedido para seu proprio percurso');
            }
            const existingOrder = await this.prisma.order.findFirst({
                where: {
                    tripId: data.tripId,
                    customerId,
                    status: { in: ['PENDING', 'ACCEPTED'] },
                },
            });
            if (existingOrder) {
                throw new common_1.BadRequestException('Voce ja possui um pedido para este percurso');
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
        return this.prisma.order.create({
            data: {
                customerId,
                description: data.description,
                weight: data.weight,
                dimensions: data.dimensions,
                estimatedPrice: data.estimatedPrice,
                notes: data.notes,
                originName: (_a = data.origin) === null || _a === void 0 ? void 0 : _a.name,
                originLat: (_b = data.origin) === null || _b === void 0 ? void 0 : _b.lat,
                originLng: (_c = data.origin) === null || _c === void 0 ? void 0 : _c.lng,
                destName: (_d = data.destination) === null || _d === void 0 ? void 0 : _d.name,
                destLat: (_e = data.destination) === null || _e === void 0 ? void 0 : _e.lat,
                destLng: (_f = data.destination) === null || _f === void 0 ? void 0 : _f.lng,
            },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, profilePhoto: true },
                },
            },
        });
    }
    async findMyOrders(userId, userRole) {
        let where;
        console.log('[OrdersService.findMyOrders] Buscando pedidos:', { userId, userRole });
        const isDriver = (userRole === null || userRole === void 0 ? void 0 : userRole.toUpperCase()) === 'DRIVER';
        if (isDriver) {
            where = {
                OR: [
                    { driverId: userId },
                    {
                        tripId: null,
                        status: { in: ['PENDING', 'ACCEPTED'] },
                    },
                ],
            };
        }
        else {
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
        return orders.map(order => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                id: order.id,
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                tripId: order.tripId,
                customerId: order.customerId,
                driverId: order.driverId,
                tripOrigin: ((_a = order.trip) === null || _a === void 0 ? void 0 : _a.originName) || order.originName || '',
                tripDestination: ((_b = order.trip) === null || _b === void 0 ? void 0 : _b.destName) || order.destName || '',
                tripDate: ((_d = (_c = order.trip) === null || _c === void 0 ? void 0 : _c.departureAt) === null || _d === void 0 ? void 0 : _d.toLocaleDateString('pt-BR')) || new Date(order.createdAt).toLocaleDateString('pt-BR'),
                description: order.description,
                weight: order.weight,
                estimatedPrice: order.estimatedPrice,
                notes: order.notes,
                customer: order.customer,
                driver: order.driver,
                originLat: order.originLat,
                originLng: order.originLng,
                destLat: order.destLat,
                destLng: order.destLng,
                isStandalone: !order.driverId,
                cancellationReason: order.cancellationReason,
                cancelledBy: order.cancelledBy,
                cancelledAt: (_e = order.cancelledAt) === null || _e === void 0 ? void 0 : _e.toISOString(),
                rejectionReason: order.rejectionReason,
                rejectedAt: (_f = order.rejectedAt) === null || _f === void 0 ? void 0 : _f.toISOString(),
            });
        });
    }
    async findOne(id, userId) {
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
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        const isCustomer = order.customerId === userId;
        const isAssignedDriver = order.driverId === userId;
        const isStandaloneOrder = !order.driverId && order.status === 'PENDING';
        if (!isCustomer && !isAssignedDriver && !isStandaloneOrder) {
            throw new common_1.ForbiddenException('Voce nao tem acesso a este pedido');
        }
        return order;
    }
    async accept(id, driverId) {
        console.log('[OrdersService.accept] Iniciando aceitação:', { orderId: id, driverId });
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        console.log('[OrdersService.accept] Pedido encontrado:', {
            orderId: order.id,
            currentDriverId: order.driverId,
            tripId: order.tripId,
            status: order.status
        });
        if (order.tripId && order.driverId && order.driverId !== driverId) {
            throw new common_1.ForbiddenException('Voce nao pode aceitar este pedido');
        }
        if (order.tripId && order.status !== 'PENDING') {
            throw new common_1.BadRequestException('Este pedido nao pode ser aceito');
        }
        if (!order.tripId && !['PENDING', 'ACCEPTED'].includes(order.status)) {
            throw new common_1.BadRequestException('Este pedido nao esta mais disponivel');
        }
        const isFirstAcceptance = !order.driverId;
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: Object.assign(Object.assign({}, (isFirstAcceptance && { driverId })), { status: 'ACCEPTED', acceptedAt: order.acceptedAt || new Date() }),
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
        return Object.assign(Object.assign({}, updatedOrder), { isFirstAcceptance, message: isFirstAcceptance
                ? 'Pedido aceito! Voce foi o primeiro motorista a aceitar.'
                : 'Interesse registrado! O cliente ja recebeu outra proposta, mas voce pode conversar com ele.' });
    }
    async reject(id, driverId, reason) {
        var _a;
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { trip: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        const isAssignedDriver = order.driverId === driverId;
        const isTripDriver = ((_a = order.trip) === null || _a === void 0 ? void 0 : _a.driverId) === driverId;
        const user = await this.prisma.user.findUnique({
            where: { id: driverId },
            select: { role: true },
        });
        const isDriverOnStandaloneOrder = (user === null || user === void 0 ? void 0 : user.role) === 'DRIVER' && !order.driverId;
        if (!isAssignedDriver && !isTripDriver && !isDriverOnStandaloneOrder) {
            throw new common_1.ForbiddenException('Voce nao pode recusar este pedido');
        }
        if (order.status !== 'PENDING') {
            throw new common_1.BadRequestException('Este pedido nao pode ser recusado');
        }
        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectionReason: reason,
                driverId: driverId,
            },
        });
    }
    async cancel(id, userId, reason) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        const isCustomer = order.customerId === userId;
        const isDriver = order.driverId === userId;
        if (!isCustomer && !isDriver) {
            throw new common_1.ForbiddenException('Voce nao pode cancelar este pedido');
        }
        if (isCustomer && ['COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw new common_1.BadRequestException('Este pedido nao pode ser cancelado');
        }
        if (isDriver && !['PENDING', 'ACCEPTED'].includes(order.status)) {
            throw new common_1.BadRequestException('Este pedido nao pode ser cancelado');
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
    async startProgress(id, driverId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        if (order.driverId !== driverId) {
            throw new common_1.ForbiddenException('Voce nao pode iniciar este pedido');
        }
        if (order.status !== 'ACCEPTED') {
            throw new common_1.BadRequestException('Este pedido nao pode ser iniciado');
        }
        return this.prisma.order.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });
    }
    async complete(id, driverId, finalPrice) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        if (order.driverId !== driverId) {
            throw new common_1.ForbiddenException('Voce nao pode concluir este pedido');
        }
        if (order.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Este pedido nao pode ser concluido');
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
    async reopen(id, customerId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        if (order.customerId !== customerId) {
            throw new common_1.ForbiddenException('Voce nao pode reabrir este pedido');
        }
        if (!['CANCELLED', 'REJECTED'].includes(order.status)) {
            throw new common_1.BadRequestException('Este pedido nao pode ser reaberto');
        }
        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'PENDING',
                cancellationReason: null,
                cancelledBy: null,
                cancelledAt: null,
                rejectionReason: null,
                rejectedAt: null,
                driverId: order.cancelledBy === 'customer' ? order.driverId : null,
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
    async countPendingOrders(userId, userRole) {
        let where;
        if (userRole === 'DRIVER') {
            where = {
                status: 'PENDING',
                readAt: null,
                OR: [
                    { driverId: userId },
                    { driverId: null },
                ],
            };
        }
        else {
            where = { customerId: userId, status: 'PENDING', readAt: null };
        }
        return this.prisma.order.count({ where });
    }
    async markAsRead(userId, userRole) {
        const where = userRole === 'DRIVER'
            ? { driverId: userId, readAt: null }
            : { customerId: userId, readAt: null };
        await this.prisma.order.updateMany({
            where,
            data: { readAt: new Date() },
        });
        return { success: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map