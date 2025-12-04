import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: 'default' | 'vehicle' | 'origin' | 'destination' | 'user';
}

export interface MapRoute {
  coordinates: { latitude: number; longitude: number }[];
  color?: string;
}

interface MapProps {
  initialRegion?: Region;
  markers?: MapMarker[];
  route?: MapRoute;
  showUserLocation?: boolean;
  onMapPress?: (latitude: number, longitude: number) => void;
  onMarkerPress?: (markerId: string) => void;
  onUserLocationChange?: (latitude: number, longitude: number) => void;
  followUser?: boolean;
  style?: object;
}

// Cores dos marcadores
const markerColors: Record<string, string> = {
  default: '#3B82F6',
  vehicle: '#10B981',
  origin: '#22C55E',
  destination: '#EF4444',
  user: '#3B82F6',
};

export default function Map({
  initialRegion,
  markers = [],
  route,
  showUserLocation = false,
  onMapPress,
  onMarkerPress,
  onUserLocationChange,
  followUser = false,
  style,
}: MapProps) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: -23.5505,
      longitude: -46.6333,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  // Obter permissão e localização do usuário
  useEffect(() => {
    if (!showUserLocation) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permissão de localização negada');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);

        if (!initialRegion) {
          setRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        onUserLocationChange?.(coords.latitude, coords.longitude);
      } catch (err) {
        setError('Erro ao obter localização');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [showUserLocation]);

  // Seguir usuário em tempo real
  useEffect(() => {
    if (!followUser || !showUserLocation) return;

    let subscription: Location.LocationSubscription;

    (async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          onUserLocationChange?.(coords.latitude, coords.longitude);

          // Animar mapa para nova posição
          mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [followUser, showUserLocation]);

  // Ajustar mapa para mostrar rota completa
  useEffect(() => {
    if (route && route.coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [route]);

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onMapPress?.(latitude, longitude);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  if (error && !userLocation && showUserLocation) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        showsCompass={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* OpenStreetMap Tiles - GRATUITO! */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Marcadores */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={markerColors[marker.type || 'default']}
            onPress={() => onMarkerPress?.(marker.id)}
          />
        ))}

        {/* Marcador de localização do usuário (se não usar showsUserLocation nativo) */}
        {userLocation && !showUserLocation && (
          <Marker
            coordinate={userLocation}
            title="Você está aqui"
            pinColor={markerColors.user}
          />
        )}

        {/* Rota */}
        {route && route.coordinates.length > 0 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor={route.color || '#3B82F6'}
            strokeWidth={4}
          />
        )}
      </MapView>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
