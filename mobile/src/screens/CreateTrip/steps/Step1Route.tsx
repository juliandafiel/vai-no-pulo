/**
 * Step1Route - Etapa 1: Definir origem e destino
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AddressAutocomplete, { AddressResult } from '../../../components/AddressAutocomplete';
import theme from '../../../theme';
import {
    calculateRoute,
    calculateDistance,
    formatDistance,
    formatDuration,
    RouteResult,
} from '../../../services/mapService';

const { height, width } = Dimensions.get('window');

interface TripData {
    origin: AddressResult | null;
    destination: AddressResult | null;
    date: Date;
    time: string;
    capacity: number;
    availableWeight: number;
}

interface Props {
    data: TripData;
    onUpdate: (data: Partial<TripData>) => void;
    onNext: () => void;
}

export default function Step1Route({ data, onUpdate, onNext }: Props) {
    const mapRef = useRef<MapView>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [region, setRegion] = useState({
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });

    // Estados para rota e distancia
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeInfo, setRouteInfo] = useState<{
        distance: number;
        duration: number;
        distanceText: string;
        durationText: string;
        straightLineDistance: number;
        straightLineText: string;
    } | null>(null);

    const canContinue = data.origin !== null && data.destination !== null;

    // Pega localizacao atual no inicio
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const newRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 500);
            }
        } catch (error) {
            console.log('Erro ao obter localizacao:', error);
        } finally {
            setLoadingLocation(false);
        }
    };

    // Calcula rota real quando origem e destino estao definidos
    useEffect(() => {
        const fetchRoute = async () => {
            if (!data.origin?.latitude || !data.destination?.latitude) {
                setRouteCoordinates([]);
                setRouteInfo(null);
                return;
            }

            setLoadingRoute(true);
            try {
                const origin = { latitude: data.origin.latitude, longitude: data.origin.longitude! };
                const destination = { latitude: data.destination.latitude, longitude: data.destination.longitude! };

                // Calcula distancia em linha reta
                const straightLine = calculateDistance(origin, destination);

                // Calcula rota real via OSRM
                const route = await calculateRoute(origin, destination);

                setRouteCoordinates(route.coordinates);
                setRouteInfo({
                    distance: route.distance,
                    duration: route.duration,
                    distanceText: route.distanceText,
                    durationText: route.durationText,
                    straightLineDistance: straightLine,
                    straightLineText: formatDistance(straightLine),
                });

                // Ajusta mapa para mostrar rota completa
                if (route.coordinates.length > 0) {
                    mapRef.current?.fitToCoordinates(route.coordinates, {
                        edgePadding: { top: 100, right: 50, bottom: 180, left: 50 },
                        animated: true,
                    });
                }
            } catch (error) {
                console.error('Erro ao calcular rota:', error);
                // Fallback: usa linha reta
                if (data.origin?.latitude && data.destination?.latitude) {
                    const origin = { latitude: data.origin.latitude, longitude: data.origin.longitude! };
                    const destination = { latitude: data.destination.latitude, longitude: data.destination.longitude! };
                    const straightLine = calculateDistance(origin, destination);
                    setRouteInfo({
                        distance: straightLine * 1.3,
                        duration: (straightLine / 1000) * 2 * 60,
                        distanceText: formatDistance(straightLine * 1.3),
                        durationText: formatDuration((straightLine / 1000) * 2 * 60),
                        straightLineDistance: straightLine,
                        straightLineText: formatDistance(straightLine),
                    });
                }
            } finally {
                setLoadingRoute(false);
            }
        };

        fetchRoute();
    }, [data.origin, data.destination]);

    // Ajusta mapa quando origem/destino mudam
    useEffect(() => {
        if (data.origin && data.destination && routeCoordinates.length === 0) {
            const coords = [
                { latitude: data.origin.latitude!, longitude: data.origin.longitude! },
                { latitude: data.destination.latitude!, longitude: data.destination.longitude! },
            ];
            mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 50, bottom: 180, left: 50 },
                animated: true,
            });
        } else if (data.origin && !data.destination) {
            mapRef.current?.animateToRegion({
                latitude: data.origin.latitude!,
                longitude: data.origin.longitude!,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 500);
        }
    }, [data.origin, data.destination, routeCoordinates]);

    const handleOriginSelect = useCallback((address: AddressResult) => {
        onUpdate({ origin: address });
    }, [onUpdate]);

    const handleDestinationSelect = useCallback((address: AddressResult) => {
        onUpdate({ destination: address });
    }, [onUpdate]);

    return (
        <View style={styles.container}>
            {/* Mapa */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={region}
                    showsUserLocation
                    showsMyLocationButton={false}
                >
                    {/* Marker de origem */}
                    {data.origin && data.origin.latitude && (
                        <Marker
                            coordinate={{
                                latitude: data.origin.latitude,
                                longitude: data.origin.longitude!,
                            }}
                            title="Origem"
                            description={data.origin.mainText}
                        >
                            <View style={styles.originMarker}>
                                <Ionicons name="location" size={24} color="#fff" />
                            </View>
                        </Marker>
                    )}

                    {/* Marker de destino */}
                    {data.destination && data.destination.latitude && (
                        <Marker
                            coordinate={{
                                latitude: data.destination.latitude,
                                longitude: data.destination.longitude!,
                            }}
                            title="Destino"
                            description={data.destination.mainText}
                        >
                            <View style={styles.destinationMarker}>
                                <Ionicons name="flag" size={20} color="#fff" />
                            </View>
                        </Marker>
                    )}

                    {/* Sombra da rota */}
                    {data.origin && data.destination && data.origin.latitude && data.destination.latitude && (
                        <Polyline
                            coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                { latitude: data.origin.latitude, longitude: data.origin.longitude! },
                                { latitude: data.destination.latitude, longitude: data.destination.longitude! },
                            ]}
                            strokeColor="rgba(0,0,0,0.2)"
                            strokeWidth={8}
                        />
                    )}

                    {/* Rota real calculada - segue as ruas */}
                    {data.origin && data.destination && data.origin.latitude && data.destination.latitude && (
                        <Polyline
                            coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                { latitude: data.origin.latitude, longitude: data.origin.longitude! },
                                { latitude: data.destination.latitude, longitude: data.destination.longitude! },
                            ]}
                            strokeColor={theme.colors.primary}
                            strokeWidth={5}
                        />
                    )}
                </MapView>

                {/* Painel de Informacoes da Rota */}
                {routeInfo && (
                    <View style={styles.routeInfoPanel}>
                        <Text style={styles.routeInfoTitle}>Percurso calculado</Text>
                        <View style={styles.routeInfoRow}>
                            <View style={styles.routeInfoItem}>
                                <View style={styles.routeInfoIconContainer}>
                                    <Ionicons name="car" size={22} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.routeInfoValue}>{routeInfo.distanceText}</Text>
                                <Text style={styles.routeInfoLabel}>Distancia</Text>
                            </View>
                            <View style={styles.routeInfoDivider} />
                            <View style={styles.routeInfoItem}>
                                <View style={[styles.routeInfoIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
                                    <Ionicons name="time" size={22} color={theme.colors.success} />
                                </View>
                                <Text style={[styles.routeInfoValue, { color: theme.colors.success }]}>{routeInfo.durationText}</Text>
                                <Text style={styles.routeInfoLabel}>Tempo est.</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Loading rota */}
                {loadingRoute && (
                    <View style={styles.routeLoadingOverlay}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.routeLoadingText}>Calculando rota...</Text>
                    </View>
                )}

                {/* Loading overlay */}
                {loadingLocation && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Obtendo localizacao...</Text>
                    </View>
                )}

                {/* Botao de centralizar */}
                <TouchableOpacity
                    style={styles.myLocationButton}
                    onPress={getCurrentLocation}
                >
                    <Ionicons name="locate" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Formulario */}
            <View style={styles.formContainer}>
                {/* Card de Rota agrupado */}
                <View style={styles.routeCard}>
                    <View style={styles.routeCardHeader}>
                        <View style={styles.routeCardIcon}>
                            <Ionicons name="navigate" size={18} color="#fff" />
                        </View>
                        <Text style={styles.routeCardTitle}>Defina sua Rota</Text>
                    </View>

                    <View style={styles.formContent}>
                        {/* Linha visual conectando origem e destino */}
                        <View style={styles.routeLine}>
                            <View style={styles.originDot}>
                                <Ionicons name="radio-button-on" size={14} color={theme.colors.primary} />
                            </View>
                            <View style={styles.dashedLine} />
                            <View style={styles.destinationDot}>
                                <Ionicons name="flag" size={14} color={theme.colors.success} />
                            </View>
                        </View>

                        {/* Inputs de endereco */}
                        <View style={styles.inputs}>
                            <AddressAutocomplete
                                label="📍 Ponto de Partida"
                                placeholder="Digite origem ou CEP"
                                icon="location"
                                value={data.origin}
                                onSelect={handleOriginSelect}
                                onClear={() => onUpdate({ origin: null })}
                            />

                            <AddressAutocomplete
                                label="🏁 Destino"
                                placeholder="Digite destino ou CEP"
                                icon="flag"
                                value={data.destination}
                                onSelect={handleDestinationSelect}
                                onClear={() => onUpdate({ destination: null })}
                            />
                        </View>
                    </View>
                </View>

                {/* Botao continuar melhorado */}
                <TouchableOpacity
                    style={[styles.nextButton, !canContinue && styles.nextButtonDisabled]}
                    onPress={onNext}
                    disabled={!canContinue}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                    <Text style={styles.nextButtonText}>Continuar para Data e Hora</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        height: height * 0.45,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textSecondary,
    },
    myLocationButton: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    originMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    destinationMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    formContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        marginTop: -20,
        padding: theme.spacing.lg,
    },
    routeCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary + '30',
        ...theme.shadows.sm,
    },
    routeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    routeCardIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    routeCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    formContent: {
        flexDirection: 'row',
        flex: 1,
    },
    routeLine: {
        width: 28,
        alignItems: 'center',
        paddingTop: 38,
        marginRight: theme.spacing.sm,
    },
    originDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dashedLine: {
        flex: 1,
        width: 2,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.xs,
        minHeight: 30,
        borderStyle: 'dashed',
    },
    destinationDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.successLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputs: {
        flex: 1,
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.sm,
        ...theme.shadows.primary,
    },
    nextButtonDisabled: {
        backgroundColor: theme.colors.border,
        ...theme.shadows.sm,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    routeInfoPanel: {
        position: 'absolute',
        bottom: 16,
        left: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    routeInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    routeInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    routeInfoItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: theme.spacing.xs,
    },
    routeInfoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    routeInfoLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    routeInfoValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    routeInfoValueSmall: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    routeInfoDivider: {
        width: 1,
        height: 50,
        backgroundColor: theme.colors.border,
    },
    routeLoadingOverlay: {
        position: 'absolute',
        top: theme.spacing.md,
        left: '50%',
        marginLeft: -70,
        width: 140,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.md,
    },
    routeLoadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
});
