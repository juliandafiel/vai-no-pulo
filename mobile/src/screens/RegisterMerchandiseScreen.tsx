import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    Image,
    ActivityIndicator,
    Switch,
    Modal,
    Dimensions,
    FlatList,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getFullImageUrl } from '../services/api';

const LAST_ROUTE_KEY = '@last_route';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InsuranceOption {
    id: string;
    name: string;
    description: string;
    percentageRate: number;
    minValue: number;
    maxCoverage: number;
}

// Estrutura hierarquica de categorias
const CATEGORIES = {
    electronics: {
        id: 'electronics',
        label: 'Eletronicos',
        icon: 'phone-portrait-outline',
        subcategories: {
            tv: {
                id: 'tv',
                label: 'TV / Monitor',
                icon: 'tv-outline',
                brands: ['Samsung', 'LG', 'Sony', 'Philips', 'TCL', 'AOC', 'Philco', 'Outra'],
            },
            audio: {
                id: 'audio',
                label: 'Som / Audio',
                icon: 'musical-notes-outline',
                brands: ['JBL', 'Sony', 'Bose', 'Harman Kardon', 'LG', 'Samsung', 'Philips', 'Outra'],
            },
            videogame: {
                id: 'videogame',
                label: 'Video Game',
                icon: 'game-controller-outline',
                brands: ['PlayStation', 'Xbox', 'Nintendo', 'PC Gamer', 'Outra'],
            },
            computer: {
                id: 'computer',
                label: 'Computador / Notebook',
                icon: 'laptop-outline',
                brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Samsung', 'Positivo', 'Outra'],
            },
            smartphone: {
                id: 'smartphone',
                label: 'Celular / Tablet',
                icon: 'phone-portrait-outline',
                brands: ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'LG', 'Asus', 'Outra'],
            },
            appliances: {
                id: 'appliances',
                label: 'Eletrodomesticos',
                icon: 'home-outline',
                brands: ['Electrolux', 'Brastemp', 'Consul', 'LG', 'Samsung', 'Philips', 'Arno', 'Mondial', 'Outra'],
            },
            other_electronics: {
                id: 'other_electronics',
                label: 'Outros Eletronicos',
                icon: 'hardware-chip-outline',
                brands: [],
            },
        },
    },
    clothes: {
        id: 'clothes',
        label: 'Roupas e Calcados',
        icon: 'shirt-outline',
        subcategories: {
            casual: { id: 'casual', label: 'Roupas Casuais', icon: 'shirt-outline' },
            formal: { id: 'formal', label: 'Roupas Formais', icon: 'business-outline' },
            shoes: { id: 'shoes', label: 'Calcados', icon: 'footsteps-outline' },
            accessories: { id: 'accessories', label: 'Acessorios', icon: 'watch-outline' },
        },
    },
    home: {
        id: 'home',
        label: 'Cama, Mesa e Banho',
        icon: 'bed-outline',
        subcategories: {
            bedding: { id: 'bedding', label: 'Roupa de Cama', icon: 'bed-outline' },
            towels: { id: 'towels', label: 'Toalhas', icon: 'water-outline' },
            table: { id: 'table', label: 'Mesa e Cozinha', icon: 'restaurant-outline' },
            decoration: { id: 'decoration', label: 'Decoracao', icon: 'flower-outline' },
        },
    },
    food: {
        id: 'food',
        label: 'Alimentos',
        icon: 'fast-food-outline',
        subcategories: {
            perishable: { id: 'perishable', label: 'Pereciveis', icon: 'nutrition-outline', requiresRefrigeration: true },
            non_perishable: { id: 'non_perishable', label: 'Nao Pereciveis', icon: 'cube-outline' },
            beverages: { id: 'beverages', label: 'Bebidas', icon: 'beer-outline' },
            frozen: { id: 'frozen', label: 'Congelados', icon: 'snow-outline', requiresRefrigeration: true },
        },
    },
    furniture: {
        id: 'furniture',
        label: 'Moveis',
        icon: 'home-outline',
        subcategories: {
            sofa: { id: 'sofa', label: 'Sofa / Poltrona', icon: 'bed-outline', noBox: true },
            table_furniture: { id: 'table_furniture', label: 'Mesa / Cadeira', icon: 'grid-outline' },
            wardrobe: { id: 'wardrobe', label: 'Armario / Guarda-roupa', icon: 'filing-outline', noBox: true },
            bed: { id: 'bed', label: 'Cama / Colchao', icon: 'bed-outline', noBox: true },
            office: { id: 'office', label: 'Moveis de Escritorio', icon: 'desktop-outline' },
        },
    },
    documents: {
        id: 'documents',
        label: 'Documentos',
        icon: 'document-text-outline',
        subcategories: {
            personal: { id: 'personal', label: 'Documentos Pessoais', icon: 'person-outline' },
            business: { id: 'business', label: 'Documentos Empresariais', icon: 'business-outline' },
            books: { id: 'books', label: 'Livros / Revistas', icon: 'book-outline' },
        },
    },
    other: {
        id: 'other',
        label: 'Outros',
        icon: 'cube-outline',
        subcategories: {
            sports: { id: 'sports', label: 'Esportes', icon: 'football-outline' },
            toys: { id: 'toys', label: 'Brinquedos', icon: 'happy-outline' },
            tools: { id: 'tools', label: 'Ferramentas', icon: 'construct-outline' },
            misc: { id: 'misc', label: 'Diversos', icon: 'cube-outline' },
        },
    },
};

interface PhotoRequirement {
    id: string;
    label: string;
    description: string;
    required: boolean;
    uri?: string;
}

// Interface para objetos salvos
interface SavedObject {
    id: string;
    name: string;
    description?: string;
    category: string;
    subcategory: string;
    brand?: string;
    declaredValue?: number;
    isFragile: boolean;
    requiresRefrigeration: boolean;
    requiresBox: boolean;
    requiresSpecialCare?: boolean;
    photos: string[];
    weight?: number;
    height?: number;
    width?: number;
    depth?: number;
}

