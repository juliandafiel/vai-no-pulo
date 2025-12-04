import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly EXPO_PUSH_URL;
    constructor(prisma: PrismaService);
    sendToUser(userId: string, title: string, body: string, data?: Record<string, any>, channelId?: string): Promise<boolean>;
    sendMessageNotification(recipientId: string, senderName: string, messagePreview: string, orderId: string, conversationData?: {
        driverId?: string;
        tripOrigin?: string;
        tripDestination?: string;
    }): Promise<boolean>;
    sendOrderNotification(recipientId: string, title: string, body: string, orderId: string, orderData?: Record<string, any>): Promise<boolean>;
    private sendPushNotification;
    sendToMultipleUsers(userIds: string[], title: string, body: string, data?: Record<string, any>, channelId?: string): Promise<void>;
}
