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
exports.ObjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ObjectsService = class ObjectsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.object.create({ data });
    }
    async findAll(userId) {
        return this.prisma.object.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const object = await this.prisma.object.findUnique({
            where: { id },
        });
        if (!object) {
            throw new common_1.NotFoundException('Objeto não encontrado');
        }
        if (object.userId !== userId) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar este objeto');
        }
        return object;
    }
    async update(id, userId, data) {
        const object = await this.findOne(id, userId);
        return this.prisma.object.update({
            where: { id: object.id },
            data,
        });
    }
    async delete(id, userId) {
        const object = await this.findOne(id, userId);
        return this.prisma.object.delete({
            where: { id: object.id },
        });
    }
};
exports.ObjectsService = ObjectsService;
exports.ObjectsService = ObjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ObjectsService);
//# sourceMappingURL=objects.service.js.map