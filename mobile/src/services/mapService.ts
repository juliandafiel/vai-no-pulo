/**
 * Serviço de Mapas 100% GRATUITO para React Native
 * - OSRM para cálculo de rotas
 * - Nominatim para geocoding
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: Coordinates[];
  distance: number; // metros
  duration: number; // segundos
  distanceText: string;
  durationText: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    road?: string;
    neighbourhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Cache simples para evitar requisições repetidas
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Calcular rota entre dois pontos usando OSRM (GRATUITO)
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult> {
  const cacheKey = `route_${origin.latitude}_${origin.longitude}_${destination.latitude}_${destination.longitude}`;
  const cached = getCached<RouteResult>(cacheKey);
  if (cached) return cached;

  try {
    // OSRM usa formato lng,lat (inverso do comum)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erro ao calcular rota');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('Nenhuma rota encontrada');
    }

    const route = data.routes[0];

    // Converter coordenadas de [lng, lat] para {latitude, longitude}
    const coordinates: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    const result: RouteResult = {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    throw error;
  }
}

/**
 * Calcular rota com múltiplos pontos (waypoints)
 */
export async function calculateRouteWithWaypoints(
  points: Coordinates[]
): Promise<RouteResult> {
  if (points.length < 2) {
    throw new Error('É necessário pelo menos 2 pontos');
  }

  const cacheKey = `route_waypoints_${points.map(p => `${p.latitude}_${p.longitude}`).join('_')}`;
  const cached = getCached<RouteResult>(cacheKey);
  if (cached) return cached;

  try {
    const coordinates = points.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('Nenhuma rota encontrada');
    }

    const route = data.routes[0];
    const routeCoordinates: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    const result: RouteResult = {
      coordinates: routeCoordinates,
      distance: route.distance,
      duration: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    throw error;
  }
}

/**
 * Geocoding: Converter endereço em coordenadas usando Nominatim (GRATUITO)
 * Rate limit: 1 requisição por segundo
 */
let lastGeocodingRequest = 0;

export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  const cacheKey = `geocode_${address.toLowerCase()}`;
  const cached = getCached<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  // Respeitar rate limit (1 req/s)
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodingRequest;
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  lastGeocodingRequest = Date.now();

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TransportSystem/1.0',
      },
    });

    const data = await response.json();

    const results: GeocodingResult[] = data.map((item: {
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        state?: string;
        country?: string;
        postcode?: string;
      };
    }) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        road: item.address?.road,
        neighbourhood: item.address?.neighbourhood,
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
      },
    }));

    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Erro no geocoding:', error);
    throw error;
  }
}

/**
 * Geocoding reverso: Converter coordenadas em endereço
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
  const cacheKey = `reverse_${latitude}_${longitude}`;
  const cached = getCached<GeocodingResult>(cacheKey);
  if (cached) return cached;

  // Respeitar rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodingRequest;
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  lastGeocodingRequest = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TransportSystem/1.0',
      },
    });

    const data = await response.json();

    if (data.error) {
      return null;
    }

    const result: GeocodingResult = {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      displayName: data.display_name,
      address: {
        road: data.address?.road,
        neighbourhood: data.address?.neighbourhood,
        city: data.address?.city || data.address?.town,
        state: data.address?.state,
        country: data.address?.country,
        postcode: data.address?.postcode,
      },
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Erro no geocoding reverso:', error);
    throw error;
  }
}

/**
 * Calcular distância em linha reta entre dois pontos (Haversine)
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371e3; // Raio da Terra em metros
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Formatar distância para exibição
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formatar duração para exibição
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seg`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

/**
 * Estimar preço da corrida baseado na distância e duração
 */
export function estimateRidePrice(
  distance: number, // metros
  duration: number, // segundos
  basePrice: number = 5.0,
  pricePerKm: number = 2.0,
  pricePerMinute: number = 0.5
): number {
  const distanceKm = distance / 1000;
  const durationMinutes = duration / 60;

  const price = basePrice + distanceKm * pricePerKm + durationMinutes * pricePerMinute;
  return Math.round(price * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Buscar endereços com autocomplete
 */
export async function searchAddresses(
  query: string,
  countryCode: string = 'br'
): Promise<GeocodingResult[]> {
  if (query.length < 3) return [];

  const cacheKey = `search_${query.toLowerCase()}_${countryCode}`;
  const cached = getCached<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  // Respeitar rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodingRequest;
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  lastGeocodingRequest = Date.now();

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=5&countrycodes=${countryCode}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TransportSystem/1.0',
      },
    });

    const data = await response.json();

    const results: GeocodingResult[] = data.map((item: {
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        state?: string;
        country?: string;
        postcode?: string;
      };
    }) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        road: item.address?.road,
        neighbourhood: item.address?.neighbourhood,
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
      },
    }));

    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Erro na busca de endereços:', error);
    return [];
  }
}
