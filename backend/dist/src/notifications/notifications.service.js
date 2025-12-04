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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    }
    async sendToUser(userId, title, body, data, channelId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, name: true },
        });
        if (!(user === null || user === void 0 ? void 0 : user.pushToken)) {
            console.log(`[NotificationsService] Usuário ${userId} não tem push token`);
            return false;
        }
        return this.sendPushNotification({
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data,
            channelId: channelId || 'default',
            priority: 'high',
        });
    }
    async sendMessageNotification(recipientId, senderName, messagePreview, orderId, conversationData) {
        const truncatedMessage = messagePreview.length > 100
            ? messagePreview.substring(0, 100) + '...'
            : messagePreview;
        return this.sendToUser(recipientId, `Nova mensagem de ${senderName}`, truncatedMessage, Object.assign({ type: 'message', orderId }, conversationData), 'messages');
    }
    async sendOrderNotification(recipientId, title, body, orderId, orderData) {
        return this.sendToUser(recipientId, title, body, Object.assign({ type: 'order', orderId }, orderData), 'orders');
    }
    async sendPushNotification(message) {
        var _a;
        if (!message.to.startsWith('ExponentPushToken[')) {
            console.log(`[NotificationsService] Token inválido: ${message.to}`);
            return false;
        }
        try {
            console.log(`[NotificationsService] Enviando notificação para ${message.to}:`, {
                title: message.title,
                body: message.body,
            });
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
            const result = await response.json();
            if (((_a = result.data) === null || _a === void 0 ? void 0 : _a.status) === 'ok') {
                console.log(`[NotificationsService] Notificação enviada com sucesso`);
                return true;
            }
            else {
                console.error(`[NotificationsService] Erro ao enviar notificação:`, result);
                return false;
            }
        }
        catch (error) {
            console.error(`[NotificationsService] Erro ao enviar notificação:`, error);
            return false;
        }
    }
    async sendToMultipleUsers(userIds, title, body, data, channelId) {
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                pushToken: { not: null },
            },
            select: { id: true, pushToken: true },
        });
        await Promise.all(users.map(user => this.sendPushNotification({
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data,
            channelId: channelId || 'default',
            priority: 'high',
        })));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map