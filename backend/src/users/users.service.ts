import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: any) {
        // Não faz hash aqui porque já foi hasheado no AuthService
        return this.prisma.user.create({
            data: {
                ...data,
            },
        });
    }

    async findByGoogleId(googleId: string) {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }

    async updateGoogleId(userId: string, googleId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { googleId },
        });
    }

    async createFromGoogle(data: { googleId: string; email: string; name: string; verifiedEmail: boolean }) {
        return this.prisma.user.create({
            data,
        });
    }

    async findAll(status?: string, role?: string) {
        const where: any = {};

        if (status) {
            where.profileStatus = status;
        }

        if (role) {
            where.role = role;
        }

        return this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profileStatus: true,
                profilePhoto: true,
                createdAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                // Campos de documentos
                cpf: true,
                rg: true,
                birthDate: true,
                cnh: true,
                cnhCategory: true,
                cnhExpiry: true,
                documentType: true,
                documentNumber: true,
                documentFront: true,
                documentBack: true,
            },
        });
    }

    async approve(userId: string, adminId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                profileStatus: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: adminId,
                rejectedAt: null,
                rejectionReason: null,
            },
        });
    }

    async reject(userId: string, reason: string, adminId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                profileStatus: 'REJECTED',
                rejectedAt: new Date(),
                rejectionReason: reason,
                approvedAt: null,
                approvedBy: null,
            },
        });
    }

    async countPending() {
        const count = await this.prisma.user.count({
            where: { profileStatus: 'PENDING' },
        });

        return { count };
    }

    async updateProfile(userId: string, data: { name?: string; birthDate?: string; profilePhoto?: string }) {
        const updateData: any = {};

        if (data.name) updateData.name = data.name;
        if (data.birthDate) updateData.birthDate = data.birthDate;
        if (data.profilePhoto) updateData.profilePhoto = data.profilePhoto;

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profilePhoto: true,
                birthDate: true,
            },
        });

        // Mapeia role para userType
        const userType = user.role === 'DRIVER' ? 'driver' : 'customer';

        return { ...user, userType };
    }

    async updateById(userId: string, data: Partial<User>) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profilePhoto: true,
                birthDate: true,
                documentType: true,
                documentFront: true,
                documentBack: true,
            },
        });
    }

    async updatePushToken(userId: string, pushToken: string | null) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });

        console.log(`[UsersService] Push token ${pushToken ? 'salvo' : 'removido'} para usuário ${userId}`);

        return { success: true };
    }

    async getPushToken(userId: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true },
        });

        return user?.pushToken || null;
    }
}
