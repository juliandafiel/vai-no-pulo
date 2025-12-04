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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const BLOCKED_STATUSES = ['CANCELLED', 'REJECTED', 'COMPLETED'];
let MessagesService = class MessagesService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    isChatBlocked(status) {
        return BLOCKED_STATUSES.includes(status);
    }
    getBlockedMessage(status) {
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
    async getOrCreateConversation(orderId, customerId, driverId) {
        let conversation = await this.prisma.conversation.findUnique({
            where: {
                orderId_driverId: {
                    orderId,
                    driverId,
                },
            },
        });
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
    async create(data, senderId) {
        var _a, _b;
        const order = await this.prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
                trip: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        if (this.isChatBlocked(order.status)) {
            throw new common_1.BadRequestException(this.getBlockedMessage(order.status));
        }
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { role: true },
        });
        const isCustomer = order.customerId === senderId;
        const isDriver = (sender === null || sender === void 0 ? void 0 : sender.role) === 'DRIVER';
        let driverId;
        if (isCustomer) {
            if (data.driverId) {
                driverId = data.driverId;
            }
            else if (order.driverId) {
                driverId = order.driverId;
            }
            else {
                throw new common_1.ForbiddenException('Especifique o motorista para enviar a mensagem');
            }
        }
        else if (isDriver) {
            driverId = senderId;
        }
        else {
            throw new common_1.ForbiddenException('Voce nao tem acesso a este chat');
        }
        const conversation = await this.getOrCreateConversation(data.orderId, order.customerId, driverId);
        console.log('[MessagesService.create] Enviando mensagem:', {
            senderId,
            conversationId: conversation.id,
            orderId: data.orderId,
            driverId,
        });
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
        const recipientId = isCustomer ? driverId : order.customerId;
        const senderName = message.sender.name;
        this.notificationsService.sendMessageNotification(recipientId, senderName, data.content, data.orderId, {
            driverId,
            tripOrigin: ((_a = order.trip) === null || _a === void 0 ? void 0 : _a.originName) || order.originName || '',
            tripDestination: ((_b = order.trip) === null || _b === void 0 ? void 0 : _b.destName) || order.destName || '',
        }).catch(error => {
            console.error('[MessagesService] Erro ao enviar notificação:', error);
        });
        return message;
    }
    async findByConversation(orderId, visitorId, driverId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                trip: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido nao encontrado');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: visitorId },
            select: { role: true },
        });
        const isCustomer = order.customerId === visitorId;
        const isDriver = (user === null || user === void 0 ? void 0 : user.role) === 'DRIVER';
        let conversationDriverId;
        if (isCustomer) {
            if (driverId) {
                conversationDriverId = driverId;
            }
            else if (order.driverId) {
                conversationDriverId = order.driverId;
            }
            else {
                return [];
            }
        }
        else if (isDriver) {
            conversationDriverId = visitorId;
        }
        else {
            throw new common_1.ForbiddenException('Voce nao tem acesso a este chat');
        }
        const conversation = await this.prisma.conversation.findUnique({
            where: {
                orderId_driverId: {
                    orderId,
                    driverId: conversationDriverId,
                },
            },
        });
        if (!conversation) {
            return [];
        }
        await this.prisma.message.updateMany({
            where: {
                conversationId: conversation.id,
                senderId: { not: visitorId },
                read: false,
            },
            data: { read: true },
        });
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
    async findByOrder(orderId, userId, driverId) {
        return this.findByConversation(orderId, userId, driverId);
    }
    async getConversations(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const isDriver = (user === null || user === void 0 ? void 0 : user.role) === 'DRIVER';
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
        const result = await Promise.all(conversations.map(async (conv) => {
            var _a, _b;
            let otherUser;
            if (isDriver) {
                otherUser = conv.order.customer;
            }
            else {
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
                tripOrigin: ((_a = conv.order.trip) === null || _a === void 0 ? void 0 : _a.originName) || conv.order.originName || '',
                tripDestination: ((_b = conv.order.trip) === null || _b === void 0 ? void 0 : _b.destName) || conv.order.destName || '',
                lastMessage: lastMessage
                    ? {
                        content: lastMessage.content,
                        createdAt: lastMessage.createdAt.toISOString(),
                        isFromMe: lastMessage.senderId === userId,
                    }
                    : null,
                status: conv.order.status,
            };
        }));
        return result;
    }
    async countUnread(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const isDriver = (user === null || user === void 0 ? void 0 : user.role) === 'DRIVER';
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map