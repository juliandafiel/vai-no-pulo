import { RoutesService } from './routes.service';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    calculateRoute(body: {
        originLat: number;
        originLng: number;
        destLat: number;
        destLng: number;
        departureAt: string;
    }): Promise<{
        wazeUrl: string;
        googleMapsUrl: string;
        distanceKm: number;
        durationMinutes: number;
        estimatedArrival: Date;
        polyline?: string;
    }>;
    geocode(address: string): Promise<import("./routes.service").GeocodingResult | {
        error: string;
    }>;
    reverseGeocode(lat: string, lng: string): Promise<{
        error: string;
        address?: undefined;
    } | {
        address: string;
        error?: undefined;
    }>;
}
