import { ShipmentsService } from './shipments.service';
export declare class ShipmentsController {
    private readonly shipmentsService;
    constructor(shipmentsService: ShipmentsService);
    create(createShipmentDto: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        tripId: string | null;
        pickupAddress: string;
        clientId: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
    }>;
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        tripId: string | null;
        pickupAddress: string;
        clientId: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
    }[]>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        tripId: string | null;
        pickupAddress: string;
        clientId: string;
        weightKg: number;
        volumeM3: number;
        pickupLat: number;
        pickupLng: number;
        deliverLat: number | null;
        deliverLng: number | null;
        deliverAddress: string | null;
        photos: import("@prisma/client/runtime/library").JsonValue;
        policyAccepted: boolean;
    }>;
}
