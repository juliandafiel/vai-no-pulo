import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(createMessageDto: {
        orderId: string;
        driverId?: string;
        content: string;
    }, req: any): Promise<{
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
    getConversations(req: any): Promise<{
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
    getUnreadCount(req: any): Promise<number>;
    getOrderMessages(orderId: string, driverId: string, req: any): Promise<({
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
}
