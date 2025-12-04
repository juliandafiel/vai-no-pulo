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
exports.RoutesController = void 0;
const common_1 = require("@nestjs/common");
const routes_service_1 = require("./routes.service");
const swagger_1 = require("@nestjs/swagger");
let RoutesController = class RoutesController {
    constructor(routesService) {
        this.routesService = routesService;
    }
    async calculateRoute(body) {
        const departureDate = new Date(body.departureAt);
        const routeInfo = await this.routesService.calculateRoute(body.originLat, body.originLng, body.destLat, body.destLng, departureDate);
        return Object.assign(Object.assign({}, routeInfo), { wazeUrl: this.routesService.getWazeNavigationUrl(body.destLat, body.destLng), googleMapsUrl: this.routesService.getGoogleMapsNavigationUrl(body.originLat, body.originLng, body.destLat, body.destLng) });
    }
    async geocode(address) {
        const result = await this.routesService.geocodeAddress(address);
        if (!result) {
            return { error: 'Endereço não encontrado' };
        }
        return result;
    }
    async reverseGeocode(lat, lng) {
        const address = await this.routesService.reverseGeocode(parseFloat(lat), parseFloat(lng));
        if (!address) {
            return { error: 'Endereço não encontrado' };
        }
        return { address };
    }
};
exports.RoutesController = RoutesController;
__decorate([
    (0, common_1.Post)('calculate'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate route between two points' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                originLat: -23.5505,
                originLng: -46.6333,
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "calculateRoute", null);
__decorate([
    (0, common_1.Get)('geocode'),
    (0, swagger_1.ApiOperation)({ summary: 'Geocode an address to coordinates' }),
    (0, swagger_1.ApiQuery)({ name: 'address', example: 'Avenida Paulista, São Paulo' }),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "geocode", null);
__decorate([
    (0, common_1.Get)('reverse-geocode'),
    (0, swagger_1.ApiOperation)({ summary: 'Get address from coordinates' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', example: -23.5505 }),
    (0, swagger_1.ApiQuery)({ name: 'lng', example: -46.6333 }),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "reverseGeocode", null);
exports.RoutesController = RoutesController = __decorate([
    (0, swagger_1.ApiTags)('routes'),
    (0, common_1.Controller)('routes'),
    __metadata("design:paramtypes", [routes_service_1.RoutesService])
], RoutesController);
//# sourceMappingURL=routes.controller.js.map