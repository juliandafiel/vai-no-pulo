"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.user.create({
            data: Object.assign({}, data),
        });
    }
    async findByGoogleId(googleId) {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }
    async updateGoogleId(userId, googleId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { googleId },
        });
    }
    async createFromGoogle(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async findAll(status, role) {
        const where = {};
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
    async approve(userId, adminId) {
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
    async reject(userId, reason, adminId) {
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
    async updateProfile(userId, data) {
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.birthDate)
            updateData.birthDate = data.birthDate;
        if (data.profilePhoto)
            updateData.profilePhoto = data.profilePhoto;
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
        const userType = user.role === 'DRIVER' ? 'driver' : 'customer';
        return Object.assign(Object.assign({}, user), { userType });
    }
    async updateById(userId, data) {
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
    async updatePushToken(userId, pushToken) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });
        console.log(`[UsersService] Push token ${pushToken ? 'salvo' : 'removido'} para usuário ${userId}`);
        return { success: true };
    }
    async getPushToken(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true },
        });
        return (user === null || user === void 0 ? void 0 : user.pushToken) || null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map