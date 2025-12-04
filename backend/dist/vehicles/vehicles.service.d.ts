import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Vehicle } from '@prisma/client';
export declare class VehiclesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.VehicleCreateInput): Promise<Vehicle>;
    findAll(): Promise<Vehicle[]>;
    findOne(id: string): Promise<Vehicle | null>;
    updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminId: string): Promise<Vehicle>;
}
