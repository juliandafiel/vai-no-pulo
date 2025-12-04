import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
interface CreateMessageDto {
    orderId: string;
    driverId?: string;
    content: string;
}
export declare class MessagesService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private isChatBlocked;
    private getBlockedMessage;
    private getOrCreateConversation;
    create(data: CreateMessageDto, senderId: string): Promise<{
        sender: {
            id: string;
            name: string;
            profilePhoto: string;
        };
    } & {
        id: string;
        content: string;
        read: boolean;
        createdAt: Date;
        conversationId: string | null;
        senderId: string;
        orderId: string | null;
    }>;
    findByConversation(orderId: string, visitorId: string, driverId?: string): Promise<({
        sender: {
            id: string;
            name: string;
            profilePhoto: string;
        };
    } & {
        id: string;
        content: string;
        read: boolean;
        createdAt: Date;
        conversationId: string | null;
        senderId: string;
        orderId: string | null;
    })[]>;
    findByOrder(orderId: string, userId: string, driverId?: string): Promise<({
        sender: {
            id: string;
            name: string;
            profilePhoto: string;
        };
    } & {
        id: string;
        content: string;
        read: boolean;
        createdAt: Date;
        conversationId: string | null;
        senderId: string;
        orderId: string | null;
    })[]>;
    getConversations(userId: string): Promise<{
        conversationId: string;
        orderId: string;
        driverId: string;
        otherUser: any;
        tripOrigin: string;
        tripDestination: string;
        lastMessage: {
            content: string;
            createdAt: string;
            isFromMe: boolean;
        };
        status: import(".prisma/client").$Enums.OrderStatus;
    }[]>;
    countUnread(userId: string): Promise<number>;
}
export {};
