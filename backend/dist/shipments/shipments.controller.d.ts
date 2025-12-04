import { ShipmentsService } from './shipments.service';
export declare class ShipmentsController {
    private readonly shipmentsService;
    constructor(shipmentsService: ShipmentsService);
    create(createShipmentDto: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        description: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        pickupAddress: string;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
        tripId: string | null;
        clientId: string;
    }>;
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        description: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        pickupAddress: string;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
        tripId: string | null;
        clientId: string;
    }[]>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        description: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        pickupAddress: string;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
        tripId: string | null;
        clientId: string;
    }>;
}
