import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Object as PrismaObject } from '@prisma/client';
export declare class ObjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ObjectCreateInput): Promise<PrismaObject>;
    findAll(userId: string): Promise<PrismaObject[]>;
    findOne(id: string, userId: string): Promise<PrismaObject>;
    update(id: string, userId: string, data: Prisma.ObjectUpdateInput): Promise<PrismaObject>;
    delete(id: string, userId: string): Promise<PrismaObject>;
}
