/**
 * RouteMatching Service
 *
 * Verifica se os pontos do cliente estão na rota do motorista usando OSRM.
 *
 * Lógica:
 * 1. Obtém a rota completa do motorista (polyline)
 * 2. Verifica se a origem do cliente está próxima de algum ponto da rota
 * 3. Verifica se o destino do cliente está próximo de algum ponto da rota
 * 4. Garante que a origem vem ANTES do destino na rota (mesma direção)
 */

// Distância máxima em km para considerar que um ponto está "na rota"
// Para rotas longas (ex: Recife -> São João del-Rei = 2200km),
// uma tolerância de 15-20km é razoável para pontos dentro da cidade
const MAX_DISTANCE_FROM_ROUTE_KM = 20;

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface RouteMatchResult {
    isMatch: boolean;
    originOnRoute: boolean;
    destinationOnRoute: boolean;
    originDistanceKm: number;
    destinationDistanceKm: number;
    originRouteIndex: number;
    destinationRouteIndex: number;
    detourKm: number; // Desvio adicional que o motorista teria
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 */
function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Busca a rota do motorista usando OSRM
 */
async function getRoutePolyline(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<Coordinate[]> {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

        console.log('[RouteMatching] Buscando rota OSRM...');
        console.log('[RouteMatching] URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('[RouteMatching] OSRM response code:', data.code);

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates;
            console.log(`[RouteMatching] Rota obtida com ${coordinates.length} pontos`);
            console.log(`[RouteMatching] Distância da rota: ${(data.routes[0].distance / 1000).toFixed(1)} km`);

            // OSRM retorna [lng, lat], convertemos para {latitude, longitude}
            return coordinates.map((coord: [number, number]) => ({
                latitude: coord[1],
                longitude: coord[0],
            }));
        }

        console.log('[RouteMatching] OSRM não retornou rota válida:', data);
        return [];
    } catch (error) {
        console.error('[RouteMatching] Erro ao buscar rota OSRM:', error);
        return [];
    }
}

/**
 * Encontra o ponto mais próximo na rota e retorna a distância e o índice
 */
function findClosestPointOnRoute(
    point: Coordinate,
    routePoints: Coordinate[]
): { distance: number; index: number } {
    let minDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < routePoints.length; i++) {
        const routePoint = routePoints[i];
        const distance = haversineDistance(
            point.latitude,
            point.longitude,
            routePoint.latitude,
            routePoint.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    return { distance: minDistance, index: closestIndex };
}

/**
 * Verifica se os pontos do cliente estão na rota do motorista
 */
export async function checkRouteMatch(
    // Rota do motorista
    driverOrigin: Coordinate,
    driverDestination: Coordinate,
    // Pontos do cliente
    clientOrigin: Coordinate,
    clientDestination: Coordinate,
    // Distância máxima da rota (opcional)
    maxDistanceKm: number = MAX_DISTANCE_FROM_ROUTE_KM
): Promise<RouteMatchResult> {
    const result: RouteMatchResult = {
        isMatch: false,
        originOnRoute: false,
        destinationOnRoute: false,
        originDistanceKm: Infinity,
        destinationDistanceKm: Infinity,
        originRouteIndex: -1,
        destinationRouteIndex: -1,
        detourKm: 0,
    };

    try {
        // 1. Obtém a rota completa do motorista
        const routePoints = await getRoutePolyline(
            driverOrigin.latitude,
            driverOrigin.longitude,
            driverDestination.latitude,
            driverDestination.longitude
        );

        if (routePoints.length === 0) {
            console.log('Não foi possível obter a rota do motorista');
            return result;
        }

        // 2. Encontra o ponto mais próximo da origem do cliente na rota
        const originMatch = findClosestPointOnRoute(clientOrigin, routePoints);
        result.originDistanceKm = originMatch.distance;
        result.originRouteIndex = originMatch.index;
        result.originOnRoute = originMatch.distance <= maxDistanceKm;

        // 3. Encontra o ponto mais próximo do destino do cliente na rota
        const destMatch = findClosestPointOnRoute(clientDestination, routePoints);
        result.destinationDistanceKm = destMatch.distance;
        result.destinationRouteIndex = destMatch.index;
        result.destinationOnRoute = destMatch.distance <= maxDistanceKm;

        // 4. Verifica se ambos estão na rota E se a origem vem antes do destino
        // (garantir que o cliente está indo na mesma direção do motorista)
        const sameDirection = result.originRouteIndex < result.destinationRouteIndex;

        result.isMatch =
            result.originOnRoute &&
            result.destinationOnRoute &&
            sameDirection;

        // 5. Calcula o desvio (distância extra que o motorista teria)
        if (result.isMatch) {
            result.detourKm = result.originDistanceKm + result.destinationDistanceKm;
        }

        console.log('[RouteMatching] Resultado:', {
            isMatch: result.isMatch,
            originDistanceKm: result.originDistanceKm.toFixed(2),
            destinationDistanceKm: result.destinationDistanceKm.toFixed(2),
            originIndex: result.originRouteIndex,
            destIndex: result.destinationRouteIndex,
            sameDirection,
        });

        return result;
    } catch (error) {
        console.error('Erro ao verificar compatibilidade de rota:', error);
        return result;
    }
}

/**
 * Filtra uma lista de viagens, retornando apenas as compatíveis com a rota do cliente
 */
export async function filterCompatibleTrips(
    trips: any[],
    clientOrigin: Coordinate,
    clientDestination: Coordinate,
    maxDistanceKm: number = MAX_DISTANCE_FROM_ROUTE_KM
): Promise<any[]> {
    const compatibleTrips: any[] = [];

    console.log(`[RouteMatching] ========================================`);
    console.log(`[RouteMatching] Verificando ${trips.length} viagens...`);
    console.log(`[RouteMatching] Cliente origem: ${clientOrigin.latitude.toFixed(4)}, ${clientOrigin.longitude.toFixed(4)}`);
    console.log(`[RouteMatching] Cliente destino: ${clientDestination.latitude.toFixed(4)}, ${clientDestination.longitude.toFixed(4)}`);
    console.log(`[RouteMatching] Tolerância máxima: ${maxDistanceKm} km`);
    console.log(`[RouteMatching] ========================================`);

    for (const trip of trips) {
        console.log(`[RouteMatching] --- Verificando viagem ${trip.id} ---`);
        console.log(`[RouteMatching] Motorista: ${trip.originName} -> ${trip.destName}`);

        const driverOrigin: Coordinate = {
            latitude: trip.originLat,
            longitude: trip.originLng,
        };
        const driverDestination: Coordinate = {
            latitude: trip.destLat,
            longitude: trip.destLng,
        };

        console.log(`[RouteMatching] Motorista origem: ${driverOrigin.latitude.toFixed(4)}, ${driverOrigin.longitude.toFixed(4)}`);
        console.log(`[RouteMatching] Motorista destino: ${driverDestination.latitude.toFixed(4)}, ${driverDestination.longitude.toFixed(4)}`);

        const match = await checkRouteMatch(
            driverOrigin,
            driverDestination,
            clientOrigin,
            clientDestination,
            maxDistanceKm
        );

        if (match.isMatch) {
            console.log(`[RouteMatching] ✅ MATCH! Viagem ${trip.id} é compatível`);
            compatibleTrips.push({
                ...trip,
                routeMatch: {
                    originDistanceKm: match.originDistanceKm,
                    destinationDistanceKm: match.destinationDistanceKm,
                    detourKm: match.detourKm,
                },
            });
        } else {
            console.log(`[RouteMatching] ❌ Viagem ${trip.id} NÃO é compatível`);
            console.log(`[RouteMatching]    - Origem na rota: ${match.originOnRoute} (${match.originDistanceKm.toFixed(2)} km)`);
            console.log(`[RouteMatching]    - Destino na rota: ${match.destinationOnRoute} (${match.destinationDistanceKm.toFixed(2)} km)`);
        }
    }

    console.log(`[RouteMatching] ========================================`);
    console.log(`[RouteMatching] ${compatibleTrips.length} viagens compatíveis encontradas`);
    console.log(`[RouteMatching] ========================================`);

    return compatibleTrips;
}

export default {
    checkRouteMatch,
    filterCompatibleTrips,
    haversineDistance,
};
