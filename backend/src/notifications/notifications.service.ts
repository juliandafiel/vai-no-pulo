import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ExpoPushMessage {
    to: string;
    sound?: 'default' | null;
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
    priority?: 'default' | 'normal' | 'high';
    badge?: number;
}

interface ExpoPushTicket {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: { error?: string };
}

@Injectable()
export class NotificationsService {
    private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    constructor(private prisma: PrismaService) { }

    /**
     * Envia uma notificação push para um usuário específico
     */
    async sendToUser(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, any>,
        channelId?: string
    ): Promise<boolean> {
        // Busca o push token do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, name: true },
        });

        if (!user?.pushToken) {
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

    /**
     * Envia notificação de nova mensagem
     */
    async sendMessageNotification(
        recipientId: string,
        senderName: string,
        messagePreview: string,
        orderId: string,
        conversationData?: {
            driverId?: string;
            tripOrigin?: string;
            tripDestination?: string;
        }
    ): Promise<boolean> {
        const truncatedMessage = messagePreview.length > 100
            ? messagePreview.substring(0, 100) + '...'
            : messagePreview;

        return this.sendToUser(
            recipientId,
            `Nova mensagem de ${senderName}`,
            truncatedMessage,
            {
                type: 'message',
                orderId,
                ...conversationData,
            },
            'messages'
        );
    }

    /**
     * Envia notificação de novo pedido
     */
    async sendOrderNotification(
        recipientId: string,
        title: string,
        body: string,
        orderId: string,
        orderData?: Record<string, any>
    ): Promise<boolean> {
        return this.sendToUser(
            recipientId,
            title,
            body,
            {
                type: 'order',
                orderId,
                ...orderData,
            },
            'orders'
        );
    }

    /**
     * Envia a notificação push via Expo Push API
     */
    private async sendPushNotification(message: ExpoPushMessage): Promise<boolean> {
        // Valida o formato do token Expo
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

            const result = await response.json() as { data: ExpoPushTicket };

            if (result.data?.status === 'ok') {
                console.log(`[NotificationsService] Notificação enviada com sucesso`);
                return true;
            } else {
                console.error(`[NotificationsService] Erro ao enviar notificação:`, result);
                return false;
            }
        } catch (error) {
            console.error(`[NotificationsService] Erro ao enviar notificação:`, error);
            return false;
        }
    }

    /**
     * Envia notificações para múltiplos usuários
     */
    async sendToMultipleUsers(
        userIds: string[],
        title: string,
        body: string,
        data?: Record<string, any>,
        channelId?: string
    ): Promise<void> {
        // Busca os push tokens de todos os usuários
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                pushToken: { not: null },
            },
            select: { id: true, pushToken: true },
        });

        // Envia notificações em paralelo
        await Promise.all(
            users.map(user =>
                this.sendPushNotification({
                    to: user.pushToken!,
                    sound: 'default',
                    title,
                    body,
                    data,
                    channelId: channelId || 'default',
                    priority: 'high',
                })
            )
        );
    }
}
