import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface RouteInfo {
    distanceKm: number;
    durationMinutes: number;
    estimatedArrival: Date;
    polyline?: string;
}

export interface GeocodingResult {
    lat: number;
    lng: number;
    displayName: string;
}

@Injectable()
export class RoutesService {
    // Usando OpenRouteService (gratuito) - pode ser substituído por Google Directions API
    private readonly ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
    private readonly GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

    /**
     * Calcula a rota entre dois pontos
     */
    async calculateRoute(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        departureAt: Date,
    ): Promise<RouteInfo> {
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
            // Tenta usar Google Directions API primeiro (mais preciso)
            if (this.GOOGLE_API_KEY) {
                console.log('[RoutesService] >>> Usando Google Directions API...');
                const startTime = Date.now();
                try {
                    const result = await this.calculateWithGoogle(originLat, originLng, destLat, destLng, departureAt);
                    console.log('[RoutesService] <<< Google API OK em', Date.now() - startTime, 'ms');
                    return result;
                } catch (googleError) {
                    console.error('[RoutesService] Google API ERRO:', googleError.message);
                    console.log('[RoutesService] Tentando fallback...');
                }
            }

            // Fallback para OpenRouteService (gratuito)
            if (this.ORS_API_KEY) {
                console.log('[RoutesService] >>> Usando OpenRouteService...');
                const startTime = Date.now();
                try {
                    const result = await this.calculateWithORS(originLat, originLng, destLat, destLng, departureAt);
                    console.log('[RoutesService] <<< ORS API OK em', Date.now() - startTime, 'ms');
                    return result;
                } catch (orsError) {
                    console.error('[RoutesService] ORS API ERRO:', orsError.message);
                    console.log('[RoutesService] Tentando fallback...');
                }
            }

            // Fallback para cálculo simples baseado em distância em linha reta
            console.log('[RoutesService] >>> Usando calculo simples (Haversine)...');
            const startTime = Date.now();
            const result = this.calculateSimple(originLat, originLng, destLat, destLng, departureAt);
            console.log('[RoutesService] <<< Haversine OK em', Date.now() - startTime, 'ms');
            console.log('[RoutesService] Resultado:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error('[RoutesService] ERRO FATAL ao calcular rota:', error);
            console.error('[RoutesService] Stack:', error.stack);
            // Fallback para cálculo simples
            console.log('[RoutesService] FALLBACK EMERGENCIA para calculo simples...');
            return this.calculateSimple(originLat, originLng, destLat, destLng, departureAt);
        }
    }

    /**
     * Calcula usando Google Directions API
     */
    private async calculateWithGoogle(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        departureAt: Date,
    ): Promise<RouteInfo> {
        const url = `https://maps.googleapis.com/maps/api/directions/json`;
        const response = await axios.get(url, {
            params: {
                origin: `${originLat},${originLng}`,
                destination: `${destLat},${destLng}`,
                departure_time: Math.floor(departureAt.getTime() / 1000),
                key: this.GOOGLE_API_KEY,
            },
            timeout: 10000, // 10 segundos de timeout
        });

        if (response.data.status === 'OK' && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const leg = route.legs[0];

            const durationMinutes = Math.ceil(leg.duration_in_traffic?.value || leg.duration.value) / 60;
            const distanceKm = leg.distance.value / 1000;

            const estimatedArrival = new Date(departureAt);
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + durationMinutes);

            return {
                distanceKm: Math.round(distanceKm * 10) / 10,
                durationMinutes: Math.round(durationMinutes),
                estimatedArrival,
                polyline: route.overview_polyline?.points,
            };
        }

        throw new Error('Google Directions API: Nenhuma rota encontrada');
    }

    /**
     * Calcula usando OpenRouteService (gratuito)
     */
    private async calculateWithORS(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        departureAt: Date,
    ): Promise<RouteInfo> {
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
        const response = await axios.post(
            url,
            {
                coordinates: [
                    [originLng, originLat], // ORS usa lng,lat
                    [destLng, destLat],
                ],
            },
            {
                headers: {
                    Authorization: this.ORS_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 segundos de timeout
            },
        );

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

    /**
     * Cálculo simples baseado em fórmula de Haversine
     * Usado como fallback quando as APIs não estão disponíveis
     */
    private calculateSimple(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        departureAt: Date,
    ): RouteInfo {
        // Fórmula de Haversine para distância em linha reta
        const R = 6371; // Raio da Terra em km
        const dLat = this.deg2rad(destLat - originLat);
        const dLng = this.deg2rad(destLng - originLng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(originLat)) *
            Math.cos(this.deg2rad(destLat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightLineDistance = R * c;

        // Adiciona 30% para estimar distância rodoviária
        const distanceKm = straightLineDistance * 1.3;

        // Velocidade média de 60 km/h para estimar duração
        const durationMinutes = (distanceKm / 60) * 60;

        const estimatedArrival = new Date(departureAt);
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + durationMinutes);

        return {
            distanceKm: Math.round(distanceKm * 10) / 10,
            durationMinutes: Math.round(durationMinutes),
            estimatedArrival,
        };
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Geocodifica um endereço para obter coordenadas
     */
    async geocodeAddress(address: string): Promise<GeocodingResult | null> {
        try {
            // Usa Nominatim (OpenStreetMap) - gratuito
            const url = 'https://nominatim.openstreetmap.org/search';
            const response = await axios.get(url, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1,
                    countrycodes: 'br', // Limita para Brasil
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
        } catch (error) {
            console.error('Erro ao geocodificar endereço:', error);
            return null;
        }
    }

    /**
     * Geocodificação reversa - coordenadas para endereço
     */
    async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        try {
            const url = 'https://nominatim.openstreetmap.org/reverse';
            const response = await axios.get(url, {
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
        } catch (error) {
            console.error('Erro ao fazer geocodificação reversa:', error);
            return null;
        }
    }

    /**
     * Gera link para abrir o Waze com navegação
     */
    getWazeNavigationUrl(destLat: number, destLng: number): string {
        return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
    }

    /**
     * Gera link para abrir o Google Maps com navegação
     */
    getGoogleMapsNavigationUrl(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
    ): string {
        return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
}
