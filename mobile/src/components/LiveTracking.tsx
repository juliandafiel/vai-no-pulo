import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT, AnimatedRegion } from 'react-native-maps';
import { io, Socket } from 'socket.io-client';
import { calculateRoute, RouteResult, formatDuration, formatDistance } from '../services/mapService';

interface LiveTrackingProps {
  rideId: string;
  origin: { latitude: number; longitude: number; address?: string };
  destination: { latitude: number; longitude: number; address?: string };
  socketUrl?: string;
  onArrival?: () => void;
  onCancel?: () => void;
  style?: object;
}

interface DriverPosition {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export default function LiveTracking({
  rideId,
  origin,
  destination,
  socketUrl = 'http://localhost:3000',
  onArrival,
  onCancel,
  style,
}: LiveTrackingProps) {
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<Socket | null>(null);
  const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [eta, setEta] = useState<string>('Calculando...');
  const [distance, setDistance] = useState<string>('');
  const [status, setStatus] = useState<string>('Aguardando motorista...');

  // Carregar rota inicial
  useEffect(() => {
    const loadRoute = async () => {
      try {
        const routeResult = await calculateRoute(origin, destination);
        setRoute(routeResult);
        setEta(routeResult.durationText);
        setDistance(routeResult.distanceText);
      } catch (error) {
        console.error('Erro ao carregar rota:', error);
      }
    };

    loadRoute();
  }, [origin, destination]);

  // Conectar ao socket para rastreamento em tempo real
  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor de rastreamento');
      socket.emit('join-ride', { rideId });
    });

    socket.on('driver-location', (data: DriverPosition) => {
      setDriverPosition(data);
      setStatus('Motorista a caminho');

      // Animar mapa para mostrar motorista
      if (mapRef.current && data.latitude && data.longitude) {
        mapRef.current.animateToRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    });

    socket.on('ride-update', (data: { status: string; eta?: number; distance?: number }) => {
      setStatus(getStatusText(data.status));
      if (data.eta) {
        setEta(formatDuration(data.eta));
      }
      if (data.distance) {
        setDistance(formatDistance(data.distance));
      }
      if (data.status === 'arrived' || data.status === 'completed') {
        onArrival?.();
      }
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor de rastreamento');
    });

    return () => {
      socket.emit('leave-ride', { rideId });
      socket.disconnect();
    };
  }, [rideId, socketUrl, onArrival]);

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      searching: 'Procurando motorista...',
      accepted: 'Motorista a caminho',
      arriving: 'Motorista chegando',
      arrived: 'Motorista chegou!',
      in_progress: 'Viagem em andamento',
      completed: 'Viagem concluída',
      cancelled: 'Viagem cancelada',
    };
    return statusMap[status] || status;
  };

  const handleCancel = () => {
    socketRef.current?.emit('cancel-ride', { rideId });
    onCancel?.();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 1.5 || 0.05,
          longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 1.5 || 0.05,
        }}
      >
        {/* OpenStreetMap Tiles */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Origem */}
        <Marker
          coordinate={origin}
          title="Origem"
          description={origin.address}
          pinColor="#22C55E"
        />

        {/* Destino */}
        <Marker
          coordinate={destination}
          title="Destino"
          description={destination.address}
          pinColor="#EF4444"
        />

        {/* Motorista */}
        {driverPosition && (
          <Marker
            coordinate={driverPosition}
            title="Motorista"
            rotation={driverPosition.heading || 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverEmoji}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Rota */}
        {route && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.etaContainer}>
          <View style={styles.etaItem}>
            <Text style={styles.etaLabel}>Tempo estimado</Text>
            <Text style={styles.etaValue}>{eta}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.etaItem}>
            <Text style={styles.etaLabel}>Distância</Text>
            <Text style={styles.etaValue}>{distance}</Text>
          </View>
        </View>

        {!driverPosition && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar viagem</Text>
          </TouchableOpacity>
        )}
      </View>
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
  driverMarker: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  driverEmoji: {
    fontSize: 18,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  etaContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  etaItem: {
    flex: 1,
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
