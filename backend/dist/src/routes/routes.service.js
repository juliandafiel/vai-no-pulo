"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let RoutesService = class RoutesService {
    constructor() {
        this.ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
        this.GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
    }
    async calculateRoute(originLat, originLng, destLat, destLng, departureAt) {
        console.log('--------------------------------------');
        console.log('[RoutesService] INICIO - calculateRoute');
        console.log('[RoutesService] Timestamp:', new Date().toISOString());
        console.log('[RoutesService] Origem:', originLat, originLng);
        console.log('[RoutesService] Destino:', destLat, destLng);
        console.log('[RoutesService] Partida:', departureAt);
        console.log('[RoutesService] GOOGLE_API_KEY presente:', !!this.GOOGLE_API_KEY);
        console.log('[RoutesService] ORS_API_KEY presente:', !!this.ORS_API_KEY);
        console.log('--------------------------------------');
        try {
            if (this.GOOGLE_API_KEY) {
                console.log('[RoutesService] >>> Usando Google Directions API...');
                const startTime = Date.now();
                try {
                    const result = await this.calculateWithGoogle(originLat, originLng, destLat, destLng, departureAt);
                    console.log('[RoutesService] <<< Google API OK em', Date.now() - startTime, 'ms');
                    return result;
                }
                catch (googleError) {
                    console.error('[RoutesService] Google API ERRO:', googleError.message);
                    console.log('[RoutesService] Tentando fallback...');
                }
            }
            if (this.ORS_API_KEY) {
                console.log('[RoutesService] >>> Usando OpenRouteService...');
                const startTime = Date.now();
                try {
                    const result = await this.calculateWithORS(originLat, originLng, destLat, destLng, departureAt);
                    console.log('[RoutesService] <<< ORS API OK em', Date.now() - startTime, 'ms');
                    return result;
                }
                catch (orsError) {
                    console.error('[RoutesService] ORS API ERRO:', orsError.message);
                    console.log('[RoutesService] Tentando fallback...');
                }
            }
            console.log('[RoutesService] >>> Usando calculo simples (Haversine)...');
            const startTime = Date.now();
            const result = this.calculateSimple(originLat, originLng, destLat, destLng, departureAt);
            console.log('[RoutesService] <<< Haversine OK em', Date.now() - startTime, 'ms');
            console.log('[RoutesService] Resultado:', JSON.stringify(result));
            return result;
        }
        catch (error) {
            console.error('[RoutesService] ERRO FATAL ao calcular rota:', error);
            console.error('[RoutesService] Stack:', error.stack);
            console.log('[RoutesService] FALLBACK EMERGENCIA para calculo simples...');
            return this.calculateSimple(originLat, originLng, destLat, destLng, departureAt);
        }
    }
    async calculateWithGoogle(originLat, originLng, destLat, destLng, departureAt) {
        var _a, _b;
        const url = `https://maps.googleapis.com/maps/api/directions/json`;
        const response = await axios_1.default.get(url, {
            params: {
                origin: `${originLat},${originLng}`,
                destination: `${destLat},${destLng}`,
                departure_time: Math.floor(departureAt.getTime() / 1000),
                key: this.GOOGLE_API_KEY,
            },
            timeout: 10000,
        });
        if (response.data.status === 'OK' && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const leg = route.legs[0];
            const durationMinutes = Math.ceil(((_a = leg.duration_in_traffic) === null || _a === void 0 ? void 0 : _a.value) || leg.duration.value) / 60;
            const distanceKm = leg.distance.value / 1000;
            const estimatedArrival = new Date(departureAt);
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + durationMinutes);
            return {
                distanceKm: Math.round(distanceKm * 10) / 10,
                durationMinutes: Math.round(durationMinutes),
                estimatedArrival,
                polyline: (_b = route.overview_polyline) === null || _b === void 0 ? void 0 : _b.points,
            };
        }
        throw new Error('Google Directions API: Nenhuma rota encontrada');
    }
    async calculateWithORS(originLat, originLng, destLat, destLng, departureAt) {
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
        const response = await axios_1.default.post(url, {
            coordinates: [
                [originLng, originLat],
                [destLng, destLat],
            ],
        }, {
            headers: {
                Authorization: this.ORS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const summary = route.summary;
            const durationMinutes = Math.ceil(summary.duration / 60);
            const distanceKm = summary.distance / 1000;
            const estimatedArrival = new Date(departureAt);
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + durationMinutes);
            return {
                distanceKm: Math.round(distanceKm * 10) / 10,
                durationMinutes: Math.round(durationMinutes),
                estimatedArrival,
            };
        }
        throw new Error('OpenRouteService: Nenhuma rota encontrada');
    }
    calculateSimple(originLat, originLng, destLat, destLng, departureAt) {
        const R = 6371;
        const dLat = this.deg2rad(destLat - originLat);
        const dLng = this.deg2rad(destLng - originLng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(originLat)) *
                Math.cos(this.deg2rad(destLat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightLineDistance = R * c;
        const distanceKm = straightLineDistance * 1.3;
        const durationMinutes = (distanceKm / 60) * 60;
        const estimatedArrival = new Date(departureAt);
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + durationMinutes);
        return {
            distanceKm: Math.round(distanceKm * 10) / 10,
            durationMinutes: Math.round(durationMinutes),
            estimatedArrival,
        };
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    async geocodeAddress(address) {
        try {
            const url = 'https://nominatim.openstreetmap.org/search';
            const response = await axios_1.default.get(url, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1,
                    countrycodes: 'br',
                },
                headers: {
                    'User-Agent': 'VaiNoPulo/1.0',
                },
            });
            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    displayName: result.display_name,
                };
            }
            return null;
        }
        catch (error) {
            console.error('Erro ao geocodificar endereço:', error);
            return null;
        }
    }
    async reverseGeocode(lat, lng) {
        try {
            const url = 'https://nominatim.openstreetmap.org/reverse';
            const response = await axios_1.default.get(url, {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                },
                headers: {
                    'User-Agent': 'VaiNoPulo/1.0',
                },
            });
            if (response.data && response.data.display_name) {
                return response.data.display_name;
            }
            return null;
        }
        catch (error) {
            console.error('Erro ao fazer geocodificação reversa:', error);
            return null;
        }
    }
    getWazeNavigationUrl(destLat, destLng) {
        return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
    }
    getGoogleMapsNavigationUrl(originLat, originLng, destLat, destLng) {
        return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = __decorate([
    (0, common_1.Injectable)()
], RoutesService);
//# sourceMappingURL=routes.service.js.map