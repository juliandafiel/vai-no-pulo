import { TripsService } from './trips.service';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    create(createTripDto: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripStatus;
        driverId: string;
        originName: string;
        originLat: number;
        originLng: number;
        destName: string;
        destLat: number;
        destLng: number;
        departureAt: Date;
        lastLocation: import("@prisma/client/runtime/library").JsonValue | null;
        vehicleId: string;
    }>;
    findAll(query: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripStatus;
        driverId: string;
        originName: string;
        originLat: number;
        originLng: number;
        destName: string;
        destLat: number;
        destLng: number;
        departureAt: Date;
        lastLocation: import("@prisma/client/runtime/library").JsonValue | null;
        vehicleId: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripStatus;
        driverId: string;
        originName: string;
        originLat: number;
        originLng: number;
        destName: string;
        destLat: number;
        destLng: number;
        departureAt: Date;
        lastLocation: import("@prisma/client/runtime/library").JsonValue | null;
        vehicleId: string;
    }>;
}
