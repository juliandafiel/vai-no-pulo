import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Trip } from '@prisma/client';
import { RoutesService } from '../routes/routes.service';

interface CreateTripDto {
    originName: string;
    originLat: number;
    originLng: number;
    destName: string;
    destLat: number;
    destLng: number;
    departureAt: string;
    vehicleId?: string;
    availableSeats?: number;
    availableCapacityKg?: number;
    notes?: string;
}

@Injectable()
export class TripsService {
    constructor(
        private prisma: PrismaService,
        private routesService: RoutesService,
    ) { }

    async create(data: CreateTripDto, driverId: string): Promise<Trip> {
        try {
            console.log('======================================');
            console.log('[TripsService] INICIO - create');
            console.log('[TripsService] Timestamp:', new Date().toISOString());
            console.log('[TripsService] Driver ID:', driverId);
            console.log('[TripsService] Dados recebidos:', JSON.stringify(data, null, 2));
            console.log('======================================');

            // Calcula a rota e estimativas
            console.log('[TripsService] Passo 1: Calculando rota...');
            const departureDate = new Date(data.departureAt);
            console.log('[TripsService] Data partida:', departureDate.toISOString());

            const startRouteCalc = Date.now();
            const routeInfo = await this.routesService.calculateRoute(
                data.originLat,
                data.originLng,
                data.destLat,
                data.destLng,
                departureDate,
            );
            console.log('[TripsService] Passo 1 CONCLUIDO em', Date.now() - startRouteCalc, 'ms');
            console.log('[TripsService] Rota calculada:', JSON.stringify(routeInfo, null, 2));

            // Se não foi fornecido um veículo, busca o primeiro veículo aprovado do motorista
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
                    // Verifica se tem algum veículo pendente
                    console.log('[TripsService] Verificando se tem veiculo pendente...');
                    const pendingVehicle = await this.prisma.vehicle.findFirst({
                        where: { driverId },
                    });

                    if (pendingVehicle) {
                        console.log('[TripsService] ERRO: Veiculo com status:', pendingVehicle.status);
                        throw new BadRequestException(
                            `Seu veiculo esta com status "${pendingVehicle.status}". Aguarde a aprovacao do administrador.`,
                        );
                    }

                    console.log('[TripsService] ERRO: Nenhum veiculo cadastrado');
                    throw new BadRequestException('Voce precisa cadastrar um veiculo antes de criar um percurso');
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
        } catch (error) {
            console.error('Erro ao criar percurso:', error);
            throw error;
        }
    }

    async findAll(query: any): Promise<Trip[]> {
        const where: Prisma.TripWhereInput = {
            status: query.status || undefined,
        };

        // Filtro por motorista
        if (query.driverId) {
            where.driverId = query.driverId;
        }

        // Filtro por status
        if (query.status) {
            where.status = query.status;
        }

        // Filtro por data de partida
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

    async findByDriver(driverId: string): Promise<Trip[]> {
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

    async findOne(id: string): Promise<Trip | null> {
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
            // Adiciona URLs de navegação
            const wazeUrl = this.routesService.getWazeNavigationUrl(trip.destLat, trip.destLng);
            const googleMapsUrl = this.routesService.getGoogleMapsNavigationUrl(
                trip.originLat,
                trip.originLng,
                trip.destLat,
                trip.destLng,
            );
            return { ...trip, wazeUrl, googleMapsUrl } as any;
        }

        return null;
    }

    async updateLocation(id: string, lat: number, lng: number) {
        return this.prisma.trip.update({
            where: { id },
            data: {
                lastLocation: { lat, lng, ts: new Date() },
            },
        });
    }

    async updateStatus(id: string, status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
        return this.prisma.trip.update({
            where: { id },
            data: { status },
        });
    }

    async startTrip(id: string, driverId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada');
        }

        if (trip.driverId !== driverId) {
            throw new BadRequestException('Você não tem permissão para iniciar esta viagem');
        }

        if (trip.status !== 'SCHEDULED') {
            throw new BadRequestException('Esta viagem não pode ser iniciada');
        }

        return this.prisma.trip.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }

    async completeTrip(id: string, driverId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada');
        }

        if (trip.driverId !== driverId) {
            throw new BadRequestException('Você não tem permissão para completar esta viagem');
        }

        if (trip.status !== 'ACTIVE') {
            throw new BadRequestException('Esta viagem não pode ser completada');
        }

        return this.prisma.trip.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
    }

    async cancelTrip(id: string, driverId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada');
        }

        if (trip.driverId !== driverId) {
            throw new BadRequestException('Você não tem permissão para cancelar esta viagem');
        }

        if (trip.status === 'COMPLETED') {
            throw new BadRequestException('Não é possível cancelar uma viagem já completada');
        }

        return this.prisma.trip.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }

    async delete(id: string, driverId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada');
        }

        if (trip.driverId !== driverId) {
            throw new BadRequestException('Você não tem permissão para excluir esta viagem');
        }

        if (trip.status === 'ACTIVE') {
            throw new BadRequestException('Não é possível excluir uma viagem em andamento');
        }

        return this.prisma.trip.delete({
            where: { id },
        });
    }

    async update(id: string, data: any, driverId: string): Promise<Trip> {
        const trip = await this.prisma.trip.findUnique({ where: { id } });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada');
        }

        if (trip.driverId !== driverId) {
            throw new BadRequestException('Você não tem permissão para editar esta viagem');
        }

        if (trip.status === 'ACTIVE') {
            throw new BadRequestException('Não é possível editar uma viagem em andamento');
        }

        if (trip.status === 'COMPLETED') {
            throw new BadRequestException('Não é possível editar uma viagem já completada');
        }

        // Recalcula a rota se origem ou destino mudaram
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
            routeInfo = await this.routesService.calculateRoute(
                data.originLat || trip.originLat,
                data.originLng || trip.originLng,
                data.destLat || trip.destLat,
                data.destLng || trip.destLng,
                departureDate,
            );
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
}