export default function RegisterMerchandiseScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { trip, searchParams } = route.params || {};

    // Estados principais
    const [loading, setLoading] = useState(false);
    const [loadingInsurance, setLoadingInsurance] = useState(true);
    const [insuranceOptions, setInsuranceOptions] = useState<InsuranceOption[]>([]);
    const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
    const [wantsInsurance, setWantsInsurance] = useState(false);
    const [currentStep, setCurrentStep] = useState(1); // 1: Rota, 2: Mercadoria, 3: Fotos, 4: Resumo

    // Estados de localizacao - usa os dados do searchParams (origem/destino do CLIENTE)
    const [originLat, setOriginLat] = useState<number | null>(null);
    const [originLng, setOriginLng] = useState<number | null>(null);
    const [originName, setOriginName] = useState('');
    const [destLat, setDestLat] = useState<number | null>(null);
    const [destLng, setDestLng] = useState<number | null>(null);
    const [destName, setDestName] = useState('');
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectingPoint, setSelectingPoint] = useState<'origin' | 'destination' | null>(null);
    const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Estados da mercadoria
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);

    const [merchandiseName, setMerchandiseName] = useState('');
    const [merchandiseDescription, setMerchandiseDescription] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [declaredValue, setDeclaredValue] = useState('');
    const [isFragile, setIsFragile] = useState(false);
    const [requiresRefrigeration, setRequiresRefrigeration] = useState(false);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [requiresBox, setRequiresBox] = useState(true);

    // Estados de fotos
    const [photos, setPhotos] = useState<PhotoRequirement[]>([]);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [showVideoDimensionModal, setShowVideoDimensionModal] = useState(false);
    const [estimatedDimensions, setEstimatedDimensions] = useState<{ h: number; w: number; l: number } | null>(null);

    // Estados para objetos salvos (seleção múltipla)
    const [savedObjects, setSavedObjects] = useState<SavedObject[]>([]);
    const [loadingSavedObjects, setLoadingSavedObjects] = useState(false);
    const [showSavedObjectsModal, setShowSavedObjectsModal] = useState(false);
    const [selectedObjects, setSelectedObjects] = useState<SavedObject[]>([]);

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        loadInsuranceOptions();
        getCurrentLocation();
        loadSavedObjects();

        // Inicializa a rota: primeiro tenta searchParams, senão carrega último trajeto salvo
        initializeRoute();
    }, []);

    // Recarrega objetos salvos quando a tela ganha foco (ex: volta da tela de cadastro)
    useFocusEffect(
        useCallback(() => {
            loadSavedObjects();
        }, [])
    );

    // Inicializa a rota (searchParams ou último trajeto salvo)
    const initializeRoute = async () => {
        // Se veio com searchParams, usa eles
        if (searchParams?.originLat && searchParams?.destLat) {
            console.log('[RegisterMerchandise] Usando searchParams');
            setOriginLat(searchParams.originLat);
            setOriginLng(searchParams.originLng);
            setOriginName(searchParams.origin || searchParams.originCity || '');
            setDestLat(searchParams.destLat);
            setDestLng(searchParams.destLng);
            setDestName(searchParams.destination || searchParams.destinationCity || '');
            return;
        }

        // Senão, carrega o último trajeto salvo
        try {
            const savedRoute = await AsyncStorage.getItem(LAST_ROUTE_KEY);
            console.log('[RegisterMerchandise] Trajeto salvo:', savedRoute);
            if (savedRoute) {
                const route = JSON.parse(savedRoute);
                if (route.origin) {
                    setOriginLat(route.origin.lat);
                    setOriginLng(route.origin.lng);
                    setOriginName(route.origin.name);
                }
                if (route.destination) {
                    setDestLat(route.destination.lat);
                    setDestLng(route.destination.lng);
                    setDestName(route.destination.name);
                }
            }
        } catch (error) {
            console.log('Erro ao carregar ultimo trajeto:', error);
        }
    };

    // Carrega a rota quando origem e destino mudam
    useEffect(() => {
        if (originLat && originLng && destLat && destLng) {
            fetchRouteCoordinates(originLat, originLng, destLat, destLng);
        }
    }, [originLat, originLng, destLat, destLng]);

    // Salva o trajeto atual
    const saveLastRoute = async () => {
        try {
            const routeData = {
                origin: originLat && originLng ? {
                    lat: originLat,
                    lng: originLng,
                    name: originName,
                } : null,
                destination: destLat && destLng ? {
                    lat: destLat,
                    lng: destLng,
                    name: destName,
                } : null,
            };
            await AsyncStorage.setItem(LAST_ROUTE_KEY, JSON.stringify(routeData));
        } catch (error) {
            console.log('Erro ao salvar trajeto:', error);
        }
    };

    const loadSavedObjects = async () => {
        setLoadingSavedObjects(true);
        try {
            const response = await api.get('/objects');
            setSavedObjects(response.data || []);
        } catch (error: any) {
            console.log('Erro ao carregar objetos salvos:', error);
            setSavedObjects([]);
        } finally {
            setLoadingSavedObjects(false);
        }
    };

    const toggleObjectSelection = (object: SavedObject) => {
        const isSelected = selectedObjects.some(obj => obj.id === object.id);
        if (isSelected) {
            setSelectedObjects(selectedObjects.filter(obj => obj.id !== object.id));
        } else {
            setSelectedObjects([...selectedObjects, object]);
        }
    };

    const removeSelectedObject = (objectId: string) => {
        setSelectedObjects(selectedObjects.filter(obj => obj.id !== objectId));
    };

    const clearAllSelectedObjects = () => {
        setSelectedObjects([]);
    };

    const getTotalDeclaredValue = (): number => {
        return selectedObjects.reduce((total, obj) => total + (obj.declaredValue || 0), 0);
    };

    const getTotalWeight = (): number => {
        return selectedObjects.reduce((total, obj) => total + (obj.weight || 0), 0);
    };

    useEffect(() => {
        // Atualiza requisitos de foto quando categoria muda
        updatePhotoRequirements();
    }, [selectedCategory, selectedSubcategory, requiresBox]);

    const updatePhotoRequirements = () => {
        const basePhotos: PhotoRequirement[] = [];

        if (requiresBox) {
            basePhotos.push(
                { id: 'box_open', label: 'Caixa Aberta', description: 'Foto mostrando o conteudo da caixa', required: true },
                { id: 'box_closed', label: 'Caixa Fechada', description: 'Foto da caixa fechada e lacrada', required: true }
            );
        } else {
            basePhotos.push(
                { id: 'item_front', label: 'Frente do Objeto', description: 'Foto frontal do objeto', required: true },
                { id: 'item_side', label: 'Lateral do Objeto', description: 'Foto lateral para ver profundidade', required: true }
            );
        }

        // Foto adicional opcional
        basePhotos.push(
            { id: 'additional', label: 'Foto Adicional', description: 'Foto extra (opcional)', required: false }
        );

        setPhotos(basePhotos);
    };

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

    const fetchRouteCoordinates = async (oLat: number, oLng: number, dLat: number, dLng: number) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const coordinates = data.routes[0].geometry.coordinates;
                setRouteCoordinates(coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                })));
            }
        } catch (error) {
            console.log('Erro ao buscar rota:', error);
        }
    };

    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'VaiNoPulo/1.0' } }
            );
            const data = await response.json();
            if (data && data.address) {
                const { road, neighbourhood, suburb, city, town, village } = data.address;
                const parts = [road || '', neighbourhood || suburb || '', city || town || village || ''].filter(Boolean);
                return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    async function loadInsuranceOptions() {
        try {
            // TODO: Implementar endpoint /insurance/options no backend
            // Por enquanto, usa dados mockados
            const mockInsuranceOptions: InsuranceOption[] = [
                {
                    id: 'basic',
                    name: 'Seguro Básico',
                    description: 'Cobertura para danos e extravios até R$ 1.000',
                    percentageRate: 2,
                    minValue: 5,
                    maxCoverage: 1000,
                },
                {
                    id: 'standard',
                    name: 'Seguro Padrão',
                    description: 'Cobertura para danos e extravios até R$ 5.000',
                    percentageRate: 3,
                    minValue: 10,
                    maxCoverage: 5000,
                },
                {
                    id: 'premium',
                    name: 'Seguro Premium',
                    description: 'Cobertura total para danos, extravios e atrasos até R$ 10.000',
                    percentageRate: 5,
                    minValue: 20,
                    maxCoverage: 10000,
                },
            ];
            setInsuranceOptions(mockInsuranceOptions);
        } catch (error) {
            console.error('Erro ao carregar opcoes de seguro:', error);
        } finally {
            setLoadingInsurance(false);
        }
    }

    const openMapForSelection = (type: 'origin' | 'destination') => {
        setSelectingPoint(type);
        setTempMarker(null);
        setShowMapModal(true);
    };

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setTempMarker({ latitude, longitude });
    };

    const confirmMapSelection = async () => {
        if (!tempMarker) {
            Alert.alert('Atencao', 'Toque no mapa para selecionar um ponto');
            return;
        }

        const address = await reverseGeocode(tempMarker.latitude, tempMarker.longitude);

        if (selectingPoint === 'origin') {
            setOriginLat(tempMarker.latitude);
            setOriginLng(tempMarker.longitude);
            setOriginName(address);
        } else {
            setDestLat(tempMarker.latitude);
            setDestLng(tempMarker.longitude);
            setDestName(address);
        }

        // Atualiza rota se ambos os pontos estiverem definidos
        const newOriginLat = selectingPoint === 'origin' ? tempMarker.latitude : originLat;
        const newOriginLng = selectingPoint === 'origin' ? tempMarker.longitude : originLng;
        const newDestLat = selectingPoint === 'destination' ? tempMarker.latitude : destLat;
        const newDestLng = selectingPoint === 'destination' ? tempMarker.longitude : destLng;

        if (newOriginLat && newOriginLng && newDestLat && newDestLng) {
            fetchRouteCoordinates(newOriginLat, newOriginLng, newDestLat, newDestLng);
        }

        setShowMapModal(false);
        setTempMarker(null);
    };

    const pickPhoto = async (photoId: string) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotos(photos.map(p => p.id === photoId ? { ...p, uri: result.assets[0].uri } : p));
        }
    };

    const takePhoto = async (photoId: string) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissao necessaria', 'Precisamos de acesso a camera');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotos(photos.map(p => p.id === photoId ? { ...p, uri: result.assets[0].uri } : p));
        }
    };

    const removePhoto = (photoId: string) => {
        setPhotos(photos.map(p => p.id === photoId ? { ...p, uri: undefined } : p));
    };

    const getCategoryInfo = () => {
        if (!selectedCategory) return null;
        return CATEGORIES[selectedCategory as keyof typeof CATEGORIES];
    };

    const getSubcategoryInfo = () => {
        const cat = getCategoryInfo();
        if (!cat || !selectedSubcategory) return null;
        return cat.subcategories[selectedSubcategory as keyof typeof cat.subcategories];
    };

    const calculateVolume = (): number => {
        const h = parseFloat(height) || 0;
        const w = parseFloat(width) || 0;
        const l = parseFloat(length) || 0;
        return h * w * l;
    };

    const calculateBasePrice = (): number => {
        const w = parseFloat(weight) || 0;
        const distance = getDistanceFromTrip();
        const pricePerKm = 0.80;
        const pricePerKg = 0.50;
        const minPrice = 15.00;
        const totalBase = (distance * pricePerKm) + (w * pricePerKg);
        return Math.max(totalBase, minPrice);
    };

    const getDistanceFromTrip = (): number => {
        return trip?.distance || trip?.distanceKm || 50; // Default 50km se nao tiver
    };

    const calculateInsurancePrice = (): number => {
        if (!wantsInsurance || !selectedInsurance) return 0;
        const insurance = insuranceOptions.find((i) => i.id === selectedInsurance);
        if (!insurance) return 0;
        const value = parseFloat(declaredValue) || 0;
        const calculated = value * (insurance.percentageRate / 100);
        return Math.max(calculated, insurance.minValue);
    };

    const calculateTotalPrice = (): number => {
        return calculateBasePrice() + calculateInsurancePrice();
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Rota
                if (!originLat || !originLng) {
                    Alert.alert('Atencao', 'Selecione o ponto de origem');
                    return false;
                }
                if (!destLat || !destLng) {
                    Alert.alert('Atencao', 'Selecione o ponto de destino');
                    return false;
                }
                return true;

            case 2: // Mercadoria
                if (selectedObjects.length === 0) {
                    Alert.alert('Atencao', 'Selecione pelo menos um objeto para enviar');
                    return false;
                }
                return true;

            case 3: // Fotos
                const requiredPhotos = photos.filter(p => p.required);
                const missingPhotos = requiredPhotos.filter(p => !p.uri);
                if (missingPhotos.length > 0) {
                    Alert.alert('Atencao', `Faltam fotos obrigatorias: ${missingPhotos.map(p => p.label).join(', ')}`);
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCreateOrder = async () => {
        if (!validateStep(3)) return;

        setLoading(true);

        try {
            // Monta a descricao com os nomes dos objetos
            const objectNames = selectedObjects.length > 0
                ? selectedObjects.map(obj => obj.name).join(', ')
                : merchandiseName;

            // Calcula peso total
            const totalWeight = selectedObjects.length > 0
                ? selectedObjects.reduce((total, obj) => total + (obj.weight || 0), 0)
                : parseFloat(weight) || 0;

            // Cria o pedido no backend
            const orderData = {
                description: objectNames,
                weight: totalWeight,
                dimensions: `${height}x${width}x${length}cm`,
                estimatedPrice: calculateTotalPrice(),
                notes: specialInstructions || '',
                origin: {
                    name: originName,
                    lat: originLat,
                    lng: originLng,
                },
                destination: {
                    name: destName,
                    lat: destLat,
                    lng: destLng,
                },
                objects: selectedObjects.length > 0
                    ? selectedObjects.map(obj => ({ id: obj.id, name: obj.name }))
                    : [{ name: merchandiseName }],
                insurance: wantsInsurance ? {
                    optionId: selectedInsurance,
                    price: calculateInsurancePrice(),
                } : null,
            };

            await api.post('/orders', orderData);

            // Salva o trajeto para uso futuro
            await saveLastRoute();

            Alert.alert(
                'Pedido Criado!',
                'Seu pedido foi enviado com sucesso. Aguarde a confirmacao de um motorista.',
                [
                    {
                        text: 'Ver Pedidos',
                        onPress: () => navigation.navigate('Pedidos'),
                    },
                ]
            );
        } catch (error: any) {
            console.log('Erro ao criar pedido:', error);
            Alert.alert('Erro', 'Nao foi possivel criar o pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndSearch = () => {
        if (!validateStep(3)) return;

        // Monta objeto da mercadoria
        const merchandise = {
            name: merchandiseName,
            description: merchandiseDescription,
            category: selectedCategory,
            subcategory: selectedSubcategory,
            brand: selectedBrand,
            weight,
            height,
            width,
            length,
            declaredValue,
            photos: photos.filter(p => p.uri).map(p => ({ type: p.id, uri: p.uri })),
            isFragile,
            requiresRefrigeration,
            requiresBox,
            specialInstructions,
        };

        const origin = { lat: originLat, lng: originLng, name: originName };
        const destination = { lat: destLat, lng: destLng, name: destName };

        navigation.navigate('SearchResults', {
            trips: [],
            searchParams: {
                origin,
                destination,
                originCity: originName,
                destinationCity: destName,
                date: new Date().toISOString(),
            },
            merchandise,
            pricing: {
                basePrice: calculateBasePrice(),
                insurancePrice: calculateInsurancePrice(),
                totalPrice: calculateTotalPrice(),
            },
            insurance: wantsInsurance ? {
                optionId: selectedInsurance,
                price: calculateInsurancePrice(),
            } : null,
        });
    };

    const truncateAddress = (address: string, maxLength: number = 40): string => {
        if (!address) return '';
        if (address.length <= maxLength) return address;
        return address.substring(0, maxLength) + '...';
    };

    // ===================== RENDER STEP 1: ROTA =====================
    const renderRouteStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>De onde para onde?</Text>
            <Text style={styles.stepSubtitle}>Selecione os pontos de coleta e entrega</Text>

            {/* Mini mapa com rota */}
            {originLat && destLat && (
                <View style={styles.routePreviewContainer}>
                    <MapView
                        style={styles.routePreviewMap}
                        provider={PROVIDER_GOOGLE}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        region={{
                            latitude: (originLat + destLat) / 2,
                            longitude: (originLng! + destLng!) / 2,
                            latitudeDelta: Math.abs(originLat - destLat) * 1.8 + 0.02,
                            longitudeDelta: Math.abs(originLng! - destLng!) * 1.8 + 0.02,
                        }}
                    >
                        {routeCoordinates.length > 0 && (
                            <>
                                <Polyline
                                    coordinates={routeCoordinates}
                                    strokeColor="rgba(0,0,0,0.2)"
                                    strokeWidth={6}
                                />
                                <Polyline
                                    coordinates={routeCoordinates}
                                    strokeColor="#4facfe"
                                    strokeWidth={4}
                                />
                            </>
                        )}
                        <Marker coordinate={{ latitude: originLat, longitude: originLng! }}>
                            <View style={[styles.mapMarker, { backgroundColor: '#00f260' }]}>
                                <Ionicons name="location" size={16} color="#fff" />
                            </View>
                        </Marker>
                        <Marker coordinate={{ latitude: destLat, longitude: destLng! }}>
                            <View style={[styles.mapMarker, { backgroundColor: '#ff4444' }]}>
                                <Ionicons name="flag" size={16} color="#fff" />
                            </View>
                        </Marker>
                    </MapView>
                </View>
            )}

            {/* Origem */}
            <Text style={styles.fieldLabel}>Ponto de Coleta</Text>
            <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => openMapForSelection('origin')}
            >
                <View style={styles.locationIcon}>
                    <Ionicons name="location" size={22} color="#00f260" />
                </View>
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText} numberOfLines={2}>
                        {originName || 'Toque para selecionar no mapa'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            {/* Conector */}
            <View style={styles.routeConnector}>
                <View style={styles.routeConnectorLine} />
                <Ionicons name="arrow-down" size={18} color="#ccc" />
                <View style={styles.routeConnectorLine} />
            </View>

            {/* Destino */}
            <Text style={styles.fieldLabel}>Ponto de Entrega</Text>
            <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => openMapForSelection('destination')}
            >
                <View style={[styles.locationIcon, { backgroundColor: '#fff0f0' }]}>
                    <Ionicons name="flag" size={22} color="#ff4444" />
                </View>
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText} numberOfLines={2}>
                        {destName || 'Toque para selecionar no mapa'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>
    );

    // ===================== RENDER STEP 2: MERCADORIA =====================
    const renderMerchandiseStep = () => {
        const getCategoryLabel = (categoryId: string) => {
            const cat = CATEGORIES[categoryId as keyof typeof CATEGORIES];
            return cat?.label || categoryId;
        };

        const getSubcategoryLabel = (categoryId: string, subcategoryId: string) => {
            const cat = CATEGORIES[categoryId as keyof typeof CATEGORIES];
            const sub = cat?.subcategories?.[subcategoryId as keyof typeof cat.subcategories];
            return (sub as any)?.label || subcategoryId;
        };

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>O que voce vai enviar?</Text>
                <Text style={styles.stepSubtitle}>Selecione os objetos que deseja enviar</Text>

                {/* Botoes de acao */}
                <View style={styles.objectActionsRow}>
                    <TouchableOpacity
                        style={styles.selectObjectButton}
                        onPress={() => setShowSavedObjectsModal(true)}
                    >
                        <Ionicons name="cube" size={20} color="#4facfe" />
                        <Text style={styles.selectObjectButtonText}>Meus Objetos</Text>
                        {savedObjects.length > 0 && (
                            <View style={styles.savedObjectsBadge}>
                                <Text style={styles.savedObjectsBadgeText}>{savedObjects.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.addNewObjectButton}
                        onPress={() => navigation.navigate('AddObject')}
                    >
                        <Ionicons name="add-circle" size={20} color="#00f260" />
                        <Text style={styles.addNewObjectButtonText}>Cadastrar Novo</Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de objetos selecionados */}
                {selectedObjects.length > 0 && (
                    <View style={styles.selectedObjectsList}>
                        <View style={styles.selectedObjectsHeader}>
                            <Text style={styles.selectedObjectsTitle}>
                                {selectedObjects.length} {selectedObjects.length === 1 ? 'objeto selecionado' : 'objetos selecionados'}
                            </Text>
                            {selectedObjects.length > 1 && (
                                <TouchableOpacity onPress={clearAllSelectedObjects}>
                                    <Text style={styles.clearAllText}>Limpar todos</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {selectedObjects.map((object) => (
                            <View key={object.id} style={styles.selectedObjectCard}>
                                <View style={styles.selectedObjectContent}>
                                    {object.photos && object.photos.length > 0 ? (
                                        <Image
                                            source={{ uri: getFullImageUrl(object.photos[0]) || '' }}
                                            style={styles.selectedObjectImage}
                                        />
                                    ) : (
                                        <View style={styles.selectedObjectImagePlaceholder}>
                                            <Ionicons name="cube-outline" size={24} color="#999" />
                                        </View>
                                    )}
                                    <View style={styles.selectedObjectInfo}>
                                        <Text style={styles.selectedObjectName}>{object.name}</Text>
                                        <Text style={styles.selectedObjectCategory}>
                                            {getCategoryLabel(object.category)} • {getSubcategoryLabel(object.category, object.subcategory)}
                                        </Text>
                                        {object.declaredValue && (
                                            <Text style={styles.selectedObjectValue}>
                                                R$ {object.declaredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </Text>
                                        )}
                                        <View style={styles.selectedObjectTags}>
                                            {object.isFragile && (
                                                <View style={[styles.selectedObjectTag, { backgroundColor: '#fff0f0' }]}>
                                                    <Ionicons name="alert-circle" size={10} color="#ff6b6b" />
                                                    <Text style={{ fontSize: 10, color: '#ff6b6b' }}>Fragil</Text>
                                                </View>
                                            )}
                                            {object.requiresRefrigeration && (
                                                <View style={[styles.selectedObjectTag, { backgroundColor: '#e8f4fe' }]}>
                                                    <Ionicons name="snow" size={10} color="#4facfe" />
                                                    <Text style={{ fontSize: 10, color: '#4facfe' }}>Refrigerado</Text>
                                                </View>
                                            )}
                                            {object.requiresBox && (
                                                <View style={[styles.selectedObjectTag, { backgroundColor: '#f0f0f0' }]}>
                                                    <Ionicons name="cube" size={10} color="#666" />
                                                    <Text style={{ fontSize: 10, color: '#666' }}>Caixa</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeObjectButton}
                                        onPress={() => removeSelectedObject(object.id)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Resumo dos objetos */}
                        <View style={styles.objectsSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Peso total estimado:</Text>
                                <Text style={styles.summaryValue}>{getTotalWeight().toFixed(1)} kg</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Valor total declarado:</Text>
                                <Text style={styles.summaryValueHighlight}>
                                    R$ {getTotalDeclaredValue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Mensagem quando nenhum objeto esta selecionado */}
                {selectedObjects.length === 0 && (
                    <View style={styles.noObjectSelected}>
                        <Ionicons name="cube-outline" size={48} color="#ccc" />
                        <Text style={styles.noObjectSelectedTitle}>Nenhum objeto selecionado</Text>
                        <Text style={styles.noObjectSelectedText}>
                            Selecione objetos da sua lista ou cadastre um novo para continuar
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // ===================== RENDER STEP 3: FOTOS =====================
    const renderPhotosStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Registre sua mercadoria</Text>
            <Text style={styles.stepSubtitle}>
                {requiresBox
                    ? 'Tire fotos da caixa aberta e fechada'
                    : 'Tire fotos do objeto de diferentes angulos'}
            </Text>

            <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                    <View key={photo.id} style={styles.photoCard}>
                        <View style={styles.photoCardHeader}>
                            <Text style={styles.photoCardTitle}>
                                {photo.label}
                                {photo.required && <Text style={styles.requiredStar}> *</Text>}
                            </Text>
                        </View>

                        {photo.uri ? (
                            <View style={styles.photoPreviewContainer}>
                                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => removePhoto(photo.id)}
                                >
                                    <Ionicons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <View style={styles.photoActions}>
                                    <TouchableOpacity
                                        style={styles.photoActionButton}
                                        onPress={() => takePhoto(photo.id)}
                                    >
                                        <Ionicons name="camera" size={24} color="#4facfe" />
                                        <Text style={styles.photoActionText}>Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.photoActionButton}
                                        onPress={() => pickPhoto(photo.id)}
                                    >
                                        <Ionicons name="images" size={24} color="#4facfe" />
                                        <Text style={styles.photoActionText}>Galeria</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text style={styles.photoDescription}>{photo.description}</Text>
                    </View>
                ))}
            </View>

            {/* Instrucoes especiais */}
            <Text style={styles.fieldLabel}>Instrucoes para o Motorista</Text>
            <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Alguma instrucao especial? (opcional)"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={2}
            />
        </View>
    );

    // ===================== RENDER STEP 4: RESUMO =====================
    const renderSummaryStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Resumo do Envio</Text>
            <Text style={styles.stepSubtitle}>Confira os dados antes de fazer o pedido</Text>

            {/* Rota */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                    <Ionicons name="navigate" size={20} color="#4facfe" />
                    <Text style={styles.summaryCardTitle}>Trajeto</Text>
                </View>
                <View style={styles.summaryRoute}>
                    <View style={styles.summaryRoutePoint}>
                        <View style={[styles.summaryDot, { backgroundColor: '#00f260' }]} />
                        <Text style={styles.summaryRouteText} numberOfLines={2}>{originName}</Text>
                    </View>
                    <View style={styles.summaryRouteLine} />
                    <View style={styles.summaryRoutePoint}>
                        <View style={[styles.summaryDot, { backgroundColor: '#ff4444' }]} />
                        <Text style={styles.summaryRouteText} numberOfLines={2}>{destName}</Text>
                    </View>
                </View>
            </View>

            {/* Mercadoria */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                    <Ionicons name="cube" size={20} color="#4facfe" />
                    <Text style={styles.summaryCardTitle}>Mercadoria</Text>
                </View>
                {selectedObjects.length > 0 ? (
                    <View style={styles.objectsListSummary}>
                        {selectedObjects.map((obj, index) => (
                            <View key={obj.id} style={styles.objectListItem}>
                                <View style={styles.objectListBullet} />
                                <Text style={styles.objectListName}>{obj.name}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.objectsListSummary}>
                        <View style={styles.objectListItem}>
                            <View style={styles.objectListBullet} />
                            <Text style={styles.objectListName}>{merchandiseName}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Preco */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                    <Ionicons name="cash" size={20} color="#00f260" />
                    <Text style={styles.summaryCardTitle}>Valor Estimado</Text>
                </View>
                <View style={styles.priceBreakdown}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Frete base</Text>
                        <Text style={styles.priceValue}>R$ {calculateBasePrice().toFixed(2)}</Text>
                    </View>
                    {wantsInsurance && selectedInsurance && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Seguro</Text>
                            <Text style={styles.priceValue}>R$ {calculateInsurancePrice().toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>R$ {calculateTotalPrice().toFixed(2)}</Text>
                    </View>
                </View>
            </View>

            {/* Fotos */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                    <Ionicons name="camera" size={20} color="#4facfe" />
                    <Text style={styles.summaryCardTitle}>Fotos</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {photos.filter(p => p.uri).map((photo) => (
                        <Image
                            key={photo.id}
                            source={{ uri: photo.uri }}
                            style={styles.summaryPhoto}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Enviar Mercadoria</Text>
                    <Text style={styles.headerSubtitle}>Etapa {currentStep} de 4</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
                {[1, 2, 3, 4].map((step) => (
                    <View key={step} style={styles.progressStep}>
                        <View
                            style={[
                                styles.progressDot,
                                currentStep >= step && styles.progressDotActive,
                                currentStep === step && styles.progressDotCurrent,
                            ]}
                        >
                            {currentStep > step ? (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                            ) : (
                                <Text style={[
                                    styles.progressNumber,
                                    currentStep >= step && styles.progressNumberActive,
                                ]}>{step}</Text>
                            )}
                        </View>
                        {step < 4 && (
                            <View style={[
                                styles.progressLine,
                                currentStep > step && styles.progressLineActive,
                            ]} />
                        )}
                    </View>
                ))}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {currentStep === 1 && renderRouteStep()}
                {currentStep === 2 && renderMerchandiseStep()}
                {currentStep === 3 && renderPhotosStep()}
                {currentStep === 4 && renderSummaryStep()}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 70, 90) }]}>
                {currentStep > 1 && (
                    <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                        <Ionicons name="arrow-back" size={20} color="#666" />
                        <Text style={styles.prevButtonText}>Voltar</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
                    onPress={currentStep === 4 ? handleCreateOrder : nextStep}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === 4 ? 'Pedir' : 'Continuar'}
                    </Text>
                    <Ionicons
                        name={currentStep === 4 ? 'checkmark-circle' : 'arrow-forward'}
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* Modal Mapa */}
            <Modal visible={showMapModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <Ionicons name="arrow-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Selecionar {selectingPoint === 'origin' ? 'Origem' : 'Destino'}
                        </Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.mapInstruction}>
                        <Ionicons name="information-circle" size={20} color="#4facfe" />
                        <Text style={styles.mapInstructionText}>
                            Toque no mapa para selecionar o ponto
                        </Text>
                    </View>

                    <MapView
                        ref={mapRef}
                        style={styles.fullMap}
                        provider={PROVIDER_GOOGLE}
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
                            style={[styles.confirmMapButton, !tempMarker && styles.buttonDisabled]}
                            onPress={confirmMapSelection}
                            disabled={!tempMarker}
                        >
                            <Text style={styles.confirmMapButtonText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Modal Categorias */}
            <Modal visible={showCategoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalContentHeader}>
                            <Text style={styles.modalContentTitle}>Selecione a Categoria</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {Object.values(CATEGORIES).map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.optionItem,
                                        selectedCategory === cat.id && styles.optionItemActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory(cat.id);
                                        setSelectedSubcategory(null);
                                        setSelectedBrand(null);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={24}
                                        color={selectedCategory === cat.id ? '#4facfe' : '#666'}
                                    />
                                    <Text style={[
                                        styles.optionText,
                                        selectedCategory === cat.id && styles.optionTextActive,
                                    ]}>{cat.label}</Text>
                                    {selectedCategory === cat.id && (
                                        <Ionicons name="checkmark-circle" size={22} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Subcategorias */}
            <Modal visible={showSubcategoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalContentHeader}>
                            <Text style={styles.modalContentTitle}>Selecione o Tipo</Text>
                            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {selectedCategory && Object.values(
                                CATEGORIES[selectedCategory as keyof typeof CATEGORIES].subcategories
                            ).map((sub: any) => (
                                <TouchableOpacity
                                    key={sub.id}
                                    style={[
                                        styles.optionItem,
                                        selectedSubcategory === sub.id && styles.optionItemActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedSubcategory(sub.id);
                                        setSelectedBrand(null);
                                        // Verifica se requer refrigeracao ou nao cabe em caixa
                                        if (sub.requiresRefrigeration) setRequiresRefrigeration(true);
                                        if (sub.noBox) setRequiresBox(false);
                                        setShowSubcategoryModal(false);
                                    }}
                                >
                                    <Ionicons
                                        name={sub.icon as any}
                                        size={24}
                                        color={selectedSubcategory === sub.id ? '#4facfe' : '#666'}
                                    />
                                    <Text style={[
                                        styles.optionText,
                                        selectedSubcategory === sub.id && styles.optionTextActive,
                                    ]}>{sub.label}</Text>
                                    {selectedSubcategory === sub.id && (
                                        <Ionicons name="checkmark-circle" size={22} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Marcas */}
            <Modal visible={showBrandModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalContentHeader}>
                            <Text style={styles.modalContentTitle}>Selecione a Marca</Text>
                            <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {getSubcategoryInfo()?.brands?.map((brand: string) => (
                                <TouchableOpacity
                                    key={brand}
                                    style={[
                                        styles.optionItem,
                                        selectedBrand === brand && styles.optionItemActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedBrand(brand);
                                        setShowBrandModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedBrand === brand && styles.optionTextActive,
                                    ]}>{brand}</Text>
                                    {selectedBrand === brand && (
                                        <Ionicons name="checkmark-circle" size={22} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Objetos Salvos - Seleção Múltipla */}
            <Modal visible={showSavedObjectsModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.savedObjectsModalContent}>
                        <View style={styles.modalContentHeader}>
                            <Text style={styles.modalContentTitle}>Selecionar Objetos</Text>
                            <TouchableOpacity onPress={() => setShowSavedObjectsModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedObjects.length > 0 && (
                            <View style={styles.modalSelectionInfo}>
                                <Ionicons name="checkmark-circle" size={18} color="#00f260" />
                                <Text style={styles.modalSelectionText}>
                                    {selectedObjects.length} {selectedObjects.length === 1 ? 'objeto selecionado' : 'objetos selecionados'}
                                </Text>
                            </View>
                        )}

                        {loadingSavedObjects ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4facfe" />
                                <Text style={styles.loadingText}>Carregando objetos...</Text>
                            </View>
                        ) : savedObjects.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cube-outline" size={60} color="#ccc" />
                                <Text style={styles.emptyTitle}>Nenhum objeto cadastrado</Text>
                                <Text style={styles.emptyText}>
                                    Cadastre objetos para poder seleciona-los aqui
                                </Text>
                                <TouchableOpacity
                                    style={styles.goToObjectsButton}
                                    onPress={() => {
                                        setShowSavedObjectsModal(false);
                                        navigation.navigate('AddObject');
                                    }}
                                >
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={styles.goToObjectsButtonText}>Cadastrar Objeto</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={savedObjects}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => {
                                        const catInfo = CATEGORIES[item.category as keyof typeof CATEGORIES];
                                        const subInfo = catInfo?.subcategories?.[item.subcategory as keyof typeof catInfo.subcategories];
                                        const isSelected = selectedObjects.some(obj => obj.id === item.id);

                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.savedObjectItem,
                                                    isSelected && styles.savedObjectItemSelected,
                                                ]}
                                                onPress={() => toggleObjectSelection(item)}
                                            >
                                                <View style={[
                                                    styles.checkboxCircle,
                                                    isSelected && styles.checkboxCircleSelected
                                                ]}>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                                <View style={styles.savedObjectImageContainer}>
                                                    {item.photos && item.photos.length > 0 ? (
                                                        <Image
                                                            source={{ uri: getFullImageUrl(item.photos[0]) || '' }}
                                                            style={styles.savedObjectItemImage}
                                                        />
                                                    ) : (
                                                        <View style={styles.savedObjectImagePlaceholder}>
                                                            <Ionicons
                                                                name={(catInfo?.icon || 'cube-outline') as any}
                                                                size={24}
                                                                color="#999"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.savedObjectItemInfo}>
                                                    <Text style={styles.savedObjectItemName}>{item.name}</Text>
                                                    <Text style={styles.savedObjectItemCategory}>
                                                        {catInfo?.label || item.category} • {(subInfo as any)?.label || item.subcategory}
                                                    </Text>
                                                    {item.declaredValue && (
                                                        <Text style={styles.savedObjectItemValue}>
                                                            R$ {item.declaredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </Text>
                                                    )}
                                                    <View style={styles.savedObjectTags}>
                                                        {item.isFragile && (
                                                            <View style={[styles.savedObjectTag, { backgroundColor: '#fff0f0' }]}>
                                                                <Ionicons name="alert-circle" size={10} color="#ff6b6b" />
                                                                <Text style={{ fontSize: 10, color: '#ff6b6b' }}>Fragil</Text>
                                                            </View>
                                                        )}
                                                        {item.requiresRefrigeration && (
                                                            <View style={[styles.savedObjectTag, { backgroundColor: '#e8f4fe' }]}>
                                                                <Ionicons name="snow" size={10} color="#4facfe" />
                                                                <Text style={{ fontSize: 10, color: '#4facfe' }}>Refrigerado</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                    showsVerticalScrollIndicator={false}
                                />
                                <View style={styles.modalFooterButtons}>
                                    <TouchableOpacity
                                        style={styles.modalAddNewButton}
                                        onPress={() => {
                                            setShowSavedObjectsModal(false);
                                            navigation.navigate('AddObject');
                                        }}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color="#4facfe" />
                                        <Text style={styles.modalAddNewButtonText}>Cadastrar Novo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalConfirmButton}
                                        onPress={() => setShowSavedObjectsModal(false)}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text style={styles.modalConfirmButtonText}>Confirmar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal Video Dimensao */}
            <Modal visible={showVideoDimensionModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowVideoDimensionModal(false)}>
                            <Ionicons name="arrow-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Medir por Video</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.videoDimensionContent}>
                        <Ionicons name="videocam" size={80} color="#4facfe" />
                        <Text style={styles.videoDimensionTitle}>Funcionalidade em Desenvolvimento</Text>
                        <Text style={styles.videoDimensionDescription}>
                            Em breve voce podera usar a camera do seu celular para estimar
                            automaticamente as dimensoes do seu objeto usando realidade aumentada.
                        </Text>
                        <Text style={styles.videoDimensionNote}>
                            Por enquanto, insira as dimensoes manualmente.
                        </Text>
                        <TouchableOpacity
                            style={styles.videoDimensionButton}
                            onPress={() => setShowVideoDimensionModal(false)}
                        >
                            <Text style={styles.videoDimensionButtonText}>Entendi</Text>
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
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
        backgroundColor: '#fff',
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: '#4facfe',
    },
    progressDotCurrent: {
        backgroundColor: '#4facfe',
        transform: [{ scale: 1.1 }],
    },
    progressNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    progressNumberActive: {
        color: '#fff',
    },
    progressLine: {
        width: 50,
        height: 3,
        backgroundColor: '#e1e1e1',
        marginHorizontal: 5,
    },
    progressLineActive: {
        backgroundColor: '#4facfe',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    stepContainer: {
        paddingBottom: 120,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    // Route styles
    routePreviewContainer: {
        height: 150,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    routePreviewMap: {
        flex: 1,
    },
    locationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    locationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e6fff0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationText: {
        fontSize: 15,
        color: '#333',
    },
    routeConnector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        gap: 8,
    },
    routeConnectorLine: {
        width: 40,
        height: 1,
        backgroundColor: '#ddd',
    },
    mapMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
    // Selector styles
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    selectorContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectorText: {
        fontSize: 15,
        color: '#333',
    },
    selectorPlaceholder: {
        fontSize: 15,
        color: '#999',
    },
    // Input styles
    textInput: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    // Dimensions styles
    dimensionsSection: {
        marginTop: 16,
    },
    dimensionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    videoDimensionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#e8f4fe',
    },
    videoDimensionText: {
        fontSize: 13,
        color: '#4facfe',
        fontWeight: '500',
    },
    dimensionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dimensionField: {
        flex: 1,
    },
    dimensionLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    dimensionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        paddingHorizontal: 12,
    },
    dimensionInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
    },
    dimensionUnit: {
        fontSize: 14,
        color: '#666',
    },
    volumeInfo: {
        fontSize: 13,
        color: '#4facfe',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },
    // Characteristics styles
    characteristicsSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        marginTop: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    switchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switchLabel: {
        fontSize: 15,
        color: '#333',
    },
    // Value input
    valueInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        paddingHorizontal: 16,
    },
    currencyPrefix: {
        fontSize: 15,
        color: '#666',
        marginRight: 8,
    },
    valueInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 15,
        color: '#333',
    },
    // Photos styles
    photosGrid: {
        gap: 16,
    },
    photoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    photoCardHeader: {
        marginBottom: 12,
    },
    photoCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    requiredStar: {
        color: '#ff4444',
    },
    photoPreviewContainer: {
        position: 'relative',
    },
    photoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removePhotoButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ff4444',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholder: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 30,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
    },
    photoActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
    },
    photoActionButton: {
        alignItems: 'center',
        gap: 8,
    },
    photoActionText: {
        fontSize: 13,
        color: '#4facfe',
        fontWeight: '500',
    },
    photoDescription: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    // Summary styles
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    summaryCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryRoute: {
        paddingLeft: 8,
    },
    summaryRoutePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 4,
    },
    summaryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
    },
    summaryRouteText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    summaryRouteLine: {
        width: 2,
        height: 20,
        backgroundColor: '#ddd',
        marginLeft: 5,
        marginVertical: 4,
    },
    summaryItem: {
        flexDirection: 'row',
        paddingVertical: 8,
    },
    summaryItemLabel: {
        fontSize: 14,
        color: '#666',
        width: 100,
    },
    summaryItemValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    objectsListSummary: {
        marginTop: 4,
    },
    objectListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    objectListBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4facfe',
        marginRight: 12,
    },
    objectListName: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    summaryTags: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    summaryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    summaryTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    summaryPhoto: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginRight: 10,
    },
    priceBreakdown: {
        gap: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
        paddingTop: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00f260',
    },
    // Footer styles
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 8,
    },
    prevButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#4facfe',
        gap: 8,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
    fullMap: {
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
        fontFamily: 'monospace',
    },
    confirmMapButton: {
        backgroundColor: '#00f260',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmMapButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    // Option modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalContentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalContentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 16,
    },
    optionItemActive: {
        backgroundColor: '#e8f4fe',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    optionTextActive: {
        color: '#4facfe',
        fontWeight: '600',
    },
    // Video dimension modal
    videoDimensionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    videoDimensionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 24,
        textAlign: 'center',
    },
    videoDimensionDescription: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
    },
    videoDimensionNote: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        marginTop: 12,
    },
    videoDimensionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4facfe',
        marginTop: 30,
    },
    // Input mode styles
    inputModeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    inputModeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4facfe',
        gap: 8,
    },
    inputModeButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    inputModeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4facfe',
    },
    inputModeButtonTextActive: {
        color: '#fff',
    },
    savedObjectsBadge: {
        backgroundColor: '#ff4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    savedObjectsBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Selected object card
    selectedObjectCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    selectedObjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    selectedObjectTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#00a040',
    },
    selectedObjectContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedObjectImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 12,
    },
    selectedObjectInfo: {
        flex: 1,
    },
    selectedObjectName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    selectedObjectCategory: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    selectedObjectValue: {
        fontSize: 13,
        color: '#00a040',
        fontWeight: '600',
        marginTop: 2,
    },
    // Saved objects modal
    savedObjectsModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '50%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    goToObjectsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    goToObjectsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    savedObjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    savedObjectItemSelected: {
        backgroundColor: '#e6fff0',
    },
    savedObjectImageContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
    },
    savedObjectItemImage: {
        width: '100%',
        height: '100%',
    },
    savedObjectImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    savedObjectItemInfo: {
        flex: 1,
    },
    savedObjectItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    savedObjectItemCategory: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    savedObjectTags: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    savedObjectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    // Object actions row
    objectActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    selectObjectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4facfe',
        gap: 8,
    },
    selectObjectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4facfe',
    },
    addNewObjectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6fff0',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00f260',
        gap: 8,
    },
    addNewObjectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00a040',
    },
    // Selected objects list
    selectedObjectsList: {
        marginTop: 8,
    },
    selectedObjectsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectedObjectsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    clearAllText: {
        fontSize: 14,
        color: '#ff4444',
    },
    // Selected object tags
    selectedObjectTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    selectedObjectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    selectedObjectDimensions: {
        fontSize: 12,
        color: '#888',
        marginTop: 6,
    },
    // No object selected
    noObjectSelected: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    noObjectSelectedTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    noObjectSelectedText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    // Selected object card updates
    selectedObjectImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    removeObjectButton: {
        padding: 4,
    },
    // Objects summary
    objectsSummary: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    summaryValueHighlight: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00a040',
    },
    // Modal updates
    modalSelectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        padding: 12,
        gap: 8,
    },
    modalSelectionText: {
        fontSize: 14,
        color: '#00a040',
        fontWeight: '500',
    },
    checkboxCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxCircleSelected: {
        backgroundColor: '#00f260',
        borderColor: '#00f260',
    },
    savedObjectItemValue: {
        fontSize: 13,
        color: '#00a040',
        fontWeight: '600',
        marginTop: 2,
    },
    modalFooterButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalAddNewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4facfe',
        gap: 8,
    },
    modalAddNewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4facfe',
    },
    modalConfirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00f260',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    modalConfirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
