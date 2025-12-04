import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Shipment } from '@prisma/client';

@Injectable()
export class ShipmentsService {
    private blacklist = ['drugs', 'weapons', 'bomb', 'illegal'];

    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.ShipmentCreateInput): Promise<Shipment> {
        // Policy check
        if (this.containsBlacklistedKeywords(data.description)) {
            throw new BadRequestException('Shipment description contains prohibited items.');
        }

        return this.prisma.shipment.create({ data });
    }

    async findAll(userId: string): Promise<Shipment[]> {
        return this.prisma.shipment.findMany({ where: { clientId: userId } });
    }

    async findOne(id: string): Promise<Shipment | null> {
        return this.prisma.shipment.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: any): Promise<Shipment> {
        return this.prisma.shipment.update({
            where: { id },
            data: { status },
        });
    }

    private containsBlacklistedKeywords(text: string): boolean {
        const lowerText = text.toLowerCase();
        return this.blacklist.some((word) => lowerText.includes(word));
    }
}
