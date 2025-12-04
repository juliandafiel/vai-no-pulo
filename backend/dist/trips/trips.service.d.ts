import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Trip } from '@prisma/client';
export declare class TripsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.TripCreateInput): Promise<Trip>;
    findAll(query: any): Promise<Trip[]>;
    findOne(id: string): Promise<Trip | null>;
    updateLocation(id: string, lat: number, lng: number): Promise<{
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
        lastLocation: Prisma.JsonValue | null;
        vehicleId: string;
    }>;
}
