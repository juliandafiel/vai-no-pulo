import { Server, Socket } from 'socket.io';
import { TripsService } from '../trips/trips.service';
export declare class AppGateway {
    private tripsService;
    server: Server;
    constructor(tripsService: TripsService);
    handleJoinTrip(data: {
        tripId: string;
    }, client: Socket): {
        event: string;
        tripId: string;
    };
    handleUpdateLocation(data: {
        tripId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
    handleChatMessage(data: {
        tripId: string;
        message: string;
        sender: string;
    }): void;
}
