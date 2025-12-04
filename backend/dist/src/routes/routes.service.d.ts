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
export declare class RoutesService {
    private readonly ORS_API_KEY;
    private readonly GOOGLE_API_KEY;
    calculateRoute(originLat: number, originLng: number, destLat: number, destLng: number, departureAt: Date): Promise<RouteInfo>;
    private calculateWithGoogle;
    private calculateWithORS;
    private calculateSimple;
    private deg2rad;
    geocodeAddress(address: string): Promise<GeocodingResult | null>;
    reverseGeocode(lat: number, lng: number): Promise<string | null>;
    getWazeNavigationUrl(destLat: number, destLng: number): string;
    getGoogleMapsNavigationUrl(originLat: number, originLng: number, destLat: number, destLng: number): string;
}
