import React, { useState, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
    Image,
    Modal,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import NotificationBadge from '../components/NotificationBadge';
import { TripsListSkeleton, Skeleton } from '../components/Skeleton';
import theme from '../theme';

interface Trip {
    id: string;
    origin: string;
    destination: string;
    originAddress?: string;
    destinationAddress?: string;
    date: string;
    departureTime?: string;
    estimatedArrival?: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    price?: number;
    distance?: number;
    duration?: string;
    // Dados do motorista (para cliente)
    driver?: {
        id: string;
        name: string;
        phone: string;
        profilePhoto?: string;
        vehicle?: {
            model: string;
            plate: string;
            color?: string;
        };
    };
    // Dados do cliente (para motorista)
    customer?: {
        id: string;
        name: string;
        phone: string;
        profilePhoto?: string;
    };
    // Dados da mercadoria
    cargo?: {
        description: string;
        weight: number;
        category: string;
    };
    // Rastreamento
    currentLocation?: {
        lat: number;
        lng: number;
        lastUpdate?: string;
    };
}

export default function TripsScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const isDriver = user?.userType === 'driver';

    // Otimizacao: useMemo para filtrar viagens e contar por status
    const { filteredTrips, tripCounts } = useMemo(() => {
        const counts = {
            all: trips.length,
            scheduled: 0,
            inProgress: 0,
            completed: 0,
        };

        const filtered = trips.filter(trip => {
            // Conta por status
            if (trip.status === 'SCHEDULED') counts.scheduled++;
            else if (trip.status === 'IN_PROGRESS') counts.inProgress++;
            else if (trip.status === 'COMPLETED') counts.completed++;

            // Aplica filtro
            switch (activeFilter) {
                case 'SCHEDULED':
                    return trip.status === 'SCHEDULED';
                case 'IN_PROGRESS':
                    return trip.status === 'IN_PROGRESS';
                case 'COMPLETED':
                    return trip.status === 'COMPLETED';
                default:
                    return true;
            }
        });

        return { filteredTrips: filtered, tripCounts: counts };
    }, [trips, activeFilter]);

    useFocusEffect(
        useCallback(() => {
            loadTrips();
        }, [])
    );

    async function loadTrips() {
        try {
            // Ambos usam orders - motorista vê pedidos que aceitou, cliente vê seus pedidos aceitos
            const response = await api.get('/orders/my-orders');

            let data = response.data || [];

            console.log('[TripsScreen] Orders recebidos:', data.length, data.map((o: any) => ({ status: o.status, driver: o.driver?.name })));

            // Para cliente: filtra apenas pedidos aceitos (ACCEPTED, IN_PROGRESS, COMPLETED)
            // Para motorista: também filtra apenas pedidos que ele aceitou
            const acceptedStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

            if (!isDriver) {
                // Cliente vê apenas seus pedidos que foram aceitos por algum motorista
                data = data.filter((order: any) =>
                    acceptedStatuses.includes(order.status) && order.customerId === user?.id
                );
            } else {
                // Motorista vê pedidos que ele aceitou
                data = data.filter((order: any) =>
                    acceptedStatuses.includes(order.status) && order.driverId === user?.id
                );
            }

            console.log('[TripsScreen] Após filtro:', data.length);

            // Mapeia os dados do order para o formato esperado pela tela
            data = data.map((order: any) => ({
                id: order.id,
                origin: order.tripOrigin || 'Origem',
                destination: order.tripDestination || 'Destino',
                // tripDate já vem formatado do backend como "dd/mm/yyyy"
                date: order.tripDate || order.createdAt,
                status: mapOrderStatusToTripStatus(order.status),
                price: order.estimatedPrice || order.finalPrice || 0,
                // Para cliente: mostra dados do motorista (se existir)
                driver: !isDriver && order.driver ? {
                    id: order.driver.id,
                    name: order.driver.name || 'Motorista',
                    phone: order.driver.phone || '',
                    profilePhoto: order.driver.profilePhoto || null,
                    vehicle: order.driver.vehicle || null,
                } : undefined,
                // Para motorista: mostra dados do cliente
                customer: isDriver && order.customer ? {
                    id: order.customer.id,
                    name: order.customer.name || 'Cliente',
                    phone: order.customer.phone || '',
                    profilePhoto: order.customer.profilePhoto || null,
                } : undefined,
                cargo: order.description ? {
                    description: order.description,
                    weight: order.weight || 0,
                    category: 'Mercadoria',
                } : undefined,
                // Dados adicionais para referência
                orderId: order.id,
                driverId: order.driverId,
            }));

            setTrips(data);
        } catch (error: any) {
            // Silencia erros - pode não ter viagens/envios ainda
            console.log('[TripsScreen] Erro ao carregar:', error);
            setTrips([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    // Mapeia status do Order para status de Trip para exibição
    function mapOrderStatusToTripStatus(orderStatus: string): string {
        switch (orderStatus) {
            case 'ACCEPTED':
                return 'SCHEDULED';
            case 'IN_PROGRESS':
                return 'IN_PROGRESS';
            case 'COMPLETED':
                return 'COMPLETED';
            case 'CANCELLED':
                return 'CANCELLED';
            default:
                return 'SCHEDULED';
        }
    }

    function onRefresh() {
        setRefreshing(true);
        loadTrips();
    }

    function openDetailModal(trip: Trip) {
        setSelectedTrip(trip);
        setShowDetailModal(true);
    }

    function handleCallPhone(phone: string) {
        Linking.openURL(`tel:${phone}`);
    }

    function handleOpenChat(trip: Trip) {
        const otherUser = isDriver ? trip.customer : trip.driver;
        if (otherUser && otherUser.id && otherUser.name) {
            navigation.navigate('Chat', {
                tripId: trip.id,
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.name,
                    profilePhoto: otherUser.profilePhoto || null,
                },
                tripOrigin: trip.origin,
                tripDestination: trip.destination,
            });
        }
    }

    function handleTrackTrip(trip: Trip) {
        // Abre mapa com localização atual ou rota
        if (trip.currentLocation) {
            const { lat, lng } = trip.currentLocation;
            Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
        } else if (trip.originAddress && trip.destinationAddress) {
            const origin = encodeURIComponent(trip.originAddress);
            const dest = encodeURIComponent(trip.destinationAddress);
            Linking.openURL(`https://www.google.com/maps/dir/${origin}/${dest}`);
        }
    }

    function formatDate(dateString: string) {
        if (!dateString) return 'Data não informada';

        // Se já está no formato brasileiro dd/mm/yyyy, retorna direto
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data não informada';
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    function getStatusConfig(status: string) {
        switch (status) {
            case 'SCHEDULED':
                return { color: '#FFA500', label: 'Agendada', icon: 'calendar-outline' };
            case 'IN_PROGRESS':
                return { color: '#4facfe', label: 'Em andamento', icon: 'navigate-outline' };
            case 'COMPLETED':
                return { color: '#00f260', label: 'Concluida', icon: 'checkmark-done-outline' };
            case 'CANCELLED':
                return { color: '#ff4444', label: 'Cancelada', icon: 'close-circle-outline' };
            default:
                return { color: '#666', label: status, icon: 'help-outline' };
        }
    }

    // Skeleton loading - melhor UX que spinner simples
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Header skeleton */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Skeleton width={100} height={28} borderRadius={8} />
                    </View>
                    <View style={styles.headerActions}>
                        <Skeleton width={44} height={44} borderRadius={22} />
                    </View>
                </View>

                {/* Filtros skeleton */}
                <View style={styles.filterContainer}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Skeleton width={80} height={36} borderRadius={18} />
                        <Skeleton width={100} height={36} borderRadius={18} />
                        <Skeleton width={120} height={36} borderRadius={18} />
                    </View>
                </View>

                {/* Lista skeleton */}
                <View style={styles.content}>
                    <TripsListSkeleton count={4} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Viagens</Text>
                    {tripCounts.inProgress > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>
                                {tripCounts.inProgress}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <NotificationBadge />
                    {!isDriver && (
                        <TouchableOpacity
                            style={[styles.addButton, styles.addButtonCustomer]}
                            onPress={() => navigation.navigate('SearchTrip')}
                        >
                            <Ionicons name="search" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filtros - usando tripCounts otimizado */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'ALL' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('ALL')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
                            Todas ({tripCounts.all})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'SCHEDULED' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('SCHEDULED')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'SCHEDULED' && styles.filterTextActive]}>
                            Agendadas ({tripCounts.scheduled})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'IN_PROGRESS' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('IN_PROGRESS')}
                    >
                        <Ionicons
                            name="navigate"
                            size={14}
                            color={activeFilter === 'IN_PROGRESS' ? '#fff' : theme.colors.primary}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.filterText, activeFilter === 'IN_PROGRESS' && styles.filterTextActive]}>
                            Em andamento ({tripCounts.inProgress})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'COMPLETED' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('COMPLETED')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'COMPLETED' && styles.filterTextActive]}>
                            Concluidas ({tripCounts.completed})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Card de acao rapida para cliente */}
            {!isDriver && activeFilter === 'ALL' && (
                <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => navigation.navigate('SearchTrip')}
                    activeOpacity={0.8}
                >
                    <View style={styles.quickActionIcon}>
                        <Ionicons name="cube" size={28} color="#fff" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Enviar Mercadoria</Text>
                        <Text style={styles.quickActionSubtitle}>
                            Encontre motoristas disponiveis para seu trajeto
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#4facfe" />
                </TouchableOpacity>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredTrips.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {/* Ilustracao personalizada */}
                        <View style={styles.illustrationContainer}>
                            {/* Linha pontilhada decorativa */}
                            <View style={styles.dashedCircle} />

                            {/* Icone de localizacao esquerda */}
                            <View style={styles.locationIconLeft}>
                                <Ionicons name="location" size={20} color="#8E99A4" />
                            </View>

                            {/* Icone de localizacao direita */}
                            <View style={styles.locationIconRight}>
                                <Ionicons name="location" size={16} color="#8E99A4" />
                            </View>

                            {/* Duas pessoas com mapa */}
                            <View style={styles.peopleWithMap}>
                                {/* Pessoa 1 */}
                                <View style={[styles.personAvatar, { backgroundColor: '#4facfe', marginRight: -15, zIndex: 2 }]}>
                                    <Ionicons name="person" size={28} color="#fff" />
                                </View>

                                {/* Mapa/Documento central */}
                                <View style={styles.mapDocument}>
                                    <Ionicons name="map" size={40} color="#4facfe" />
                                </View>

                                {/* Pessoa 2 */}
                                <View style={[styles.personAvatar, { backgroundColor: '#00f260', marginLeft: -15, zIndex: 2 }]}>
                                    <Ionicons name="person" size={28} color="#fff" />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'ALL'
                                ? 'Suas viagens futuras aparecerao aqui.'
                                : 'Nenhuma viagem encontrada'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeFilter === 'ALL'
                                ? (isDriver
                                    ? 'Encontre a viagem perfeita entre milhares de destinos ou publique sua carona para dividir os custos.'
                                    : 'Encontre motoristas para enviar suas mercadorias ou acompanhe seus envios em tempo real.')
                                : 'Nao ha viagens com este status no momento.'}
                        </Text>
                        {activeFilter === 'ALL' && !isDriver && (
                            <TouchableOpacity
                                style={[styles.emptyButton, styles.emptyButtonCustomer]}
                                onPress={() => navigation.navigate('SearchTrip')}
                            >
                                <Ionicons name="cube" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.emptyButtonText}>Enviar Mercadoria</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredTrips.map((trip) => {
                        const statusConfig = getStatusConfig(trip.status);
                        const otherUser = isDriver ? trip.customer : trip.driver;

                        return (
                            <TouchableOpacity
                                key={trip.id}
                                style={[
                                    styles.tripCard,
                                    trip.status === 'IN_PROGRESS' && styles.tripCardInProgress
                                ]}
                                onPress={() => openDetailModal(trip)}
                            >
                                {/* Header do card */}
                                <View style={styles.tripHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                                        <Ionicons name={statusConfig.icon as any} size={14} color="#fff" />
                                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                                    </View>
                                    <Text style={styles.tripDate}>{formatDate(trip.date)}</Text>
                                </View>

                                {/* Informacoes do usuario */}
                                {otherUser && otherUser.name && (
                                    <View style={styles.userInfo}>
                                        {otherUser.profilePhoto ? (
                                            <Image source={{ uri: otherUser.profilePhoto }} style={styles.userPhoto} />
                                        ) : (
                                            <View style={styles.userPhotoPlaceholder}>
                                                <Ionicons name="person" size={20} color="#999" />
                                            </View>
                                        )}
                                        <View style={styles.userDetails}>
                                            <Text style={styles.userName}>{otherUser.name}</Text>
                                            {!isDriver && trip.driver?.vehicle && (
                                                <Text style={styles.vehicleInfo}>
                                                    {trip.driver.vehicle.model} - {trip.driver.vehicle.plate}
                                                </Text>
                                            )}
                                        </View>
                                        {(trip.status === 'IN_PROGRESS' || trip.status === 'SCHEDULED') && otherUser.phone && (
                                            <View style={styles.actionIcons}>
                                                <TouchableOpacity
                                                    style={styles.iconButton}
                                                    onPress={() => handleOpenChat(trip)}
                                                >
                                                    <Ionicons name="chatbubble-ellipses" size={20} color="#4facfe" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Rota */}
                                <View style={styles.tripRoute}>
                                    <View style={styles.routePoint}>
                                        <View style={styles.originDot} />
                                        <Text style={styles.routeText} numberOfLines={1}>{trip.origin}</Text>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={styles.destinationDot} />
                                        <Text style={styles.routeText} numberOfLines={1}>{trip.destination}</Text>
                                    </View>
                                </View>

                                {/* Detalhes da mercadoria */}
                                {trip.cargo && (
                                    <View style={styles.cargoInfo}>
                                        <View style={styles.cargoItem}>
                                            <Ionicons name="cube-outline" size={16} color="#666" />
                                            <Text style={styles.cargoText}>{trip.cargo.description}</Text>
                                        </View>
                                        <View style={styles.cargoItem}>
                                            <Ionicons name="scale-outline" size={16} color="#666" />
                                            <Text style={styles.cargoText}>{trip.cargo.weight} kg</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Footer com preco e acoes */}
                                <View style={styles.tripFooter}>
                                    {trip.price ? (
                                        <Text style={styles.tripPrice}>
                                            R$ {trip.price.toFixed(2)}
                                        </Text>
                                    ) : (
                                        <View />
                                    )}

                                    {/* Botao de rastreamento para viagem em andamento */}
                                    {trip.status === 'IN_PROGRESS' && (
                                        <TouchableOpacity
                                            style={styles.trackButton}
                                            onPress={() => handleTrackTrip(trip)}
                                        >
                                            <Ionicons name="location" size={18} color="#fff" />
                                            <Text style={styles.trackButtonText}>Rastrear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Indicador de viagem em tempo real */}
                                {trip.status === 'IN_PROGRESS' && (
                                    <View style={styles.liveIndicator}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>Ao vivo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Modal de Detalhes */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalhes da Viagem</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedTrip && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusConfig(selectedTrip.status).color }
                                    ]}>
                                        <Ionicons
                                            name={getStatusConfig(selectedTrip.status).icon as any}
                                            size={14}
                                            color="#fff"
                                        />
                                        <Text style={styles.statusText}>
                                            {getStatusConfig(selectedTrip.status).label}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Trajeto</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedTrip.origin} → {selectedTrip.destination}
                                    </Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Data</Text>
                                    <Text style={styles.detailValue}>{formatDate(selectedTrip.date)}</Text>
                                </View>

                                {selectedTrip.departureTime && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Horario de Saida</Text>
                                        <Text style={styles.detailValue}>{selectedTrip.departureTime}</Text>
                                    </View>
                                )}

                                {selectedTrip.cargo && (
                                    <>
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Mercadoria</Text>
                                            <Text style={styles.detailValue}>{selectedTrip.cargo.description}</Text>
                                        </View>
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Peso</Text>
                                            <Text style={styles.detailValue}>{selectedTrip.cargo.weight} kg</Text>
                                        </View>
                                    </>
                                )}

                                {selectedTrip.price && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Valor</Text>
                                        <Text style={[styles.detailValue, styles.priceValue]}>
                                            R$ {selectedTrip.price.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                {/* Informacoes do motorista/cliente */}
                                {(() => {
                                    const contactUser = isDriver ? selectedTrip.customer : selectedTrip.driver;
                                    if (!contactUser || !contactUser.name) return null;
                                    return (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>
                                                {isDriver ? 'Cliente' : 'Motorista'}
                                            </Text>
                                            <View style={styles.personCard}>
                                                <View style={styles.userPhotoPlaceholder}>
                                                    <Ionicons name="person" size={24} color="#999" />
                                                </View>
                                                <View style={styles.personInfo}>
                                                    <Text style={styles.personName}>
                                                        {contactUser.name}
                                                    </Text>
                                                    {!isDriver && selectedTrip.driver?.vehicle && (
                                                        <Text style={styles.personSubtext}>
                                                            {selectedTrip.driver.vehicle.model} - {selectedTrip.driver.vehicle.plate}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            {contactUser.phone && (
                                                <View style={styles.contactButtons}>
                                                    <TouchableOpacity
                                                        style={styles.contactButton}
                                                        onPress={() => handleCallPhone(contactUser.phone)}
                                                    >
                                                        <Ionicons name="call" size={20} color="#4facfe" />
                                                        <Text style={styles.contactButtonText}>Ligar</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })()}

                                {/* Botao de rastreamento */}
                                {selectedTrip.status === 'IN_PROGRESS' && (
                                    <TouchableOpacity
                                        style={styles.modalTrackButton}
                                        onPress={() => {
                                            setShowDetailModal(false);
                                            handleTrackTrip(selectedTrip);
                                        }}
                                    >
                                        <Ionicons name="location" size={24} color="#fff" />
                                        <Text style={styles.modalTrackButtonText}>Rastrear no Mapa</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerBadge: {
        backgroundColor: '#4facfe',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 10,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addButton: {
        backgroundColor: '#4facfe',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonCustomer: {
        backgroundColor: '#00f260',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    filterButtonActive: {
        backgroundColor: '#4facfe',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    quickActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e8f4fe',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    quickActionContent: {
        flex: 1,
    },
    quickActionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    quickActionSubtitle: {
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
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    illustrationContainer: {
        width: 260,
        height: 200,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dashedCircle: {
        position: 'absolute',
        width: 220,
        height: 180,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    locationIconLeft: {
        position: 'absolute',
        left: 15,
        top: 40,
        opacity: 0.6,
    },
    locationIconRight: {
        position: 'absolute',
        right: 20,
        bottom: 50,
        opacity: 0.6,
    },
    peopleWithMap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    personAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    mapDocument: {
        width: 80,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e8f4fe',
        zIndex: 1,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 30,
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 25,
    },
    emptyButtonCustomer: {
        backgroundColor: '#00f260',
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    tripCardInProgress: {
        borderWidth: 2,
        borderColor: '#4facfe',
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    tripDate: {
        fontSize: 12,
        color: '#999',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userPhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userPhotoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    actionIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripRoute: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4facfe',
        marginRight: 10,
    },
    destinationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00f260',
        marginRight: 10,
    },
    routeLine: {
        width: 2,
        height: 15,
        backgroundColor: '#ddd',
        marginLeft: 4,
        marginVertical: 2,
    },
    routeText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    cargoInfo: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    cargoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    cargoText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    tripFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    tripPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00f260',
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    trackButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    liveIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff4444',
    },
    liveText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ff4444',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00f260',
    },
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    personInfo: {
        flex: 1,
        marginLeft: 12,
    },
    personName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    personSubtext: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#e8f4fe',
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4facfe',
    },
    modalTrackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#4facfe',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    modalTrackButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
