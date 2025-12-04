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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let VehiclesService = class VehiclesService {
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async create(data) {
        return this.prisma.vehicle.create({ data });
    }
    async findAll() {
        return this.prisma.vehicle.findMany();
    }
    async findOne(id) {
        return this.prisma.vehicle.findUnique({ where: { id } });
    }
    async findByDriver(driverId) {
        return this.prisma.vehicle.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status, adminId, adminNotes) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                driver: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const updatedVehicle = await this.prisma.vehicle.update({
            where: { id },
            data: {
                status,
                approvedBy: adminId,
                approvedAt: new Date(),
                adminNotes: adminNotes || null,
            },
        });
        if (vehicle === null || vehicle === void 0 ? void 0 : vehicle.driver) {
            try {
                if (status === 'APPROVED') {
                    await this.mailService.sendVehicleApprovedEmail(vehicle.driver.email, vehicle.driver.name, vehicle.model, vehicle.plate, adminNotes);
                }
                else {
                    await this.mailService.sendVehicleRejectedEmail(vehicle.driver.email, vehicle.driver.name, vehicle.model, vehicle.plate, adminNotes || 'Motivo nao especificado');
                }
            }
            catch (error) {
                console.error('Erro ao enviar email:', error);
            }
        }
        return updatedVehicle;
    }
    async updateOrCreateVehicle(driverId, data) {
        const existingVehicle = await this.prisma.vehicle.findFirst({
            where: { driverId },
        });
        const brandDisplay = data.brandLabel || data.brand;
        const modelDisplay = data.modelLabel || data.model;
        const vehicleData = {
            plate: data.plate,
            model: `${brandDisplay} ${modelDisplay}`,
            capacityKg: 500,
            capacityM3: 2.0,
            documents: {
                brand: data.brand,
                brandLabel: brandDisplay,
                model: data.model,
                modelLabel: modelDisplay,
                year: data.year,
                color: data.color || '',
                type: data.type || 'CAR',
                photo: data.photo || null,
                crlvPhoto: data.crlvPhoto || null,
            },
        };
        if (existingVehicle) {
            return this.prisma.vehicle.update({
                where: { id: existingVehicle.id },
                data: Object.assign(Object.assign({}, vehicleData), { status: 'PENDING', approvedBy: null, approvedAt: null, adminNotes: null }),
            });
        }
        else {
            return this.prisma.vehicle.create({
                data: Object.assign(Object.assign({}, vehicleData), { driver: { connect: { id: driverId } }, status: 'PENDING' }),
            });
        }
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map