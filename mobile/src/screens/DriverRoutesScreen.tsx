import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    Modal,
    ActivityIndicator,
    Platform,
    Dimensions,
    FlatList,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MapView, { Marker, MapPressEvent, Polyline, PROVIDER_GOOGLE } from '../components/MapView';
import * as Location from 'expo-location';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const { width, height } = Dimensions.get('window');

interface Trip {
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
    status: string;
    availableSeats?: number;
    availableCapacityKg?: number;
    notes?: string;
}

type SelectingPoint = 'origin' | 'destination' | null;

export default function DriverRoutesScreen() {
    // Estados principais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectingPoint, setSelectingPoint] = useState<SelectingPoint>(null);
    const [loading, setLoading] = useState(false);
    const [showValidation, setShowValidation] = useState(false); // Para mostrar erros de validacao
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [trips, setTrips] = useState<Trip[]>([]);

    // Estados do formulário
    const [originName, setOriginName] = useState('');
    const [originLat, setOriginLat] = useState<number | null>(null);
    const [originLng, setOriginLng] = useState<number | null>(null);
    const [destName, setDestName] = useState('');
    const [destLat, setDestLat] = useState<number | null>(null);
    const [destLng, setDestLng] = useState<number | null>(null);
    const [departureDate, setDepartureDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [notes, setNotes] = useState('');

    // Estado para edição
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Estado do mapa
    const [mapRegion, setMapRegion] = useState({
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [searchAddress, setSearchAddress] = useState('');
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Estado para visualizar viagem no mapa
    const [showViewTripModal, setShowViewTripModal] = useState(false);
    const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
    const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const mapRef = useRef<MapView>(null);
    const viewMapRef = useRef<MapView>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadTrips();
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setMapRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        } catch (error) {
            console.log('Erro ao obter localizacao:', error);
        }
    };

    const loadTrips = async () => {
        setLoadingTrips(true);
        try {
            const response = await api.get('/trips/my-trips');
            setTrips(response.data || []);
        } catch (error) {
            setTrips([]);
        } finally {
            setLoadingTrips(false);
        }
    };

    // ============ FUNCOES DO MAPA ============
    const openMapForSelection = (type: 'origin' | 'destination') => {
        console.log('Abrindo mapa para:', type);
        setSelectingPoint(type);
        setTempMarker(null);
        setSearchAddress('');
        setAddressSuggestions([]);
        setShowSuggestions(false);
        // Fecha o modal de criação primeiro, depois abre o do mapa
        setShowCreateModal(false);
        setTimeout(() => {
            setShowMapModal(true);
        }, 300);
    };

    // Buscar endereços usando Nominatim (OpenStreetMap)
    const searchAddressApi = async (query: string) => {
        if (query.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSearchingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5&addressdetails=1`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Language': 'pt-BR,pt;q=0.9',
                        'User-Agent': 'VaiNoPuloApp/1.0 (https://vainopulo.com.br)',
                    },
                }
            );

            // Verifica se a resposta é JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.log('Nominatim retornou HTML ao invés de JSON. Status:', response.status);
                throw new Error('Resposta inválida do servidor');
            }

            const data = await response.json();
            setAddressSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (error) {
            console.log('Erro ao buscar endereço:', error);
            setAddressSuggestions([]);
        } finally {
            setSearchingAddress(false);
        }
    };

    // Debounce para busca de endereço
    const handleAddressChange = (text: string) => {
        setSearchAddress(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            searchAddressApi(text);
        }, 500);
    };

    // Selecionar sugestão de endereço
    const selectAddressSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        setTempMarker({ latitude: lat, longitude: lng });
        setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setSearchAddress(suggestion.display_name);
        setShowSuggestions(false);

        // Animar o mapa para a nova posição
        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 500);
    };

    // Geocodificacao reversa - obter endereco a partir de coordenadas
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Language': 'pt-BR,pt;q=0.9',
                        'User-Agent': 'VaiNoPuloApp/1.0 (https://vainopulo.com.br)',
                    },
                }
            );

            // Verifica se a resposta é JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.log('ReverseGeocode: resposta inválida. Status:', response.status);
                return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }

            const data = await response.json();

            if (data && data.address) {
                // Extrai partes do endereco para formar um nome curto
                const { road, neighbourhood, suburb, city, town, village } = data.address;
                const street = road || '';
                const area = neighbourhood || suburb || '';
                const cityName = city || town || village || '';

                // Monta o endereco priorizando rua e bairro
                const parts = [street, area, cityName].filter(Boolean);
                return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }

            return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.log('Erro na geocodificacao reversa:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    // Funcao para truncar endereco para exibicao em cards
    const truncateAddress = (address: string, maxLength: number = 35): string => {
        if (!address) return '';
        if (address.length <= maxLength) return address;
        return address.substring(0, maxLength) + '...';
    };

    // Funcao para buscar o tracado da rota usando OSRM (gratuito)
    const fetchRouteCoordinates = async (
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number
    ): Promise<{ latitude: number; longitude: number }[]> => {
        try {
            // Usando OSRM (Open Source Routing Machine) - gratuito
            const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const coordinates = data.routes[0].geometry.coordinates;
                // OSRM retorna [lng, lat], precisamos converter para {latitude, longitude}
                return coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
            }

            // Fallback: retorna linha reta
            return [
                { latitude: originLat, longitude: originLng },
                { latitude: destLat, longitude: destLng },
            ];
        } catch (error) {
            console.log('Erro ao buscar rota:', error);
            // Fallback: retorna linha reta
            return [
                { latitude: originLat, longitude: originLng },
                { latitude: destLat, longitude: destLng },
            ];
        }
    };

    // Funcao para visualizar viagem no mapa
    const viewTripOnMap = async (trip: Trip) => {
        setViewingTrip(trip);
        setRouteCoordinates([]);
        setLoadingRoute(true);
        setShowViewTripModal(true);

        // Busca o tracado da rota
        const coords = await fetchRouteCoordinates(
            trip.originLat,
            trip.originLng,
            trip.destLat,
            trip.destLng
        );
        setRouteCoordinates(coords);
        setLoadingRoute(false);

        // Animar para mostrar a rota completa apos o modal abrir
        setTimeout(() => {
            if (viewMapRef.current && coords.length > 0) {
                viewMapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                    animated: true,
                });
            }
        }, 500);
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        console.log('Ponto selecionado:', latitude, longitude);
        setTempMarker({ latitude, longitude });
    };

    const confirmMapSelection = async () => {
        if (!tempMarker) {
            Alert.alert('Atencao', 'Toque no mapa para selecionar um ponto');
            return;
        }

        setReverseGeocodingLoading(true);

        // Tenta obter o endereco via geocodificacao reversa
        let address: string;

        // Se o usuario buscou um endereco, usa o que foi buscado
        if (searchAddress && searchAddress.length > 10 && !searchAddress.includes(',') && addressSuggestions.length > 0) {
            address = searchAddress;
        } else {
            // Caso contrario, faz geocodificacao reversa
            address = await reverseGeocode(tempMarker.latitude, tempMarker.longitude);
        }

        setReverseGeocodingLoading(false);

        if (selectingPoint === 'origin') {
            setOriginLat(tempMarker.latitude);
            setOriginLng(tempMarker.longitude);
            setOriginName(address);
        } else {
            setDestLat(tempMarker.latitude);
            setDestLng(tempMarker.longitude);
            setDestName(address);
        }

        // Fecha o modal do mapa e reabre o de criação
        setShowMapModal(false);
        setTempMarker(null);
        setSearchAddress('');
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    const cancelMapSelection = () => {
        setShowMapModal(false);
        setTempMarker(null);
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    // ============ FUNCOES DE DATA/HORA ============
    const [tempDate, setTempDate] = useState(new Date());

    const openDatePicker = () => {
        setTempDate(departureDate);
        setShowCreateModal(false);
        setTimeout(() => {
            setShowDatePicker(true);
        }, 300);
    };

    const openTimePicker = () => {
        setTempDate(departureDate);
        setShowCreateModal(false);
        setTimeout(() => {
            setShowTimePicker(true);
        }, 300);
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                const newDate = new Date(departureDate);
                newDate.setFullYear(selectedDate.getFullYear());
                newDate.setMonth(selectedDate.getMonth());
                newDate.setDate(selectedDate.getDate());
                setDepartureDate(newDate);
            }
            // Reabre o modal de criação no Android
            setTimeout(() => {
                setShowCreateModal(true);
            }, 300);
        } else {
            // No iOS, apenas atualiza o tempDate (modal continua aberto)
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
            if (event.type === 'set' && selectedTime) {
                const newDate = new Date(departureDate);
                newDate.setHours(selectedTime.getHours());
                newDate.setMinutes(selectedTime.getMinutes());
                setDepartureDate(newDate);
            }
            // Reabre o modal de criação no Android
            setTimeout(() => {
                setShowCreateModal(true);
            }, 300);
        } else {
            // No iOS, apenas atualiza o tempDate (modal continua aberto)
            if (selectedTime) {
                setTempDate(selectedTime);
            }
        }
    };

    const confirmDateSelection = () => {
        const newDate = new Date(departureDate);
        newDate.setFullYear(tempDate.getFullYear());
        newDate.setMonth(tempDate.getMonth());
        newDate.setDate(tempDate.getDate());
        setDepartureDate(newDate);
        setShowDatePicker(false);
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    const cancelDatePicker = () => {
        setShowDatePicker(false);
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    const confirmTimeSelection = () => {
        const newDate = new Date(departureDate);
        newDate.setHours(tempDate.getHours());
        newDate.setMinutes(tempDate.getMinutes());
        setDepartureDate(newDate);
        setShowTimePicker(false);
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    const cancelTimePicker = () => {
        setShowTimePicker(false);
        setTimeout(() => {
            setShowCreateModal(true);
        }, 300);
    };

    const resetForm = () => {
        setOriginName('');
        setOriginLat(null);
        setOriginLng(null);
        setDestName('');
        setDestLat(null);
        setDestLng(null);
        setDepartureDate(new Date());
        setNotes('');
        setEditingTrip(null);
        setIsEditing(false);
        setShowValidation(false);
    };

    // ============ EDITAR VIAGEM ============
    const editTrip = (trip: Trip) => {
        setEditingTrip(trip);
        setIsEditing(true);
        setOriginName(trip.originName);
        setOriginLat(trip.originLat);
        setOriginLng(trip.originLng);
        setDestName(trip.destName);
        setDestLat(trip.destLat);
        setDestLng(trip.destLng);
        setDepartureDate(new Date(trip.departureAt));
        setNotes(trip.notes || '');
        setShowCreateModal(true);
    };

    // ============ DELETAR VIAGEM ============
    const deleteTrip = (tripId: string) => {
        Alert.alert(
            'Confirmar exclusao',
            'Tem certeza que deseja excluir este percurso?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/trips/${tripId}`);
                            Alert.alert('Sucesso', 'Percurso excluido!');
                            loadTrips();
                        } catch (error: any) {
                            if (error.response?.status === 401) return;
                            const errorMessage = error.response?.data?.message || 'Nao foi possivel excluir o percurso';
                            Alert.alert('Erro', errorMessage);
                        }
                    },
                },
            ]
        );
    };

    // ============ SALVAR VIAGEM (CRIAR OU EDITAR) ============
    const saveTrip = async () => {
        // Ativa validacao visual
        setShowValidation(true);

        if (!originLat || !originLng || !destLat || !destLng) {
            // Nao mostra alert, apenas destaca os campos com erro
            return;
        }

        setLoading(true);
        try {
            const tripData = {
                originName,
                originLat,
                originLng,
                destName,
                destLat,
                destLng,
                departureAt: departureDate.toISOString(),
                notes: notes || undefined,
            };

            if (isEditing && editingTrip) {
                await api.put(`/trips/${editingTrip.id}`, tripData);
                Alert.alert('Sucesso', 'Percurso atualizado!');
            } else {
                await api.post('/trips', tripData);
                Alert.alert('Sucesso', 'Percurso cadastrado!');
            }

            setShowCreateModal(false);
            resetForm();
            loadTrips();
        } catch (error: any) {
            if (error.response?.status === 401) return;

            let errorMessage = isEditing ? 'Nao foi possivel atualizar o percurso' : 'Nao foi possivel cadastrar o percurso';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                if (error.message.includes('Network Error')) {
                    errorMessage = 'Erro de conexao. Verifique sua internet.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Tempo de conexao esgotado. Tente novamente.';
                }
            }

            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============ FUNCOES AUXILIARES DE STATUS ============
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return '#4facfe';
            case 'ACTIVE': return '#00f260';
            case 'COMPLETED': return '#667eea';
            case 'CANCELLED': return '#ff4444';
            default: return '#999';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'Agendado';
            case 'ACTIVE': return 'Em andamento';
            case 'COMPLETED': return 'Concluido';
            case 'CANCELLED': return 'Cancelado';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Formata duracao em minutos para dias, horas e minutos
    const formatDuration = (totalMinutes: number): string => {
        if (!totalMinutes || totalMinutes <= 0) return '0min';

        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        const parts: string[] = [];

        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);

        return parts.join(' ');
    };

    // ============ RENDER ============
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
                <Text style={styles.headerTitle}>Meus Percursos</Text>
                <Text style={styles.headerSubtitle}>Cadastre suas rotas</Text>
            </LinearGradient>

            {/* Botao Criar */}
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#00f260', '#0575e6']}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.createButtonText}>Novo Percurso</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Lista de Viagens */}
            {loadingTrips ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : trips.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="map-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>Nenhum percurso cadastrado</Text>
                </View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.tripCard}
                            onPress={() => viewTripOnMap(item)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.tripCardHeader}>
                                <Text style={styles.tripDate}>
                                    {formatDate(item.departureAt)} - {formatTime(item.departureAt)}
                                </Text>
                                <View style={styles.tripCardActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => editTrip(item)}
                                    >
                                        <Ionicons name="pencil" size={18} color="#667eea" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => deleteTrip(item.id)}
                                    >
                                        <Ionicons name="trash" size={18} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.routeRow}>
                                <View style={[styles.dot, { backgroundColor: '#00f260' }]} />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {truncateAddress(item.originName)}
                                </Text>
                                <Ionicons name="map-outline" size={16} color="#999" style={{ marginLeft: 8 }} />
                            </View>
                            <View style={styles.routeRow}>
                                <View style={[styles.dot, { backgroundColor: '#ff4444' }]} />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {truncateAddress(item.destName)}
                                </Text>
                            </View>
                            <View style={styles.tripInfo}>
                                <View style={styles.tripInfoItem}>
                                    <Ionicons name="navigate" size={14} color="#666" />
                                    <Text style={styles.tripInfoText}>{item.distanceKm} km</Text>
                                </View>
                                <View style={styles.tripInfoItem}>
                                    <Ionicons name="time" size={14} color="#666" />
                                    <Text style={styles.tripInfoText}>{formatDuration(item.durationMinutes)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* ============ MODAL CRIAR/EDITAR PERCURSO ============ */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                onRequestClose={() => { setShowCreateModal(false); resetForm(); }}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderText}>
                            <Text style={styles.modalTitle}>{isEditing ? 'Editar Percurso' : 'Novo Percurso'}</Text>
                            <Text style={styles.modalSubtitle}>
                                {isEditing
                                    ? 'Atualize as informacoes do seu trajeto'
                                    : 'Cadastre seu trajeto para receber solicitacoes'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => { setShowCreateModal(false); resetForm(); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={32} color="#444" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                        {/* SECAO ROTA - Origem e Destino agrupados */}
                        <View style={styles.routeSection}>
                            <Text style={styles.sectionTitle}>Trajeto</Text>

                            {/* ORIGEM */}
                            <Text style={styles.label}>Ponto de Partida</Text>
                            <TouchableOpacity
                                style={[
                                    styles.miniMapContainer,
                                    showValidation && !originLat && styles.miniMapContainerError,
                                ]}
                                onPress={() => openMapForSelection('origin')}
                                activeOpacity={0.9}
                            >
                                <MapView
                                    style={styles.miniMap}
                                    provider={PROVIDER_GOOGLE}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                    region={{
                                        latitude: originLat || -23.5505,
                                        longitude: originLng || -46.6333,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                >
                                    {originLat && originLng && (
                                        <Marker
                                            coordinate={{ latitude: originLat, longitude: originLng }}
                                        >
                                            <View style={[styles.miniMapMarker, { backgroundColor: '#00f260' }]}>
                                                <Ionicons name="location" size={16} color="#fff" />
                                            </View>
                                        </Marker>
                                    )}
                                </MapView>
                                <View style={[
                                    styles.miniMapOverlay,
                                    showValidation && !originLat && styles.miniMapOverlayError,
                                ]}>
                                    <View style={styles.miniMapInfo}>
                                        <Ionicons name="location" size={20} color={showValidation && !originLat ? '#ef4444' : '#00f260'} />
                                        <Text style={[
                                            styles.miniMapText,
                                            showValidation && !originLat && styles.miniMapTextError,
                                        ]} numberOfLines={1}>
                                            {originName || 'Toque para selecionar origem'}
                                        </Text>
                                    </View>
                                    <View style={styles.miniMapEditBadge}>
                                        <Ionicons name="pencil" size={14} color="#fff" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            {showValidation && !originLat && (
                                <View style={styles.validationError}>
                                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                    <Text style={styles.validationErrorText}>Selecione um ponto de partida no mapa</Text>
                                </View>
                            )}

                            {/* Conexao visual entre origem e destino */}
                            <View style={styles.routeConnector}>
                                <View style={styles.routeConnectorLine} />
                                <Ionicons name="arrow-down" size={16} color="#ccc" />
                                <View style={styles.routeConnectorLine} />
                            </View>

                            {/* DESTINO */}
                            <Text style={styles.label}>Destino</Text>
                            <TouchableOpacity
                                style={[
                                    styles.miniMapContainer,
                                    showValidation && !destLat && styles.miniMapContainerError,
                                ]}
                                onPress={() => openMapForSelection('destination')}
                                activeOpacity={0.9}
                            >
                                <MapView
                                    style={styles.miniMap}
                                    provider={PROVIDER_GOOGLE}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                    region={{
                                        latitude: destLat || -23.5505,
                                        longitude: destLng || -46.6333,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                >
                                    {destLat && destLng && (
                                        <Marker
                                            coordinate={{ latitude: destLat, longitude: destLng }}
                                        >
                                            <View style={[styles.miniMapMarker, { backgroundColor: '#ff4444' }]}>
                                                <Ionicons name="flag" size={16} color="#fff" />
                                            </View>
                                        </Marker>
                                    )}
                                </MapView>
                                <View style={[
                                    styles.miniMapOverlay,
                                    showValidation && !destLat && styles.miniMapOverlayError,
                                ]}>
                                    <View style={styles.miniMapInfo}>
                                        <Ionicons name="flag" size={20} color={showValidation && !destLat ? '#ef4444' : '#ff4444'} />
                                        <Text style={[
                                            styles.miniMapText,
                                            showValidation && !destLat && styles.miniMapTextError,
                                        ]} numberOfLines={1}>
                                            {destName || 'Toque para selecionar destino'}
                                        </Text>
                                    </View>
                                    <View style={[styles.miniMapEditBadge, { backgroundColor: showValidation && !destLat ? '#ef4444' : '#ff4444' }]}>
                                        <Ionicons name="pencil" size={14} color="#fff" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            {showValidation && !destLat && (
                                <View style={styles.validationError}>
                                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                    <Text style={styles.validationErrorText}>Selecione um destino no mapa</Text>
                                </View>
                            )}
                        </View>

                        {/* DATA E HORA - Card Unificado */}
                        <View style={styles.dateTimeCard}>
                            <View style={styles.dateTimeCardHeader}>
                                <View style={styles.dateTimeCardIcon}>
                                    <Ionicons name="calendar" size={20} color="#fff" />
                                </View>
                                <Text style={styles.dateTimeCardTitle}>📅 Data e Hora da Saida</Text>
                            </View>

                            <View style={styles.dateTimeCardContent}>
                                {/* Selecionar Data */}
                                <TouchableOpacity
                                    style={styles.dateTimeSelector}
                                    onPress={openDatePicker}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="calendar-outline" size={22} color="#4facfe" />
                                    <View style={styles.dateTimeSelectorText}>
                                        <Text style={styles.dateTimeSelectorLabel}>Data</Text>
                                        <Text style={styles.dateTimeSelectorValue}>
                                            {departureDate.toLocaleDateString('pt-BR', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                                </TouchableOpacity>

                                <View style={styles.dateTimeDivider} />

                                {/* Selecionar Hora */}
                                <TouchableOpacity
                                    style={styles.dateTimeSelector}
                                    onPress={openTimePicker}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={22} color="#00f260" />
                                    <View style={styles.dateTimeSelectorText}>
                                        <Text style={styles.dateTimeSelectorLabel}>Horario</Text>
                                        <Text style={styles.dateTimeSelectorValue}>
                                            {departureDate.toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                                </TouchableOpacity>
                            </View>

                            {/* Resumo visual */}
                            <View style={styles.dateTimeSummary}>
                                <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                                <Text style={styles.dateTimeSummaryText}>
                                    Partida: {departureDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} as {departureDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>

                        {/* SECAO OBSERVACOES */}
                        <View style={styles.notesSection}>
                            <Text style={styles.sectionTitle}>Informacoes Extras</Text>
                            <Text style={styles.label}>Observacoes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Informacoes adicionais (opcional)"
                                placeholderTextColor="#888"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* BOTAO SALVAR */}
                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                            onPress={saveTrip}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.saveButtonContent}>
                                    <Ionicons
                                        name={isEditing ? "checkmark-circle" : "navigate-circle"}
                                        size={22}
                                        color="#fff"
                                    />
                                    <Text style={styles.saveButtonText}>
                                        {isEditing ? 'Salvar Alteracoes' : 'Cadastrar Percurso'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                </SafeAreaView>
            </Modal>

            {/* ============ MODAL DATE PICKER ============ */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={cancelDatePicker}
            >
                <Pressable
                    style={styles.pickerOverlay}
                    onPress={cancelDatePicker}
                >
                    <Pressable style={styles.pickerContainer} onPress={() => {}}>
                        <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={cancelDatePicker}>
                                <Text style={styles.pickerCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <Text style={styles.pickerTitle}>Selecionar Data</Text>
                            <TouchableOpacity onPress={confirmDateSelection}>
                                <Text style={styles.pickerConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContent}>
                            <View style={styles.pickerIconHeader}>
                                <View style={styles.pickerIconCircle}>
                                    <Ionicons name="calendar" size={32} color="#fff" />
                                </View>
                                <Text style={styles.pickerSelectedText}>
                                    {tempDate.toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>

                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                minimumDate={new Date()}
                                onChange={onDateChange}
                                textColor="#333"
                                style={styles.picker}
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ============ MODAL TIME PICKER ============ */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="fade"
                onRequestClose={cancelTimePicker}
            >
                <Pressable
                    style={styles.pickerOverlay}
                    onPress={cancelTimePicker}
                >
                    <Pressable style={styles.pickerContainer} onPress={() => {}}>
                        <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={cancelTimePicker}>
                                <Text style={styles.pickerCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <Text style={styles.pickerTitle}>Selecionar Hora</Text>
                            <TouchableOpacity onPress={confirmTimeSelection}>
                                <Text style={styles.pickerConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContent}>
                            <View style={[styles.pickerIconHeader, { backgroundColor: '#e6fff0' }]}>
                                <View style={[styles.pickerIconCircle, { backgroundColor: '#00f260' }]}>
                                    <Ionicons name="time" size={32} color="#fff" />
                                </View>
                                <Text style={styles.pickerSelectedText}>
                                    {tempDate.toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>

                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                display="spinner"
                                is24Hour={true}
                                onChange={onTimeChange}
                                textColor="#333"
                                style={styles.picker}
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ============ MODAL MAPA ============ */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                onRequestClose={cancelMapSelection}
            >
                <SafeAreaView style={styles.mapModalContainer}>
                    <View style={styles.mapModalHeader}>
                        <TouchableOpacity onPress={cancelMapSelection}>
                            <Ionicons name="arrow-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.mapModalTitle}>
                            Selecionar {selectingPoint === 'origin' ? 'Origem' : 'Destino'}
                        </Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Campo de busca de endereço */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar endereco..."
                                placeholderTextColor="#999"
                                value={searchAddress}
                                onChangeText={handleAddressChange}
                                onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                            />
                            {searchingAddress && (
                                <ActivityIndicator size="small" color="#667eea" />
                            )}
                            {searchAddress.length > 0 && !searchingAddress && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchAddress('');
                                        setAddressSuggestions([]);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Lista de sugestões */}
                        {showSuggestions && (
                            <View style={styles.suggestionsContainer}>
                                <ScrollView
                                    style={styles.suggestionsList}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled
                                >
                                    {addressSuggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionItem}
                                            onPress={() => selectAddressSuggestion(suggestion)}
                                        >
                                            <Ionicons
                                                name="location"
                                                size={20}
                                                color={selectingPoint === 'origin' ? '#00f260' : '#ff4444'}
                                            />
                                            <Text style={styles.suggestionText} numberOfLines={2}>
                                                {suggestion.display_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View style={styles.mapInstruction}>
                        <Ionicons name="information-circle" size={20} color="#4facfe" />
                        <Text style={styles.mapInstructionText}>
                            Busque um endereco ou toque no mapa
                        </Text>
                    </View>

                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={mapRegion}
                        onPress={handleMapPress}
                        showsUserLocation
                    >
                        {tempMarker && (
                            <Marker
                                coordinate={tempMarker}
                                pinColor={selectingPoint === 'origin' ? '#00f260' : '#ff4444'}
                            />
                        )}
                    </MapView>

                    <View style={styles.mapFooter}>
                        {tempMarker && (
                            <Text style={styles.coordText}>
                                {tempMarker.latitude.toFixed(6)}, {tempMarker.longitude.toFixed(6)}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                !tempMarker && styles.confirmButtonDisabled,
                                reverseGeocodingLoading && styles.confirmButtonDisabled,
                            ]}
                            onPress={confirmMapSelection}
                            disabled={!tempMarker || reverseGeocodingLoading}
                            activeOpacity={0.8}
                        >
                            {reverseGeocodingLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* ============ MODAL VISUALIZAR VIAGEM NO MAPA ============ */}
            <Modal
                visible={showViewTripModal}
                animationType="slide"
                onRequestClose={() => setShowViewTripModal(false)}
            >
                <SafeAreaView style={styles.mapModalContainer}>
                    <View style={styles.mapModalHeader}>
                        <TouchableOpacity onPress={() => setShowViewTripModal(false)}>
                            <Ionicons name="arrow-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.mapModalTitle}>Visualizar Percurso</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {viewingTrip && (
                        <>
                            {/* Informacoes do percurso */}
                            <View style={styles.viewTripInfo}>
                                <View style={styles.viewTripRoute}>
                                    <View style={styles.viewTripPoint}>
                                        <View style={[styles.viewTripDot, { backgroundColor: '#00f260' }]} />
                                        <View style={styles.viewTripTextContainer}>
                                            <Text style={styles.viewTripLabel}>Origem</Text>
                                            <Text style={styles.viewTripAddress} numberOfLines={2}>
                                                {viewingTrip.originName}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.viewTripLine} />
                                    <View style={styles.viewTripPoint}>
                                        <View style={[styles.viewTripDot, { backgroundColor: '#ff4444' }]} />
                                        <View style={styles.viewTripTextContainer}>
                                            <Text style={styles.viewTripLabel}>Destino</Text>
                                            <Text style={styles.viewTripAddress} numberOfLines={2}>
                                                {viewingTrip.destName}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.viewTripStats}>
                                    <View style={styles.viewTripStat}>
                                        <Ionicons name="navigate" size={18} color="#667eea" />
                                        <Text style={styles.viewTripStatValue}>{viewingTrip.distanceKm} km</Text>
                                    </View>
                                    <View style={styles.viewTripStat}>
                                        <Ionicons name="time" size={18} color="#667eea" />
                                        <Text style={styles.viewTripStatValue}>{formatDuration(viewingTrip.durationMinutes)}</Text>
                                    </View>
                                    <View style={styles.viewTripStat}>
                                        <Ionicons name="calendar" size={18} color="#667eea" />
                                        <Text style={styles.viewTripStatValue}>
                                            {formatDate(viewingTrip.departureAt)} {formatTime(viewingTrip.departureAt)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.mapContainer}>
                                {loadingRoute && (
                                    <View style={styles.loadingRouteOverlay}>
                                        <ActivityIndicator size="large" color="#4facfe" />
                                        <Text style={styles.loadingRouteText}>Carregando rota...</Text>
                                    </View>
                                )}
                                <MapView
                                    ref={viewMapRef}
                                    style={styles.map}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={{
                                        latitude: (viewingTrip.originLat + viewingTrip.destLat) / 2,
                                        longitude: (viewingTrip.originLng + viewingTrip.destLng) / 2,
                                        latitudeDelta: Math.abs(viewingTrip.originLat - viewingTrip.destLat) * 1.5 + 0.05,
                                        longitudeDelta: Math.abs(viewingTrip.originLng - viewingTrip.destLng) * 1.5 + 0.05,
                                    }}
                                >
                                    {/* Sombra da rota (para destaque) */}
                                    <Polyline
                                        coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                            { latitude: viewingTrip.originLat, longitude: viewingTrip.originLng },
                                            { latitude: viewingTrip.destLat, longitude: viewingTrip.destLng },
                                        ]}
                                        strokeColor="rgba(0,0,0,0.25)"
                                        strokeWidth={8}
                                    />

                                    {/* Tracado da rota principal - segue as ruas */}
                                    <Polyline
                                        coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                            { latitude: viewingTrip.originLat, longitude: viewingTrip.originLng },
                                            { latitude: viewingTrip.destLat, longitude: viewingTrip.destLng },
                                        ]}
                                        strokeColor="#4facfe"
                                        strokeWidth={5}
                                    />

                                    {/* Marcador de Origem */}
                                    <Marker
                                        coordinate={{
                                            latitude: viewingTrip.originLat,
                                            longitude: viewingTrip.originLng,
                                        }}
                                        title="Origem"
                                        description={viewingTrip.originName}
                                    >
                                        <View style={styles.customMarker}>
                                            <View style={[styles.markerDot, { backgroundColor: '#00f260' }]}>
                                                <View style={styles.markerInner} />
                                            </View>
                                        </View>
                                    </Marker>

                                    {/* Marcador de Destino */}
                                    <Marker
                                        coordinate={{
                                            latitude: viewingTrip.destLat,
                                            longitude: viewingTrip.destLng,
                                        }}
                                        title="Destino"
                                        description={viewingTrip.destName}
                                    >
                                        <View style={styles.customMarker}>
                                            <View style={[styles.markerDot, { backgroundColor: '#ff4444' }]}>
                                                <View style={styles.markerInner} />
                                            </View>
                                        </View>
                                    </Marker>
                                </MapView>
                            </View>
                        </>
                    )}

                    <View style={styles.mapFooter}>
                        <TouchableOpacity
                            style={styles.closeViewButton}
                            onPress={() => setShowViewTripModal(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.closeViewButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    createButton: {
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 10,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 15,
    },
    listContent: {
        padding: 20,
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tripDate: {
        fontSize: 14,
        color: '#666',
    },
    tripCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tripCardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    tripInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 15,
    },
    tripInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tripInfoText: {
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    statusText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    routeText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    // Modal Criar
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalHeaderText: {
        flex: 1,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -8,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    routeSection: {
        marginBottom: 24,
    },
    routeConnector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
        gap: 8,
    },
    routeConnectorLine: {
        width: 30,
        height: 1,
        backgroundColor: '#ddd',
    },
    notesSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectButtonText: {
        flex: 1,
        fontSize: 15,
        color: '#666',
        marginLeft: 12,
    },
    miniMapContainer: {
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        position: 'relative',
    },
    miniMap: {
        flex: 1,
        width: '100%',
    },
    miniMapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    miniMapInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    miniMapText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    miniMapMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    miniMapEditBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniMapContainerError: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    miniMapOverlayError: {
        backgroundColor: '#fef2f2',
        borderTopColor: '#fecaca',
    },
    miniMapTextError: {
        color: '#ef4444',
    },
    validationError: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
        gap: 4,
    },
    validationErrorText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '500',
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    dateTimeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 10,
    },
    dateTimeCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateTimeCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    dateTimeCardContent: {
        paddingHorizontal: 16,
    },
    dateTimeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    dateTimeSelectorText: {
        flex: 1,
    },
    dateTimeSelectorLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    dateTimeSelectorValue: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        textTransform: 'capitalize',
    },
    dateTimeDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    dateTimeSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        gap: 8,
    },
    dateTimeSummaryText: {
        fontSize: 13,
        color: '#16a34a',
        fontWeight: '500',
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    dateTimeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateTimeContent: {
        flex: 1,
    },
    dateTimeLabel: {
        fontSize: 11,
        color: '#999',
        marginBottom: 2,
    },
    dateTimeValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#bbb',
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 50,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    // Modal Mapa
    mapModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mapModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        padding: 12,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingVertical: 0,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 62,
        left: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 20,
    },
    suggestionsList: {
        padding: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    mapInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4fe',
        padding: 12,
        gap: 8,
    },
    mapInstructionText: {
        fontSize: 14,
        color: '#333',
    },
    map: {
        flex: 1,
    },
    mapFooter: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    coordText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    confirmButton: {
        backgroundColor: '#00f260',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Picker Modal Styles
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    pickerCancelText: {
        fontSize: 16,
        color: '#999',
    },
    pickerConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
    pickerContent: {
        padding: 20,
    },
    pickerIconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        gap: 15,
    },
    pickerIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerSelectedText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textTransform: 'capitalize',
    },
    picker: {
        height: 180,
    },
    // View Trip Modal Styles
    viewTripInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    viewTripRoute: {
        marginBottom: 16,
    },
    viewTripPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    viewTripDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 12,
        marginTop: 4,
    },
    viewTripTextContainer: {
        flex: 1,
    },
    viewTripLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    viewTripAddress: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    viewTripLine: {
        width: 2,
        height: 20,
        backgroundColor: '#ddd',
        marginLeft: 6,
        marginVertical: -4,
    },
    viewTripStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    viewTripStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    viewTripStatValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    closeViewButton: {
        backgroundColor: '#667eea',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeViewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Map container and route styles
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    loadingRouteOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingRouteText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '600',
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});
