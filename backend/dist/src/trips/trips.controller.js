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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsController = void 0;
const common_1 = require("@nestjs/common");
const trips_service_1 = require("./trips.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let TripsController = class TripsController {
    constructor(tripsService) {
        this.tripsService = tripsService;
    }
    async create(createTripDto, req) {
        console.log('======================================');
        console.log('[TripsController] POST /trips - REQUISICAO RECEBIDA');
        console.log('[TripsController] Timestamp:', new Date().toISOString());
        console.log('[TripsController] User:', JSON.stringify(req.user));
        console.log('[TripsController] Body:', JSON.stringify(createTripDto));
        console.log('======================================');
        try {
            const result = await this.tripsService.create(createTripDto, req.user.userId);
            console.log('[TripsController] Trip criada com sucesso:', result.id);
            return result;
        }
        catch (error) {
            console.error('[TripsController] ERRO ao criar trip:', error.message);
            console.error('[TripsController] Stack:', error.stack);
            throw error;
        }
    }
    findAll(query) {
        return this.tripsService.findAll(query);
    }
    getMyTrips(req) {
        return this.tripsService.findByDriver(req.user.userId);
    }
    findOne(id) {
        return this.tripsService.findOne(id);
    }
    startTrip(id, req) {
        return this.tripsService.startTrip(id, req.user.userId);
    }
    completeTrip(id, req) {
        return this.tripsService.completeTrip(id, req.user.userId);
    }
    cancelTrip(id, req) {
        return this.tripsService.cancelTrip(id, req.user.userId);
    }
    updateLocation(id, body) {
        return this.tripsService.updateLocation(id, body.lat, body.lng);
    }
    updateTrip(id, updateTripDto, req) {
        return this.tripsService.update(id, updateTripDto, req.user.userId);
    }
    deleteTrip(id, req) {
        return this.tripsService.delete(id, req.user.userId);
    }
};
exports.TripsController = TripsController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new trip/route' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                originName: 'São Paulo, SP',
                originLat: -23.5505,
                originLng: -46.6333,
                destName: 'Rio de Janeiro, RJ',
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
                vehicleId: 'uuid-do-veiculo',
                availableSeats: 3,
                availableCapacityKg: 50,
                pricePerKm: 0.5,
                notes: 'Viagem com paradas em Taubaté e Resende',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search trips' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] }),
    (0, swagger_1.ApiQuery)({ name: 'fromDate', required: false, description: 'Filter trips from this date' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('my-trips'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trips created by the authenticated driver' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "getMyTrips", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trip details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a scheduled trip' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "startTrip", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete an active trip' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "completeTrip", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a trip' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "cancelTrip", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id/location'),
    (0, swagger_1.ApiOperation)({ summary: 'Update trip location' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: { lat: -23.5505, lng: -46.6333 },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a trip' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                originName: 'São Paulo, SP',
                originLat: -23.5505,
                originLng: -46.6333,
                destName: 'Rio de Janeiro, RJ',
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
                notes: 'Viagem com paradas em Taubaté e Resende',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "updateTrip", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a trip' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "deleteTrip", null);
exports.TripsController = TripsController = __decorate([
    (0, swagger_1.ApiTags)('trips'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('trips'),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsController);
//# sourceMappingURL=trips.controller.js.map