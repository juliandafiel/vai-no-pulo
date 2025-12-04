import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationData {
    address: string;
    lat: number;
    lng: number;
}

interface AddressSuggestion {
    description: string;
    lat?: number;
    lng?: number;
}

export default function CreateTripScreen() {
    const [origin, setOrigin] = useState<LocationData | null>(null);
    const [destination, setDestination] = useState<LocationData | null>(null);
    const [originInput, setOriginInput] = useState('');
    const [destinationInput, setDestinationInput] = useState('');
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectingOrigin, setSelectingOrigin] = useState(false);
    const [selectingDestination, setSelectingDestination] = useState(false);
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

    // New fields
    const [departureDate, setDepartureDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [capacity, setCapacity] = useState('');

    const mapRef = useRef<MapView>(null);
    const navigation = useNavigation();

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (origin && destination) {
            calculateRoute();
        } else {
            setRouteCoordinates([]);
            setDistance(null);
            setEstimatedTime(null);
        }
    }, [origin, destination]);

    async function getCurrentLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de acesso à localização');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            console.error('Erro ao obter localização:', error);
        }
    }

    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    async function calculateRoute() {
        if (!origin || !destination) return;

        const dist = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
        setDistance(dist);

        // Estimate time (assuming average speed of 60 km/h)
        const time = (dist / 60) * 60; // in minutes
        setEstimatedTime(time);

        // Busca rota real usando OSRM (Open Source Routing Machine)
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Converte coordenadas do OSRM para formato do React Native Maps
                const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                setRouteCoordinates(coordinates);

                // Atualiza distancia e tempo com valores reais
                if (data.routes[0].distance) {
                    setDistance(data.routes[0].distance / 1000); // metros para km
                }
                if (data.routes[0].duration) {
                    setEstimatedTime(data.routes[0].duration / 60); // segundos para minutos
                }

                // Fit map to show route
                mapRef.current?.fitToCoordinates(coordinates, {
                    edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            } else {
                // Fallback: linha reta
                const route = [
                    { latitude: origin.lat, longitude: origin.lng },
                    { latitude: destination.lat, longitude: destination.lng },
                ];
                setRouteCoordinates(route);
                mapRef.current?.fitToCoordinates(route, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        } catch (error) {
            console.log('Erro ao buscar rota OSRM:', error);
            // Fallback: linha reta
            const route = [
                { latitude: origin.lat, longitude: origin.lng },
                { latitude: destination.lat, longitude: destination.lng },
            ];
            setRouteCoordinates(route);
            mapRef.current?.fitToCoordinates(route, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }

    async function searchByCEP(cep: string, isOrigin: boolean) {
        const cleanCEP = cep.replace(/\D/g, '');
        if (cleanCEP.length !== 8) return;

        setLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const data = await response.json();

            if (data.erro) {
                Alert.alert('Erro', 'CEP não encontrado');
                return;
            }

            const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            const geocodeResponse = await Location.geocodeAsync(fullAddress);

            if (geocodeResponse.length > 0) {
                const { latitude, longitude } = geocodeResponse[0];
                const locationData = {
                    address: fullAddress,
                    lat: latitude,
                    lng: longitude,
                };

                if (isOrigin) {
                    setOrigin(locationData);
                    setOriginInput(fullAddress);
                    setShowOriginSuggestions(false);
                } else {
                    setDestination(locationData);
                    setDestinationInput(fullAddress);
                    setShowDestinationSuggestions(false);
                }

                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível buscar o CEP');
        } finally {
            setLoading(false);
        }
    }

    async function searchAddress(text: string, isOrigin: boolean) {
        if (text.length < 3) {
            if (isOrigin) setOriginSuggestions([]);
            else setDestinationSuggestions([]);
            return;
        }

        try {
            const results = await Location.geocodeAsync(text);
            const suggestions: AddressSuggestion[] = results.slice(0, 5).map((result, index) => ({
                description: `${text} - Resultado ${index + 1}`,
                lat: result.latitude,
                lng: result.longitude,
            }));

            if (isOrigin) {
                setOriginSuggestions(suggestions);
            } else {
                setDestinationSuggestions(suggestions);
            }
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
        }
    }

    function handleMapPress(event: any) {
        const { latitude, longitude } = event.nativeEvent.coordinate;

        if (selectingOrigin) {
            Location.reverseGeocodeAsync({ latitude, longitude })
                .then((results) => {
                    if (results.length > 0) {
                        const result = results[0];
                        const address = `${result.street || ''}, ${result.name || ''}, ${result.city || ''} - ${result.region || ''}`;
                        setOrigin({ address, lat: latitude, lng: longitude });
                        setOriginInput(address);
                    }
                })
                .catch(() => {
                    setOrigin({ address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
                    setOriginInput(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                });
            setSelectingOrigin(false);
        } else if (selectingDestination) {
            Location.reverseGeocodeAsync({ latitude, longitude })
                .then((results) => {
                    if (results.length > 0) {
                        const result = results[0];
                        const address = `${result.street || ''}, ${result.name || ''}, ${result.city || ''} - ${result.region || ''}`;
                        setDestination({ address, lat: latitude, lng: longitude });
                        setDestinationInput(address);
                    }
                })
                .catch(() => {
                    setDestination({ address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
                    setDestinationInput(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                });
            setSelectingDestination(false);
        }
    }

    function selectSuggestion(suggestion: AddressSuggestion, isOrigin: boolean) {
        if (suggestion.lat && suggestion.lng) {
            const locationData = {
                address: suggestion.description,
                lat: suggestion.lat,
                lng: suggestion.lng,
            };

            if (isOrigin) {
                setOrigin(locationData);
                setOriginInput(suggestion.description);
                setShowOriginSuggestions(false);
                setOriginSuggestions([]);
            } else {
                setDestination(locationData);
                setDestinationInput(suggestion.description);
                setShowDestinationSuggestions(false);
                setDestinationSuggestions([]);
            }

            mapRef.current?.animateToRegion({
                latitude: suggestion.lat,
                longitude: suggestion.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
        Keyboard.dismiss();
    }

    async function handleCreateTrip() {
        if (!origin || !destination) {
            Alert.alert('Atenção', 'Preencha origem e destino');
            return;
        }

        if (!capacity || parseFloat(capacity) <= 0) {
            Alert.alert('Atenção', 'Informe a capacidade de carga');
            return;
        }

        try {
            const tripData = {
                originName: origin.address,
                originLat: origin.lat,
                originLng: origin.lng,
                destName: destination.address,
                destLat: destination.lat,
                destLng: destination.lng,
                departureAt: departureDate.toISOString(),
                capacity: parseFloat(capacity),
                distance: distance,
                estimatedTime: estimatedTime,
            };

            await api.post('/trips', tripData);
            Alert.alert('Sucesso', 'Trajeto criado com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível criar o trajeto.');
        }
    }

    const handleOriginInputChange = (text: string) => {
        setOriginInput(text);
        setShowOriginSuggestions(true);

        const cleanText = text.replace(/\D/g, '');
        if (cleanText.length === 8 && text.match(/^\d{5}-?\d{3}$/)) {
            searchByCEP(text, true);
        } else {
            searchAddress(text, true);
        }
    };

    const handleDestinationInputChange = (text: string) => {
        setDestinationInput(text);
        setShowDestinationSuggestions(true);

        const cleanText = text.replace(/\D/g, '');
        if (cleanText.length === 8 && text.match(/^\d{5}-?\d{3}$/)) {
            searchByCEP(text, false);
        } else {
            searchAddress(text, false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDepartureDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(departureDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setDepartureDate(newDate);
        }
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapContainer}>
                {currentLocation ? (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        onPress={handleMapPress}
                    >
                        {origin && (
                            <Marker
                                coordinate={{ latitude: origin.lat, longitude: origin.lng }}
                                title="Origem"
                                pinColor="#4facfe"
                            />
                        )}
                        {destination && (
                            <Marker
                                coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                                title="Destino"
                                pinColor="#f093fb"
                            />
                        )}
                        {/* Linha de sombra */}
                        {origin && destination && (
                            <Polyline
                                coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                    { latitude: origin.lat, longitude: origin.lng },
                                    { latitude: destination.lat, longitude: destination.lng },
                                ]}
                                strokeColor="rgba(0,0,0,0.2)"
                                strokeWidth={7}
                            />
                        )}
                        {/* Linha principal da rota */}
                        {origin && destination && (
                            <Polyline
                                coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                    { latitude: origin.lat, longitude: origin.lng },
                                    { latitude: destination.lat, longitude: destination.lng },
                                ]}
                                strokeColor="#4facfe"
                                strokeWidth={4}
                            />
                        )}
                    </MapView>
                ) : (
                    <View style={styles.loadingMap}>
                        <ActivityIndicator size="large" color="#4facfe" />
                        <Text style={styles.loadingText}>Carregando mapa...</Text>
                    </View>
                )}

                {distance && estimatedTime && (
                    <View style={styles.routeInfo}>
                        <View style={styles.routeInfoItem}>
                            <Ionicons name="navigate" size={20} color="#4facfe" />
                            <Text style={styles.routeInfoText}>{distance.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.routeInfoItem}>
                            <Ionicons name="time" size={20} color="#4facfe" />
                            <Text style={styles.routeInfoText}>{Math.round(estimatedTime)} min</Text>
                        </View>
                    </View>
                )}

                {(selectingOrigin || selectingDestination) && (
                    <View style={styles.mapOverlay}>
                        <View style={styles.mapInstructions}>
                            <Ionicons name="hand-left" size={24} color="#fff" />
                            <Text style={styles.mapInstructionsText}>
                                Toque no mapa para selecionar {selectingOrigin ? 'a origem' : 'o destino'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.cancelMapButton}
                            onPress={() => {
                                setSelectingOrigin(false);
                                setSelectingDestination(false);
                            }}
                        >
                            <Text style={styles.cancelMapButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Trajeto</Text>
                <Text style={styles.subtitle}>Preencha todos os detalhes da viagem</Text>

                {/* Origin Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Origem</Text>
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Endereço ou CEP (ex: 01310-100)"
                                value={originInput}
                                onChangeText={handleOriginInputChange}
                                onFocus={() => setShowOriginSuggestions(true)}
                            />
                            {loading && <ActivityIndicator size="small" color="#4facfe" />}
                        </View>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => {
                                setSelectingOrigin(true);
                                setSelectingDestination(false);
                                Keyboard.dismiss();
                            }}
                        >
                            <Ionicons name="map" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {showOriginSuggestions && originSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {originSuggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => selectSuggestion(item, true)}
                                >
                                    <Ionicons name="location" size={16} color="#666" />
                                    <Text style={styles.suggestionText}>{item.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {origin && (
                        <View style={styles.selectedLocation}>
                            <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                            <Text style={styles.selectedLocationText} numberOfLines={1}>
                                {origin.address}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Destination Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Destino</Text>
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="flag-outline" size={20} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Endereço ou CEP (ex: 20040-020)"
                                value={destinationInput}
                                onChangeText={handleDestinationInputChange}
                                onFocus={() => setShowDestinationSuggestions(true)}
                            />
                            {loading && <ActivityIndicator size="small" color="#4facfe" />}
                        </View>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => {
                                setSelectingDestination(true);
                                setSelectingOrigin(false);
                                Keyboard.dismiss();
                            }}
                        >
                            <Ionicons name="map" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {destinationSuggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => selectSuggestion(item, false)}
                                >
                                    <Ionicons name="location" size={16} color="#666" />
                                    <Text style={styles.suggestionText}>{item.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {destination && (
                        <View style={styles.selectedLocation}>
                            <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                            <Text style={styles.selectedLocationText} numberOfLines={1}>
                                {destination.address}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Date and Time */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Data e Hora da Partida</Text>
                    <View style={styles.dateTimeContainer}>
                        <TouchableOpacity
                            style={styles.dateTimeButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <Text style={styles.dateTimeText}>{formatDateTime(departureDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={departureDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={departureDate}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}

                {/* Capacity */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Capacidade de Carga (kg)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="barbell-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Informe a capacidade em kg"
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>kg</Text>
                    </View>
                    <Text style={styles.inputHint}>
                        O valor do frete sera calculado automaticamente com base na distancia e peso da mercadoria
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, (!origin || !destination || !capacity) && styles.buttonDisabled]}
                    onPress={handleCreateTrip}
                    disabled={!origin || !destination || !capacity}
                >
                    <Text style={styles.buttonText}>Criar Trajeto</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </TouchableOpacity>

                <Text style={styles.helpText}>
                    Preencha todos os campos para criar seu trajeto e começar a transportar mercadorias
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mapContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    loadingMap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e1e1e1',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    routeInfo: {
        position: 'absolute',
        top: 15,
        left: 15,
        right: 15,
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 20,
    },
    routeInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mapInstructions: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
    },
    mapInstructionsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    cancelMapButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    cancelMapButtonText: {
        color: '#4facfe',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    mapButton: {
        backgroundColor: '#4facfe',
        width: 55,
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    selectedLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f8f5',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    selectedLocationText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#00f260',
        fontWeight: '600',
        flex: 1,
    },
    vehicleTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    vehicleTypeButton: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    vehicleTypeButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    vehicleTypeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
    },
    vehicleTypeLabelActive: {
        color: '#fff',
    },
    vehicleTypeCapacity: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    vehicleTypeCapacityActive: {
        color: 'rgba(255,255,255,0.9)',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        gap: 10,
    },
    dateTimeText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    rowContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    halfWidth: {
        flex: 1,
    },
    photoButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    vehicleImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    photoPlaceholder: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#999',
    },
    button: {
        backgroundColor: '#4facfe',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonIcon: {
        marginLeft: 10,
    },
    helpText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 20,
    },
    inputSuffix: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    inputHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        fontStyle: 'italic',
    },
});
