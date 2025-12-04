import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Shipment } from '@prisma/client';
export declare class ShipmentsService {
    private prisma;
    private blacklist;
    constructor(prisma: PrismaService);
    create(data: Prisma.ShipmentCreateInput): Promise<Shipment>;
    findAll(userId: string): Promise<Shipment[]>;
    findOne(id: string): Promise<Shipment | null>;
    updateStatus(id: string, status: any): Promise<Shipment>;
    private containsBlacklistedKeywords;
}
