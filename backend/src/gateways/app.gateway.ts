import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TripsService } from '../trips/trips.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class AppGateway {
    @WebSocketServer()
    server: Server;

    constructor(private tripsService: TripsService) { }

    @SubscribeMessage('joinTrip')
    handleJoinTrip(@MessageBody() data: { tripId: string }, @ConnectedSocket() client: Socket) {
        client.join(`trip:${data.tripId}`);
        return { event: 'joined', tripId: data.tripId };
    }

    @SubscribeMessage('updateLocation')
    async handleUpdateLocation(@MessageBody() data: { tripId: string; lat: number; lng: number }) {
        await this.tripsService.updateLocation(data.tripId, data.lat, data.lng);
        this.server.to(`trip:${data.tripId}`).emit('locationUpdated', data);
    }

    @SubscribeMessage('chatMessage')
    handleChatMessage(@MessageBody() data: { tripId: string; message: string; sender: string }) {
        this.server.to(`trip:${data.tripId}`).emit('newChatMessage', data);
    }
}
