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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const routes_service_1 = require("../routes/routes.service");
let TripsService = class TripsService {
    constructor(prisma, routesService) {
        this.prisma = prisma;
        this.routesService = routesService;
    }
    async create(data, driverId) {
        try {
            console.log('======================================');
            console.log('[TripsService] INICIO - create');
            console.log('[TripsService] Timestamp:', new Date().toISOString());
            console.log('[TripsService] Driver ID:', driverId);
            console.log('[TripsService] Dados recebidos:', JSON.stringify(data, null, 2));
            console.log('======================================');
            console.log('[TripsService] Passo 1: Calculando rota...');
            const departureDate = new Date(data.departureAt);
            console.log('[TripsService] Data partida:', departureDate.toISOString());
            const startRouteCalc = Date.now();
            const routeInfo = await this.routesService.calculateRoute(data.originLat, data.originLng, data.destLat, data.destLng, departureDate);
            console.log('[TripsService] Passo 1 CONCLUIDO em', Date.now() - startRouteCalc, 'ms');
            console.log('[TripsService] Rota calculada:', JSON.stringify(routeInfo, null, 2));
            console.log('[TripsService] Passo 2: Verificando veiculo...');
            let vehicleId = data.vehicleId;
            if (!vehicleId) {
                console.log('[TripsService] Buscando veiculo aprovado para motorista:', driverId);
                const startVehicleSearch = Date.now();
                const vehicle = await this.prisma.vehicle.findFirst({
                    where: {
                        driverId,
                        status: 'APPROVED',
                    },
                });
                console.log('[TripsService] Busca veiculo completada em', Date.now() - startVehicleSearch, 'ms');
                console.log('[TripsService] Veiculo encontrado:', vehicle ? vehicle.id : 'NENHUM');
                if (!vehicle) {
                    console.log('[TripsService] Verificando se tem veiculo pendente...');
                    const pendingVehicle = await this.prisma.vehicle.findFirst({
                        where: { driverId },
                    });
                    if (pendingVehicle) {
                        console.log('[TripsService] ERRO: Veiculo com status:', pendingVehicle.status);
                        throw new common_1.BadRequestException(`Seu veiculo esta com status "${pendingVehicle.status}". Aguarde a aprovacao do administrador.`);
                    }
                    console.log('[TripsService] ERRO: Nenhum veiculo cadastrado');
                    throw new common_1.BadRequestException('Voce precisa cadastrar um veiculo antes de criar um percurso');
                }
                vehicleId = vehicle.id;
            }
            console.log('[TripsService] Passo 2 CONCLUIDO - vehicleId:', vehicleId);
            console.log('[TripsService] Passo 3: Criando trip no banco de dados...');
            const startTripCreate = Date.now();
            const trip = await this.prisma.trip.create({
                data: {
                    originName: data.originName,
                    originLat: data.originLat,
                    originLng: data.originLng,
                    destName: data.destName,
                    destLat: data.destLat,
                    destLng: data.destLng,
                    departureAt: departureDate,
                    estimatedArrival: routeInfo.estimatedArrival,
                    distanceKm: routeInfo.distanceKm,
                    durationMinutes: routeInfo.durationMinutes,
                    availableSeats: data.availableSeats,
                    availableCapacityKg: data.availableCapacityKg,
                    notes: data.notes,
                    driver: { connect: { id: driverId } },
                    vehicle: { connect: { id: vehicleId } },
                },
                include: {
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            profilePhoto: true,
                        },
                    },
                    vehicle: true,
                },
            });
            console.log('[TripsService] Passo 3 CONCLUIDO em', Date.now() - startTripCreate, 'ms');
            console.log('[TripsService] SUCESSO - Percurso criado:', trip.id);
            console.log('======================================');
            return trip;
        }
        catch (error) {
            console.error('Erro ao criar percurso:', error);
            throw error;
        }
    }
    async findAll(query) {
        const where = {
            status: query.status || undefined,
        };
        if (query.driverId) {
            where.driverId = query.driverId;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.fromDate) {
            where.departureAt = {
                gte: new Date(query.fromDate),
            };
        }
        return this.prisma.trip.findMany({
            where,
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
                vehicle: true,
                shipments: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
            orderBy: { departureAt: 'asc' },
        });
    }
    async findByDriver(driverId) {
        return this.prisma.trip.findMany({
            where: { driverId },
            include: {
                vehicle: true,
                shipments: {
                    select: {
                        id: true,
                        status: true,
                        description: true,
                        weightKg: true,
                    },
                },
            },
            orderBy: { departureAt: 'desc' },
        });
    }
    async findOne(id) {
        const trip = await this.prisma.trip.findUnique({
            where: { id },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        profilePhoto: true,
                    },
                },
                vehicle: true,
                shipments: true,
            },
        });
        if (trip) {
            const wazeUrl = this.routesService.getWazeNavigationUrl(trip.destLat, trip.destLng);
            const googleMapsUrl = this.routesService.getGoogleMapsNavigationUrl(trip.originLat, trip.originLng, trip.destLat, trip.destLng);
            return Object.assign(Object.assign({}, trip), { wazeUrl, googleMapsUrl });
        }
        return null;
    }
    async updateLocation(id, lat, lng) {
        return this.prisma.trip.update({
            where: { id },
            data: {
                lastLocation: { lat, lng, ts: new Date() },
            },
        });
    }
    async updateStatus(id, status) {
        return this.prisma.trip.update({
            where: { id },
            data: { status },
        });
    }
    async startTrip(id, driverId) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new common_1.BadRequestException('Viagem não encontrada');
        }
        if (trip.driverId !== driverId) {
            throw new common_1.BadRequestException('Você não tem permissão para iniciar esta viagem');
        }
        if (trip.status !== 'SCHEDULED') {
            throw new common_1.BadRequestException('Esta viagem não pode ser iniciada');
        }
        return this.prisma.trip.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }
    async completeTrip(id, driverId) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new common_1.BadRequestException('Viagem não encontrada');
        }
        if (trip.driverId !== driverId) {
            throw new common_1.BadRequestException('Você não tem permissão para completar esta viagem');
        }
        if (trip.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Esta viagem não pode ser completada');
        }
        return this.prisma.trip.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
    }
    async cancelTrip(id, driverId) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new common_1.BadRequestException('Viagem não encontrada');
        }
        if (trip.driverId !== driverId) {
            throw new common_1.BadRequestException('Você não tem permissão para cancelar esta viagem');
        }
        if (trip.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Não é possível cancelar uma viagem já completada');
        }
        return this.prisma.trip.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
    async delete(id, driverId) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new common_1.BadRequestException('Viagem não encontrada');
        }
        if (trip.driverId !== driverId) {
            throw new common_1.BadRequestException('Você não tem permissão para excluir esta viagem');
        }
        if (trip.status === 'ACTIVE') {
            throw new common_1.BadRequestException('Não é possível excluir uma viagem em andamento');
        }
        return this.prisma.trip.delete({
            where: { id },
        });
    }
    async update(id, data, driverId) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new common_1.BadRequestException('Viagem não encontrada');
        }
        if (trip.driverId !== driverId) {
            throw new common_1.BadRequestException('Você não tem permissão para editar esta viagem');
        }
        if (trip.status === 'ACTIVE') {
            throw new common_1.BadRequestException('Não é possível editar uma viagem em andamento');
        }
        if (trip.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Não é possível editar uma viagem já completada');
        }
        let routeInfo = {
            distanceKm: trip.distanceKm,
            durationMinutes: trip.durationMinutes,
            estimatedArrival: trip.estimatedArrival,
        };
        const originChanged = data.originLat !== trip.originLat || data.originLng !== trip.originLng;
        const destChanged = data.destLat !== trip.destLat || data.destLng !== trip.destLng;
        const departureChanged = data.departureAt && new Date(data.departureAt).getTime() !== new Date(trip.departureAt).getTime();
        if (originChanged || destChanged || departureChanged) {
            const departureDate = data.departureAt ? new Date(data.departureAt) : trip.departureAt;
            routeInfo = await this.routesService.calculateRoute(data.originLat || trip.originLat, data.originLng || trip.originLng, data.destLat || trip.destLat, data.destLng || trip.destLng, departureDate);
        }
        return this.prisma.trip.update({
            where: { id },
            data: {
                originName: data.originName,
                originLat: data.originLat,
                originLng: data.originLng,
                destName: data.destName,
                destLat: data.destLat,
                destLng: data.destLng,
                departureAt: data.departureAt ? new Date(data.departureAt) : trip.departureAt,
                estimatedArrival: routeInfo.estimatedArrival,
                distanceKm: routeInfo.distanceKm,
                durationMinutes: routeInfo.durationMinutes,
                notes: data.notes,
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
                vehicle: true,
            },
        });
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        routes_service_1.RoutesService])
], TripsService);
//# sourceMappingURL=trips.service.js.map