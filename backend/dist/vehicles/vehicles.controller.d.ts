import { VehiclesService } from './vehicles.service';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    create(createVehicleDto: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        plate: string;
        model: string;
        capacityKg: number;
        capacityM3: number;
        documents: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.VehicleStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        driverId: string;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        plate: string;
        model: string;
        capacityKg: number;
        capacityM3: number;
        documents: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.VehicleStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        driverId: string;
    }[]>;
    approve(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        plate: string;
        model: string;
        capacityKg: number;
        capacityM3: number;
        documents: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.VehicleStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        driverId: string;
    }>;
    reject(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        plate: string;
        model: string;
        capacityKg: number;
        capacityM3: number;
        documents: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.VehicleStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        driverId: string;
    }>;
}
