import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Object as PrismaObject } from '@prisma/client';

@Injectable()
export class ObjectsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.ObjectCreateInput): Promise<PrismaObject> {
        return this.prisma.object.create({ data });
    }

    async findAll(userId: string): Promise<PrismaObject[]> {
        return this.prisma.object.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string): Promise<PrismaObject> {
        const object = await this.prisma.object.findUnique({
            where: { id },
        });

        if (!object) {
            throw new NotFoundException('Objeto não encontrado');
        }

        if (object.userId !== userId) {
            throw new ForbiddenException('Você não tem permissão para acessar este objeto');
        }

        return object;
    }

    async update(id: string, userId: string, data: Prisma.ObjectUpdateInput): Promise<PrismaObject> {
        const object = await this.findOne(id, userId);

        return this.prisma.object.update({
            where: { id: object.id },
            data,
        });
    }

    async delete(id: string, userId: string): Promise<PrismaObject> {
        const object = await this.findOne(id, userId);

        return this.prisma.object.delete({
            where: { id: object.id },
        });
    }
}
