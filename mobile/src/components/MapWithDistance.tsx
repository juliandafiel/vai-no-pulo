import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  calculateRoute,
  calculateDistance,
  formatDistance,
  formatDuration,
  RouteResult,
  Coordinates,
} from '../services/mapService';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  label?: string;
}

interface RouteInfo {
  straightLineDistance: number;
  routeDistance: number;
  duration: number;
  straightLineDistanceText: string;
  routeDistanceText: string;
  durationText: string;
}

interface MapWithDistanceProps {
  origin?: RoutePoint;
  destination?: RoutePoint;
  showRouteInfo?: boolean;
  routeColor?: string;
  onRouteCalculated?: (info: RouteInfo) => void;
  onMapPress?: (latitude: number, longitude: number) => void;
  style?: object;
  initialRegion?: Region;
}

const DEFAULT_REGION: Region = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapWithDistance({
  origin,
  destination,
  showRouteInfo = true,
  routeColor = '#3B82F6',
  onRouteCalculated,
  onMapPress,
  style,
  initialRegion = DEFAULT_REGION,
}: MapWithDistanceProps) {
  const mapRef = useRef<MapView>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular rota quando origem e destino mudam
  const calculateRouteData = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      setRouteInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calcular distancia em linha reta (Haversine)
      const straightLine = calculateDistance(origin, destination);

      // Calcular rota real via OSRM
      const routeResult = await calculateRoute(origin, destination);

      const info: RouteInfo = {
        straightLineDistance: straightLine,
        routeDistance: routeResult.distance,
        duration: routeResult.duration,
        straightLineDistanceText: formatDistance(straightLine),
        routeDistanceText: routeResult.distanceText,
        durationText: routeResult.durationText,
      };

      setRoute(routeResult);
      setRouteInfo(info);
      onRouteCalculated?.(info);

      // Ajustar mapa para mostrar rota completa
      if (mapRef.current && routeResult.coordinates.length > 0) {
        mapRef.current.fitToCoordinates(routeResult.coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    } catch (err) {
      console.error('Erro ao calcular rota:', err);
      setError('Erro ao calcular rota');

      // Mesmo com erro, calcular distancia em linha reta
      if (origin && destination) {
        const straightLine = calculateDistance(origin, destination);
        const info: RouteInfo = {
          straightLineDistance: straightLine,
          routeDistance: straightLine * 1.3, // Estimativa: 30% a mais que linha reta
          duration: (straightLine / 1000) * 2 * 60, // Estimativa: 30km/h media
          straightLineDistanceText: formatDistance(straightLine),
          routeDistanceText: formatDistance(straightLine * 1.3),
          durationText: formatDuration((straightLine / 1000) * 2 * 60),
        };
        setRouteInfo(info);
        onRouteCalculated?.(info);
      }
    } finally {
      setLoading(false);
    }
  }, [origin, destination, onRouteCalculated]);

  useEffect(() => {
    calculateRouteData();
  }, [calculateRouteData]);

  // Ajustar mapa quando marcadores mudam
  useEffect(() => {
    if (origin && destination && mapRef.current) {
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    } else if (origin && mapRef.current) {
      mapRef.current.animateToRegion({
        ...origin,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [origin, destination]);

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onMapPress?.(latitude, longitude);
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsCompass={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* OpenStreetMap Tiles */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Marcador de Origem */}
        {origin && (
          <Marker
            coordinate={origin}
            title={origin.label || 'Origem'}
            pinColor="#22C55E"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.originMarker]}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
              {origin.label && (
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText} numberOfLines={1}>
                    {origin.label}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker
            coordinate={destination}
            title={destination.label || 'Destino'}
            pinColor="#EF4444"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.destinationMarker]}>
                <Ionicons name="flag" size={18} color="#FFFFFF" />
              </View>
              {destination.label && (
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText} numberOfLines={1}>
                    {destination.label}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        )}

        {/* Rota */}
        {route && route.coordinates.length > 0 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor={routeColor}
            strokeWidth={5}
            lineDashPattern={[0]}
          />
        )}

        {/* Linha reta (pontilhada) para comparacao */}
        {origin && destination && (
          <Polyline
            coordinates={[origin, destination]}
            strokeColor="#9CA3AF"
            strokeWidth={2}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Painel de Informacoes da Rota */}
      {showRouteInfo && (origin || destination) && (
        <View style={styles.infoPanel}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Calculando rota...</Text>
            </View>
          ) : routeInfo ? (
            <>
              {/* Distancia da Rota */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="navigate" size={24} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Distancia pela rota</Text>
                  <Text style={styles.infoValue}>{routeInfo.routeDistanceText}</Text>
                </View>
              </View>

              {/* Tempo Estimado */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="time" size={24} color="#10B981" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tempo estimado</Text>
                  <Text style={styles.infoValue}>{routeInfo.durationText}</Text>
                </View>
              </View>

              {/* Distancia em Linha Reta */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="resize" size={24} color="#9CA3AF" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Linha reta</Text>
                  <Text style={styles.infoValueSmall}>
                    {routeInfo.straightLineDistanceText}
                  </Text>
                </View>
              </View>

              {/* Indicador de diferenca */}
              {routeInfo.routeDistance > routeInfo.straightLineDistance && (
                <View style={styles.differenceContainer}>
                  <Text style={styles.differenceText}>
                    A rota e {((routeInfo.routeDistance / routeInfo.straightLineDistance - 1) * 100).toFixed(0)}% maior que a linha reta
                  </Text>
                </View>
              )}
            </>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                Selecione origem e destino para ver a rota
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  originMarker: {
    backgroundColor: '#22C55E',
  },
  destinationMarker: {
    backgroundColor: '#EF4444',
  },
  markerLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  differenceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  differenceText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
