import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface CreateMessageDto {
    orderId: string;
    driverId?: string; // ID do motorista para conversas específicas
    content: string;
}

// Status que bloqueiam o envio de mensagens
const BLOCKED_STATUSES = ['CANCELLED', 'REJECTED', 'COMPLETED'];

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    // Verifica se o chat está bloqueado baseado no status do pedido
    private isChatBlocked(status: string): boolean {
        return BLOCKED_STATUSES.includes(status);
    }

    // Retorna mensagem de erro apropriada para cada status
    private getBlockedMessage(status: string): string {
        switch (status) {
            case 'CANCELLED':
                return 'Este pedido foi cancelado. O chat esta bloqueado.';
            case 'REJECTED':
                return 'Este pedido foi recusado. O chat esta bloqueado.';
            case 'COMPLETED':
                return 'Este pedido foi concluido. O chat esta bloqueado.';
            default:
                return 'O chat esta bloqueado para este pedido.';
        }
    }

    // Obtém ou cria uma conversa entre cliente e motorista para um pedido
    private async getOrCreateConversation(orderId: string, customerId: string, driverId: string) {
        // Tenta encontrar uma conversa existente
        let conversation = await this.prisma.conversation.findUnique({
            where: {
                orderId_driverId: {
                    orderId,
                    driverId,
                },
            },
        });

        // Se não existe, cria uma nova
        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    orderId,
                    customerId,
                    driverId,
                },
            });
            console.log('[MessagesService] Nova conversa criada:', conversation.id);
        }

        return conversation;
    }

    async create(data: CreateMessageDto, senderId: string) {
        // Verifica se o pedido existe
        const order = await this.prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
                trip: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Verifica se o chat está bloqueado
        if (this.isChatBlocked(order.status)) {
            throw new BadRequestException(this.getBlockedMessage(order.status));
        }

        // Busca informações do remetente
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { role: true },
        });

        const isCustomer = order.customerId === senderId;
        const isDriver = sender?.role === 'DRIVER';

        // Determina quem é o motorista na conversa
        let driverId: string;

        if (isCustomer) {
            // Cliente enviando mensagem - precisa especificar para qual motorista
            if (data.driverId) {
                driverId = data.driverId;
            } else if (order.driverId) {
                // Se o pedido já tem motorista atribuído, usa ele
                driverId = order.driverId;
            } else {
                throw new ForbiddenException('Especifique o motorista para enviar a mensagem');
            }
        } else if (isDriver) {
            // Motorista enviando mensagem
            driverId = senderId;
        } else {
            throw new ForbiddenException('Voce nao tem acesso a este chat');
        }

        // Obtém ou cria a conversa
        const conversation = await this.getOrCreateConversation(
            data.orderId,
            order.customerId,
            driverId
        );

        console.log('[MessagesService.create] Enviando mensagem:', {
            senderId,
            conversationId: conversation.id,
            orderId: data.orderId,
            driverId,
        });

        // Cria a mensagem na conversa
        const message = await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                orderId: data.orderId,
                senderId,
                content: data.content,
            },
            include: {
                sender: {
                    select: { id: true, name: true, profilePhoto: true },
                },
            },
        });

        // Envia notificação push para o destinatário
        const recipientId = isCustomer ? driverId : order.customerId;
        const senderName = message.sender.name;

        // Envia notificação de forma assíncrona (não bloqueia a resposta)
        this.notificationsService.sendMessageNotification(
            recipientId,
            senderName,
            data.content,
            data.orderId,
            {
                driverId,
                tripOrigin: order.trip?.originName || order.originName || '',
                tripDestination: order.trip?.destName || order.destName || '',
            }
        ).catch(error => {
            console.error('[MessagesService] Erro ao enviar notificação:', error);
        });

        return message;
    }

    async findByConversation(orderId: string, visitorId: string, driverId?: string) {
        // Verifica se o pedido existe
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                trip: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Pedido nao encontrado');
        }

        // Busca informações do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: visitorId },
            select: { role: true },
        });

        const isCustomer = order.customerId === visitorId;
        const isDriver = user?.role === 'DRIVER';

        // Determina qual conversa buscar
        let conversationDriverId: string;

        if (isCustomer) {
            // Cliente vendo mensagens - precisa especificar qual motorista
            if (driverId) {
                conversationDriverId = driverId;
            } else if (order.driverId) {
                conversationDriverId = order.driverId;
            } else {
                // Retorna lista vazia se não tem motorista específico
                return [];
            }
        } else if (isDriver) {
            // Motorista vendo suas próprias mensagens com o cliente
            conversationDriverId = visitorId;
        } else {
            throw new ForbiddenException('Voce nao tem acesso a este chat');
        }

        // Busca a conversa
        const conversation = await this.prisma.conversation.findUnique({
            where: {
                orderId_driverId: {
                    orderId,
                    driverId: conversationDriverId,
                },
            },
        });

        if (!conversation) {
            // Conversa não existe ainda, retorna lista vazia
            return [];
        }

        // Marca mensagens como lidas
        await this.prisma.message.updateMany({
            where: {
                conversationId: conversation.id,
                senderId: { not: visitorId },
                read: false,
            },
            data: { read: true },
        });

        // Retorna as mensagens da conversa
        return this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            include: {
                sender: {
                    select: { id: true, name: true, profilePhoto: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Mantém compatibilidade com a rota antiga
    async findByOrder(orderId: string, userId: string, driverId?: string) {
        return this.findByConversation(orderId, userId, driverId);
    }

    async getConversations(userId: string) {
        // Busca informações do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const isDriver = user?.role === 'DRIVER';

        // Busca todas as conversas do usuário
        const conversations = await this.prisma.conversation.findMany({
            where: isDriver
                ? { driverId: userId }
                : { customerId: userId },
            include: {
                order: {
                    include: {
                        customer: {
                            select: { id: true, name: true, profilePhoto: true },
                        },
                        trip: {
                            select: { originName: true, destName: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Se for motorista, precisa buscar os dados do motorista de cada conversa
        // Se for cliente, busca os dados do motorista
        const result = await Promise.all(
            conversations.map(async (conv) => {
                let otherUser;

                if (isDriver) {
                    // Motorista vê o cliente
                    otherUser = conv.order.customer;
                } else {
                    // Cliente vê o motorista
                    const driver = await this.prisma.user.findUnique({
                        where: { id: conv.driverId },
                        select: { id: true, name: true, profilePhoto: true },
                    });
                    otherUser = driver;
                }

                const lastMessage = conv.messages[0];

                return {
                    conversationId: conv.id,
                    orderId: conv.orderId,
                    driverId: conv.driverId,
                    otherUser,
                    tripOrigin: conv.order.trip?.originName || conv.order.originName || '',
                    tripDestination: conv.order.trip?.destName || conv.order.destName || '',
                    lastMessage: lastMessage
                        ? {
                            content: lastMessage.content,
                            createdAt: lastMessage.createdAt.toISOString(),
                            isFromMe: lastMessage.senderId === userId,
                        }
                        : null,
                    status: conv.order.status,
                };
            })
        );

        return result;
    }

    async countUnread(userId: string) {
        // Busca informações do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const isDriver = user?.role === 'DRIVER';

        // Conta mensagens não lidas nas conversas do usuário
        return this.prisma.message.count({
            where: {
                senderId: { not: userId },
                read: false,
                conversation: isDriver
                    ? { driverId: userId }
                    : { customerId: userId },
            },
        });
    }
}
