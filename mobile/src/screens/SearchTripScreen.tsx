/**
 * SearchTripScreen - Tela de busca de viagens
 *
 * Usa o mesmo estilo da tela de criar percurso com mini mapas
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from '../components/MapView';
import * as Location from 'expo-location';
import api from '../services/api';
import theme from '../theme';

interface AddressData {
    name: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
}

type SelectingPoint = 'origin' | 'destination' | null;

export default function SearchTripScreen() {
    const navigation = useNavigation<any>();

    // Estados do formulário
    const [origin, setOrigin] = useState<AddressData | null>(null);
    const [destination, setDestination] = useState<AddressData | null>(null);
    const [date, setDate] = useState(new Date());

    // Estados do modal de mapa
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectingPoint, setSelectingPoint] = useState<SelectingPoint>(null);
    const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [searchAddress, setSearchAddress] = useState('');
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);

    // Estados do date picker
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    // Estado do mapa
    const [mapRegion, setMapRegion] = useState({
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const mapRef = useRef<MapView>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Validação
    const canSearch = useMemo(() => {
        return origin !== null && destination !== null;
    }, [origin, destination]);

    // ============ FUNÇÕES DO MAPA ============
    const openMapForSelection = async (type: 'origin' | 'destination') => {
        setSelectingPoint(type);
        setTempMarker(null);
        setSearchAddress('');
        setAddressSuggestions([]);
        setShowSuggestions(false);

        // Tenta obter localização atual
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
            console.log('Erro ao obter localização:', error);
        }

        setShowMapModal(true);
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

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
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

        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 500);
    };

    // Geocodificação reversa
    const reverseGeocode = async (lat: number, lng: number): Promise<{ name: string; city: string; state: string }> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Language': 'pt-BR,pt;q=0.9',
                        'User-Agent': 'VaiNoPuloApp/1.0 (https://vainopulo.com.br)',
                    },
                }
            );

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', state: '' };
            }

            const data = await response.json();

            if (data && data.address) {
                const { road, neighbourhood, suburb, city, town, village, state } = data.address;
                const street = road || '';
                const area = neighbourhood || suburb || '';
                const cityName = city || town || village || '';

                const parts = [street, area, cityName].filter(Boolean);
                return {
                    name: parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    city: cityName,
                    state: state || '',
                };
            }

            return { name: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', state: '' };
        } catch (error) {
            console.log('Erro na geocodificação reversa:', error);
            return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', state: '' };
        }
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setTempMarker({ latitude, longitude });
    };

    const confirmMapSelection = async () => {
        if (!tempMarker) {
            Alert.alert('Atenção', 'Toque no mapa para selecionar um ponto');
            return;
        }

        setReverseGeocodingLoading(true);

        const geoResult = await reverseGeocode(tempMarker.latitude, tempMarker.longitude);

        setReverseGeocodingLoading(false);

        const addressData: AddressData = {
            name: geoResult.name,
            latitude: tempMarker.latitude,
            longitude: tempMarker.longitude,
            city: geoResult.city,
            state: geoResult.state,
        };

        if (selectingPoint === 'origin') {
            setOrigin(addressData);
        } else {
            setDestination(addressData);
        }

        setShowMapModal(false);
        setTempMarker(null);
        setSearchAddress('');
    };

    const cancelMapSelection = () => {
        setShowMapModal(false);
        setTempMarker(null);
        setSearchAddress('');
    };

    // ============ FUNÇÕES DE DATA ============
    const openDatePicker = () => {
        setTempDate(date);
        setShowDatePicker(true);
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                setDate(selectedDate);
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const confirmDateSelection = () => {
        setDate(tempDate);
        setShowDatePicker(false);
    };

    const cancelDatePicker = () => {
        setShowDatePicker(false);
    };

    const formatDate = useCallback((d: Date): string => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Hoje';
        }
        if (d.toDateString() === tomorrow.toDateString()) {
            return 'Amanhã';
        }

        return d.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
        });
    }, []);

    // ============ CONTINUAR PARA REGISTRO DE MERCADORIA ============
    const handleContinue = useCallback(() => {
        if (!origin || !destination) {
            Alert.alert('Atenção', 'Preencha origem e destino');
            return;
        }

        if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
            Alert.alert('Atenção', 'A data deve ser hoje ou futura');
            return;
        }

        // Navega direto para o registro de mercadoria
        // O pedido será enviado para todos os motoristas com rota compatível
        navigation.navigate('RegisterMerchandise', {
            trip: null, // Sem motorista específico - pedido avulso
            searchParams: {
                origin: origin.name,
                originCity: origin.city,
                originState: origin.state,
                originLat: origin.latitude,
                originLng: origin.longitude,
                destination: destination.name,
                destinationCity: destination.city,
                destinationState: destination.state,
                destLat: destination.latitude,
                destLng: destination.longitude,
                date: date.toISOString(),
            },
        });
    }, [origin, destination, date, navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Enviar Mercadoria</Text>
                    <Text style={styles.subtitle}>
                        Encontre motoristas no seu trajeto
                    </Text>
                </View>

                {/* Seção Trajeto */}
                <View style={styles.routeSection}>
                    <Text style={styles.sectionTitle}>Trajeto</Text>

                    {/* ORIGEM */}
                    <Text style={styles.label}>De onde sai?</Text>
                    <TouchableOpacity
                        style={styles.miniMapContainer}
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
                                latitude: origin?.latitude || -23.5505,
                                longitude: origin?.longitude || -46.6333,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                        >
                            {origin && (
                                <Marker coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}>
                                    <View style={[styles.miniMapMarker, { backgroundColor: '#00f260' }]}>
                                        <Ionicons name="location" size={16} color="#fff" />
                                    </View>
                                </Marker>
                            )}
                        </MapView>
                        <View style={styles.miniMapOverlay}>
                            <View style={styles.miniMapInfo}>
                                <Ionicons name="location" size={20} color="#00f260" />
                                <Text style={styles.miniMapText} numberOfLines={1}>
                                    {origin?.name || 'Toque para selecionar origem'}
                                </Text>
                            </View>
                            <View style={[styles.miniMapEditBadge, { backgroundColor: '#00f260' }]}>
                                <Ionicons name="pencil" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Conexão visual */}
                    <View style={styles.routeConnector}>
                        <View style={styles.routeConnectorLine} />
                        <Ionicons name="arrow-down" size={16} color="#ccc" />
                        <View style={styles.routeConnectorLine} />
                    </View>

                    {/* DESTINO */}
                    <Text style={styles.label}>Para onde vai?</Text>
                    <TouchableOpacity
                        style={styles.miniMapContainer}
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
                                latitude: destination?.latitude || -23.5505,
                                longitude: destination?.longitude || -46.6333,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                        >
                            {destination && (
                                <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}>
                                    <View style={[styles.miniMapMarker, { backgroundColor: '#ff4444' }]}>
                                        <Ionicons name="flag" size={16} color="#fff" />
                                    </View>
                                </Marker>
                            )}
                        </MapView>
                        <View style={styles.miniMapOverlay}>
                            <View style={styles.miniMapInfo}>
                                <Ionicons name="flag" size={20} color="#ff4444" />
                                <Text style={styles.miniMapText} numberOfLines={1}>
                                    {destination?.name || 'Toque para selecionar destino'}
                                </Text>
                            </View>
                            <View style={[styles.miniMapEditBadge, { backgroundColor: '#ff4444' }]}>
                                <Ionicons name="pencil" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Data */}
                <View style={styles.dateSection}>
                    <Text style={styles.sectionTitle}>Quando?</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={openDatePicker}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dateIconContainer}>
                            <Ionicons name="calendar" size={20} color="#4facfe" />
                        </View>
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Resumo */}
                {origin && destination && (
                    <View style={styles.summaryCard}>
                        <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                        <Text style={styles.summaryText}>
                            {origin.city || 'Origem'} → {destination.city || 'Destino'}
                        </Text>
                    </View>
                )}

                {/* Botão de continuar */}
                <TouchableOpacity
                    style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!canSearch}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-forward" size={22} color="#fff" />
                    <Text style={styles.searchButtonText}>Continuar</Text>
                </TouchableOpacity>
            </ScrollView>

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

                    {/* Campo de busca */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar endereço..."
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

                        {/* Sugestões */}
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
                            Busque um endereço ou toque no mapa
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

            {/* ============ MODAL DATE PICKER (iOS) ============ */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={cancelDatePicker}
                >
                    <Pressable style={styles.pickerOverlay} onPress={cancelDatePicker}>
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
            )}

            {/* Android DatePicker */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={onDateChange}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        marginTop: 8,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateSection: {
        marginBottom: 24,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e8f4fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textTransform: 'capitalize',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 8,
    },
    summaryText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
    },
    searchButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    searchButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
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
    // Picker Modal
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
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
    picker: {
        height: 180,
    },
});
