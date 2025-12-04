import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFullImageUrl } from '../services/api';

// Interface que representa os dados vindos do backend
interface BackendTrip {
    id: string;
    originName: string;
    originLat: number;
    originLng: number;
    destName: string;
    destLat: number;
    destLng: number;
    departureAt: string;
    estimatedArrival: string;
    distanceKm: number;
    durationMinutes: number;
    availableSeats?: number;
    availableCapacityKg?: number;
    status: string;
    driver: {
        id: string;
        name: string;
        phone?: string;
        profilePhoto?: string;
    };
    vehicle?: {
        id: string;
        brand: string;
        model: string;
        color: string;
        plate: string;
        type: string;
        capacityKg?: number;
    };
    routeMatch?: {
        originDistanceKm: number;
        destinationDistanceKm: number;
        detourKm: number;
    };
}

export default function SearchResultsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { trips = [], searchParams } = route.params || {};
    const [refreshing, setRefreshing] = useState(false);

    function formatTime(dateString: string): string {
        if (!dateString) return '--:--';
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatDate(dateString: string): string {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    }

    function formatDuration(minutes: number): string {
        if (!minutes) return '';
        const days = Math.floor(minutes / (24 * 60));
        const hours = Math.floor((minutes % (24 * 60)) / 60);
        const mins = minutes % 60;
        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0 || parts.length === 0) parts.push(`${mins}min`);
        return parts.join(' ');
    }

    function getVehicleIcon(type?: string): keyof typeof Ionicons.glyphMap {
        switch (type?.toLowerCase()) {
            case 'car':
            case 'carro':
                return 'car-outline';
            case 'van':
                return 'bus-outline';
            case 'truck':
            case 'caminhao':
                return 'cube-outline';
            case 'motorcycle':
            case 'moto':
                return 'bicycle-outline';
            default:
                return 'car-outline';
        }
    }

    function handleSelectTrip(trip: BackendTrip) {
        navigation.navigate('RegisterMerchandise', {
            trip,
            searchParams,
        });
    }

    function onRefresh() {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }

    // Extrai cidade do nome do endereço (ex: "Rua X, Bairro, Cidade" -> "Cidade")
    function extractCity(fullAddress: string): string {
        if (!fullAddress) return '';
        const parts = fullAddress.split(',').map(p => p.trim());
        // Geralmente a cidade é a última ou penúltima parte
        return parts[parts.length - 1] || parts[0] || fullAddress;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Motoristas Disponiveis</Text>
                    <Text style={styles.headerSubtitle}>
                        {searchParams?.originCity} → {searchParams?.destinationCity}
                    </Text>
                </View>
            </View>

            <View style={styles.dateBar}>
                <Ionicons name="calendar-outline" size={18} color="#4facfe" />
                <Text style={styles.dateText}>
                    {formatDate(searchParams?.date || new Date().toISOString())}
                </Text>
                <Text style={styles.resultsCount}>
                    {trips.length} {trips.length === 1 ? 'resultado' : 'resultados'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {trips.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyTitle}>
                            Nenhum motorista encontrado
                        </Text>
                        <Text style={styles.emptyText}>
                            Nao encontramos motoristas com viagens programadas para este
                            trajeto. Tente outros trajetos.
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.emptyButtonText}>Nova Busca</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    trips.map((trip: BackendTrip) => (
                        <TouchableOpacity
                            key={trip.id}
                            style={styles.tripCard}
                            onPress={() => handleSelectTrip(trip)}
                        >
                            {/* Driver Info */}
                            <View style={styles.driverSection}>
                                <View style={styles.driverInfo}>
                                    {trip.driver?.profilePhoto ? (
                                        <Image
                                            source={{ uri: getFullImageUrl(trip.driver.profilePhoto) || undefined }}
                                            style={styles.driverPhoto}
                                        />
                                    ) : (
                                        <View style={styles.driverPhotoPlaceholder}>
                                            <Ionicons name="person" size={24} color="#666" />
                                        </View>
                                    )}
                                    <View style={styles.driverDetails}>
                                        <Text style={styles.driverName}>{trip.driver?.name || 'Motorista'}</Text>
                                        {trip.driver?.phone && (
                                            <View style={styles.ratingContainer}>
                                                <Ionicons name="call-outline" size={14} color="#666" />
                                                <Text style={styles.tripsCount}>{trip.driver.phone}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {trip.routeMatch && (
                                    <View style={styles.matchBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color="#00f260" />
                                        <Text style={styles.matchText}>Na rota</Text>
                                    </View>
                                )}
                            </View>

                            {/* Vehicle Info */}
                            {trip.vehicle && (
                                <View style={styles.vehicleSection}>
                                    <View style={styles.vehicleIcon}>
                                        <Ionicons
                                            name={getVehicleIcon(trip.vehicle?.type)}
                                            size={20}
                                            color="#4facfe"
                                        />
                                    </View>
                                    <Text style={styles.vehicleText}>
                                        {trip.vehicle.brand} {trip.vehicle.model} - {trip.vehicle.color}
                                    </Text>
                                </View>
                            )}

                            {/* Route Info */}
                            <View style={styles.routeSection}>
                                <View style={styles.routePoint}>
                                    <View style={styles.routeOriginDot} />
                                    <View style={styles.routeInfo}>
                                        <Text style={styles.routeCity}>{extractCity(trip.originName)}</Text>
                                        <Text style={styles.routeAddress} numberOfLines={1}>{trip.originName}</Text>
                                        <Text style={styles.routeTime}>
                                            Saida: {formatDate(trip.departureAt)} {formatTime(trip.departureAt)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.routeDashedLine} />

                                <View style={styles.routePoint}>
                                    <View style={styles.routeDestDot} />
                                    <View style={styles.routeInfo}>
                                        <Text style={styles.routeCity}>{extractCity(trip.destName)}</Text>
                                        <Text style={styles.routeAddress} numberOfLines={1}>{trip.destName}</Text>
                                        <Text style={styles.routeTime}>
                                            Chegada: {formatTime(trip.estimatedArrival)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={styles.cardFooter}>
                                <View style={styles.spaceInfo}>
                                    <Ionicons name="cube-outline" size={18} color="#666" />
                                    <Text style={styles.spaceText}>
                                        {trip.availableCapacityKg || 0}kg disponiveis
                                    </Text>
                                </View>

                                <View style={styles.distanceInfo}>
                                    <Ionicons name="navigate-outline" size={18} color="#4facfe" />
                                    <Text style={styles.distanceText}>
                                        {trip.distanceKm?.toFixed(0) || 0} km
                                    </Text>
                                </View>

                                <View style={styles.durationInfo}>
                                    <Ionicons name="time-outline" size={18} color="#666" />
                                    <Text style={styles.durationText}>
                                        {formatDuration(trip.durationMinutes)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.selectButton}>
                                <Text style={styles.selectButtonText}>Selecionar</Text>
                                <Ionicons name="arrow-forward" size={18} color="#4facfe" />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    dateBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4fe',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    dateText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
        textTransform: 'capitalize',
    },
    resultsCount: {
        fontSize: 13,
        color: '#666',
    },
    content: {
        padding: 15,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: '#4facfe',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 25,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    driverSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    driverPhotoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverDetails: {
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },
    tripsCount: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    insuranceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    insuranceText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#00f260',
        marginLeft: 4,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    matchText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#00f260',
        marginLeft: 4,
    },
    vehicleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    vehicleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e8f4fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    vehicleText: {
        fontSize: 14,
        color: '#333',
    },
    routeSection: {
        marginBottom: 15,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeOriginDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4facfe',
        marginTop: 4,
        marginRight: 12,
    },
    routeDestDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00f260',
        marginTop: 4,
        marginRight: 12,
    },
    routeDashedLine: {
        width: 2,
        height: 25,
        backgroundColor: '#ddd',
        marginLeft: 5,
        marginVertical: 5,
    },
    routeInfo: {
        flex: 1,
    },
    routeCity: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    routeAddress: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    routeTime: {
        fontSize: 12,
        color: '#4facfe',
        fontWeight: '500',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    spaceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    distanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4facfe',
        marginLeft: 6,
    },
    durationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    selectButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4facfe',
        marginRight: 8,
    },
});
