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
exports.VehicleChangeRequestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let VehicleChangeRequestService = class VehicleChangeRequestService {
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async create(driverId, data) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: data.vehicleId,
                driverId: driverId,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Veículo não encontrado ou não pertence a você');
        }
        const existingRequest = await this.prisma.vehicleChangeRequest.findFirst({
            where: {
                vehicleId: data.vehicleId,
                status: 'PENDING',
            },
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('Já existe uma solicitação de alteração pendente para este veículo');
        }
        const changeRequest = await this.prisma.vehicleChangeRequest.create({
            data: {
                vehicleId: data.vehicleId,
                driverId: driverId,
                newPlate: data.newPlate,
                newModel: data.newModel,
                newBrand: data.newBrand,
                newYear: data.newYear,
                newColor: data.newColor,
                newCapacityKg: data.newCapacityKg,
                newCapacityM3: data.newCapacityM3,
                newDocuments: data.newDocuments,
                newVehiclePhoto: data.newVehiclePhoto,
            },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        await this.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: { hasPendingChange: true },
        });
        return changeRequest;
    }
    async findByDriver(driverId) {
        return this.prisma.vehicleChangeRequest.findMany({
            where: { driverId },
            include: {
                vehicle: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAllPending() {
        return this.prisma.vehicleChangeRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findAll(status) {
        return this.prisma.vehicleChangeRequest.findMany({
            where: status ? { status } : undefined,
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Solicitação não encontrada');
        }
        return request;
    }
    async review(id, adminId, data) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Solicitação não encontrada');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('Esta solicitação já foi processada');
        }
        if (data.status === 'REJECTED' && !data.rejectionReason) {
            throw new common_1.BadRequestException('Motivo da rejeição é obrigatório');
        }
        const updatedRequest = await this.prisma.vehicleChangeRequest.update({
            where: { id },
            data: {
                status: data.status,
                rejectionReason: data.rejectionReason,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
        if (data.status === 'APPROVED') {
            const updateData = {};
            if (request.newPlate)
                updateData.plate = request.newPlate;
            if (request.newModel)
                updateData.model = request.newModel;
            if (request.newBrand)
                updateData.brand = request.newBrand;
            if (request.newYear)
                updateData.year = request.newYear;
            if (request.newColor)
                updateData.color = request.newColor;
            if (request.newCapacityKg !== null)
                updateData.capacityKg = request.newCapacityKg;
            if (request.newCapacityM3 !== null)
                updateData.capacityM3 = request.newCapacityM3;
            if (request.newDocuments)
                updateData.documents = request.newDocuments;
            if (request.newVehiclePhoto)
                updateData.vehiclePhoto = request.newVehiclePhoto;
            await this.prisma.vehicle.update({
                where: { id: request.vehicleId },
                data: Object.assign(Object.assign({}, updateData), { hasPendingChange: false }),
            });
            try {
                await this.mailService.sendVehicleChangeApprovedEmail(request.driver.email, request.driver.name, request.vehicle.model, request.vehicle.plate, data.adminMessage);
            }
            catch (error) {
                console.error('Erro ao enviar email de aprovação:', error);
            }
        }
        else {
            await this.prisma.vehicle.update({
                where: { id: request.vehicleId },
                data: { hasPendingChange: false },
            });
            try {
                await this.mailService.sendVehicleChangeRejectedEmail(request.driver.email, request.driver.name, request.vehicle.model, request.vehicle.plate, data.rejectionReason);
            }
            catch (error) {
                console.error('Erro ao enviar email de rejeição:', error);
            }
        }
        return updatedRequest;
    }
    async cancel(id, driverId) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new common_1.NotFoundException('Solicitação não encontrada');
        }
        if (request.driverId !== driverId) {
            throw new common_1.ForbiddenException('Você não tem permissão para cancelar esta solicitação');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('Apenas solicitações pendentes podem ser canceladas');
        }
        await this.prisma.vehicle.update({
            where: { id: request.vehicleId },
            data: { hasPendingChange: false },
        });
        await this.prisma.vehicleChangeRequest.delete({
            where: { id },
        });
        return { message: 'Solicitação cancelada com sucesso' };
    }
    async hasPendingRequest(vehicleId) {
        const request = await this.prisma.vehicleChangeRequest.findFirst({
            where: {
                vehicleId,
                status: 'PENDING',
            },
        });
        return !!request;
    }
};
exports.VehicleChangeRequestService = VehicleChangeRequestService;
exports.VehicleChangeRequestService = VehicleChangeRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], VehicleChangeRequestService);
//# sourceMappingURL=vehicle-change-request.service.js.map