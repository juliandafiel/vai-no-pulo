import React, { useState, useEffect } from 'react';
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
    FlatList,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import {
    getDefaultDimensions,
    getBrandDimensions,
    formatVolume,
    calculateVolumeCubicMeters,
    TV_SIZES,
    APPLIANCE_TYPES,
    ProductDimensions,
} from '../data/productDimensions';
import VideoDimensionMeasure from '../components/VideoDimensionMeasure';

// Estrutura de categorias
const CATEGORIES = {
    electronics: {
        id: 'electronics',
        label: 'Eletrônicos',
        icon: 'phone-portrait-outline',
        subcategories: {
            tv: { id: 'tv', label: 'TV / Monitor', icon: 'tv-outline', brands: ['Samsung', 'LG', 'Sony', 'Philips', 'TCL', 'AOC', 'Outra'] },
            audio: { id: 'audio', label: 'Som / Áudio', icon: 'musical-notes-outline', brands: ['JBL', 'Sony', 'Bose', 'LG', 'Samsung', 'Outra'] },
            videogame: { id: 'videogame', label: 'Video Game', icon: 'game-controller-outline', brands: ['PlayStation', 'Xbox', 'Nintendo', 'Outra'] },
            computer: { id: 'computer', label: 'Computador / Notebook', icon: 'laptop-outline', brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Outra'] },
            smartphone: { id: 'smartphone', label: 'Celular / Tablet', icon: 'phone-portrait-outline', brands: ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Outra'] },
            appliances: { id: 'appliances', label: 'Eletrodomésticos', icon: 'home-outline', brands: ['Electrolux', 'Brastemp', 'Consul', 'LG', 'Samsung', 'Outra'] },
            other_electronics: { id: 'other_electronics', label: 'Outros Eletrônicos', icon: 'hardware-chip-outline', brands: [] },
        },
    },
    clothes: {
        id: 'clothes',
        label: 'Roupas e Calçados',
        icon: 'shirt-outline',
        subcategories: {
            casual: { id: 'casual', label: 'Roupas Casuais', icon: 'shirt-outline' },
            formal: { id: 'formal', label: 'Roupas Formais', icon: 'business-outline' },
            shoes: { id: 'shoes', label: 'Calçados', icon: 'footsteps-outline' },
            accessories: { id: 'accessories', label: 'Acessórios', icon: 'watch-outline' },
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
            decoration: { id: 'decoration', label: 'Decoração', icon: 'flower-outline' },
        },
    },
    food: {
        id: 'food',
        label: 'Alimentos',
        icon: 'fast-food-outline',
        subcategories: {
            perishable: { id: 'perishable', label: 'Perecíveis', icon: 'nutrition-outline' },
            non_perishable: { id: 'non_perishable', label: 'Não Perecíveis', icon: 'cube-outline' },
            beverages: { id: 'beverages', label: 'Bebidas', icon: 'beer-outline' },
            frozen: { id: 'frozen', label: 'Congelados', icon: 'snow-outline' },
        },
    },
    furniture: {
        id: 'furniture',
        label: 'Móveis',
        icon: 'home-outline',
        subcategories: {
            sofa: { id: 'sofa', label: 'Sofá / Poltrona', icon: 'bed-outline' },
            table_furniture: { id: 'table_furniture', label: 'Mesa / Cadeira', icon: 'grid-outline' },
            wardrobe: { id: 'wardrobe', label: 'Armário / Guarda-roupa', icon: 'filing-outline' },
            bed: { id: 'bed', label: 'Cama / Colchão', icon: 'bed-outline' },
            office: { id: 'office', label: 'Móveis de Escritório', icon: 'desktop-outline' },
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

interface Media {
    uri: string;
    type: 'photo' | 'video' | 'existing';
    mediaType: 'image' | 'video';
}

interface ObjectItem {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    brand: string | null;
    declaredValue: string;
    isFragile: boolean;
    requiresRefrigeration: boolean;
    requiresBox: boolean;
    needsDriverBox: boolean;
    media: Media[];
    weight?: string;
    height?: string;
    width?: string;
    length?: string;
}

// Interface para objeto que vem da edição
interface EditableObject {
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
    needsDriverBox?: boolean;
    photos: string[];
    videos?: string[];
    weight?: number;
    height?: number;
    width?: number;
    depth?: number;
}

export default function AddObjectScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [loading, setLoading] = useState(false);

    // Modo de edição
    const editObject: EditableObject | undefined = route.params?.editObject;
    const isEditMode = !!editObject;

    // Lista de objetos a serem enviados
    const [objectsList, setObjectsList] = useState<ObjectItem[]>([]);

    // Form states
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [declaredValue, setDeclaredValue] = useState('');
    const [isFragile, setIsFragile] = useState(false);
    const [requiresRefrigeration, setRequiresRefrigeration] = useState(false);
    const [requiresBox, setRequiresBox] = useState(true);
    const [needsDriverBox, setNeedsDriverBox] = useState(false);
    const [media, setMedia] = useState<Media[]>([]);

    // Campos de dimensões
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [showVideoDimensionModal, setShowVideoDimensionModal] = useState(false);
    const [dimensionsAutoFilled, setDimensionsAutoFilled] = useState(false);
    const [dimensionDescription, setDimensionDescription] = useState<string | null>(null);

    // Para eletrônicos específicos (TV, eletrodomésticos)
    const [selectedTvSize, setSelectedTvSize] = useState<string | null>(null);
    const [selectedApplianceType, setSelectedApplianceType] = useState<string | null>(null);
    const [showTvSizeModal, setShowTvSizeModal] = useState(false);
    const [showApplianceTypeModal, setShowApplianceTypeModal] = useState(false);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

    // Modal de visualização de mídia
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const videoRef = useRef<Video>(null);

    // Auto-preencher dimensões quando subcategoria mudar
    useEffect(() => {
        if (selectedCategory && selectedSubcategory) {
            // Verifica se é um tipo que precisa de seleção adicional
            if (selectedSubcategory === 'tv' || selectedSubcategory === 'appliances') {
                // Não auto-preenche, espera seleção específica
                return;
            }

            // Para consoles, usa dimensões da marca se disponível
            if (selectedSubcategory === 'videogame' && selectedBrand) {
                const brandDims = getBrandDimensions('videogame', selectedBrand);
                if (brandDims) {
                    applyDimensions(brandDims);
                    return;
                }
            }

            // Auto-preenche com dimensões padrão da subcategoria
            const defaultDims = getDefaultDimensions(selectedCategory, selectedSubcategory);
            if (defaultDims) {
                applyDimensions(defaultDims);
            }
        }
    }, [selectedCategory, selectedSubcategory, selectedBrand]);

    // Aplica dimensões de TV quando tamanho é selecionado
    useEffect(() => {
        if (selectedTvSize) {
            const tvDims = getBrandDimensions('tv', selectedTvSize);
            if (tvDims) {
                applyDimensions(tvDims);
            }
        }
    }, [selectedTvSize]);

    // Aplica dimensões de eletrodoméstico quando tipo é selecionado
    useEffect(() => {
        if (selectedApplianceType) {
            const appDims = getBrandDimensions('appliances', selectedApplianceType);
            if (appDims) {
                applyDimensions(appDims);
            }
        }
    }, [selectedApplianceType]);

    const applyDimensions = (dims: ProductDimensions) => {
        setWeight(dims.weight.toString());
        setHeight(dims.height.toString());
        setWidth(dims.width.toString());
        setLength(dims.length.toString());
        setDimensionsAutoFilled(true);
        setDimensionDescription(dims.description || null);
    };

    // Aplica dimensões medidas por vídeo/câmera
    const handleVideoMeasure = (dimensions: { weight: number; height: number; width: number; length: number }) => {
        setWeight(dimensions.weight.toString());
        setHeight(dimensions.height.toString());
        setWidth(dimensions.width.toString());
        setLength(dimensions.length.toString());
        setDimensionsAutoFilled(true);
        setDimensionDescription('Medido por câmera');
    };

    // Preencher formulário quando em modo de edição
    useEffect(() => {
        if (isEditMode && editObject) {
            setSelectedCategory(editObject.category);
            setSelectedSubcategory(editObject.subcategory);
            setSelectedBrand(editObject.brand || null);
            setName(editObject.name);
            setDescription(editObject.description || '');
            setIsFragile(editObject.isFragile);
            setRequiresRefrigeration(editObject.requiresRefrigeration);
            setRequiresBox(editObject.requiresSpecialCare ?? editObject.requiresBox ?? true);

            // Valor declarado
            if (editObject.declaredValue) {
                const formattedValue = editObject.declaredValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                setDeclaredValue(formattedValue);
            }

            // Dimensões
            if (editObject.weight) setWeight(editObject.weight.toString());
            if (editObject.height) setHeight(editObject.height.toString());
            if (editObject.width) setWidth(editObject.width.toString());
            if (editObject.depth) setLength(editObject.depth.toString());

            // Motorista leva caixa
            if (editObject.needsDriverBox !== undefined) {
                setNeedsDriverBox(editObject.needsDriverBox);
            }

            // Fotos e Vídeos
            const existingMedia: Media[] = [];
            if (editObject.photos && editObject.photos.length > 0) {
                editObject.photos.forEach(url => {
                    existingMedia.push({
                        uri: url.startsWith('http') ? url : `${api.defaults.baseURL}${url}`,
                        type: 'existing',
                        mediaType: 'image',
                    });
                });
            }
            if (editObject.videos && editObject.videos.length > 0) {
                editObject.videos.forEach(url => {
                    existingMedia.push({
                        uri: url.startsWith('http') ? url : `${api.defaults.baseURL}${url}`,
                        type: 'existing',
                        mediaType: 'video',
                    });
                });
            }
            setMedia(existingMedia);

            // Desabilita auto-preenchimento para não sobrescrever os valores
            setDimensionsAutoFilled(false);
        }
    }, [isEditMode, editObject]);

    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showObjectsListModal, setShowObjectsListModal] = useState(false);

    // Função para formatar valor em Real brasileiro
    const formatCurrency = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (!numbers) return '';
        const cents = parseInt(numbers, 10);
        const reais = cents / 100;
        return reais.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleDeclaredValueChange = (text: string) => {
        const formatted = formatCurrency(text);
        setDeclaredValue(formatted);
    };

    const getDeclaredValueAsNumber = (value: string): number | null => {
        if (!value) return null;
        const numStr = value.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(numStr);
        return isNaN(num) ? null : num;
    };

    const getCategoryInfo = (catId?: string | null) => {
        const id = catId || selectedCategory;
        if (!id) return null;
        return CATEGORIES[id as keyof typeof CATEGORIES];
    };

    const getSubcategoryInfo = (catId?: string | null, subId?: string | null) => {
        const cat = getCategoryInfo(catId);
        const subcatId = subId || selectedSubcategory;
        if (!cat || !subcatId) return null;
        return cat.subcategories[subcatId as keyof typeof cat.subcategories];
    };

    // Selecionar foto/vídeo da galeria
    const pickMedia = async () => {
        if (media.length >= 5) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 arquivos');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            videoMaxDuration: 30,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const isVideo = asset.type === 'video';
            setMedia([...media, {
                uri: asset.uri,
                type: 'photo',
                mediaType: isVideo ? 'video' : 'image'
            }]);
        }
    };

    // Tirar foto com a câmera
    const takePhoto = async () => {
        if (media.length >= 5) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 arquivos');
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setMedia([...media, {
                uri: result.assets[0].uri,
                type: 'photo',
                mediaType: 'image'
            }]);
        }
    };

    // Gravar vídeo com a câmera
    const recordVideo = async () => {
        if (media.length >= 5) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 arquivos');
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 0.7,
            videoMaxDuration: 30,
        });

        if (!result.canceled) {
            setMedia([...media, {
                uri: result.assets[0].uri,
                type: 'video',
                mediaType: 'video'
            }]);
        }
    };

    const removeMedia = (index: number) => {
        setMedia(media.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedBrand(null);
        setName('');
        setDescription('');
        setDeclaredValue('');
        setIsFragile(false);
        setRequiresRefrigeration(false);
        setRequiresBox(true);
        setNeedsDriverBox(false);
        setMedia([]);
        setWeight('');
        setHeight('');
        setWidth('');
        setLength('');
        setDimensionsAutoFilled(false);
        setDimensionDescription(null);
        setSelectedTvSize(null);
        setSelectedApplianceType(null);
    };

    const calculateVolume = (): number => {
        const h = parseFloat(height) || 0;
        const w = parseFloat(width) || 0;
        const l = parseFloat(length) || 0;
        return h * w * l;
    };

    const validateForm = (): boolean => {
        if (!selectedCategory) {
            Alert.alert('Atenção', 'Selecione uma categoria');
            return false;
        }
        if (!selectedSubcategory) {
            Alert.alert('Atenção', 'Selecione uma subcategoria');
            return false;
        }
        if (!name.trim()) {
            Alert.alert('Atenção', 'Informe o nome do objeto');
            return false;
        }
        return true;
    };

    // Salvar edição diretamente (modo edição)
    const handleSaveEdit = async () => {
        if (!validateForm()) return;
        if (!editObject) return;

        setLoading(true);

        try {
            // Upload de novas mídias (fotos e vídeos)
            let uploadedPhotoUrls: string[] = [];
            let uploadedVideoUrls: string[] = [];

            for (const item of media) {
                if (item.type === 'existing') {
                    // Mídia já existente, mantém a URL original
                    const originalUrl = item.uri.replace(api.defaults.baseURL || '', '');
                    if (item.mediaType === 'video') {
                        uploadedVideoUrls.push(originalUrl);
                    } else {
                        uploadedPhotoUrls.push(originalUrl);
                    }
                } else {
                    // Nova mídia, faz upload
                    const formData = new FormData();
                    const isVideo = item.mediaType === 'video';
                    const ext = isVideo ? 'mp4' : 'jpg';
                    const filename = item.uri.split('/').pop() || `${isVideo ? 'video' : 'photo'}_${Date.now()}.${ext}`;
                    const type = isVideo ? 'video/mp4' : 'image/jpeg';

                    formData.append('file', {
                        uri: item.uri,
                        name: filename,
                        type,
                    } as any);

                    try {
                        const uploadResponse = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        if (uploadResponse.data?.url) {
                            if (isVideo) {
                                uploadedVideoUrls.push(uploadResponse.data.url);
                            } else {
                                uploadedPhotoUrls.push(uploadResponse.data.url);
                            }
                        }
                    } catch (uploadError) {
                        console.log('Erro ao fazer upload:', uploadError);
                    }
                }
            }

            // Atualizar objeto
            const objectData = {
                name,
                description: description || undefined,
                category: selectedCategory,
                subcategory: selectedSubcategory,
                brand: selectedBrand || undefined,
                declaredValue: getDeclaredValueAsNumber(declaredValue) || undefined,
                isFragile,
                requiresRefrigeration,
                requiresSpecialCare: requiresBox,
                needsDriverBox,
                photos: uploadedPhotoUrls,
                videos: uploadedVideoUrls,
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                width: width ? parseFloat(width) : undefined,
                depth: length ? parseFloat(length) : undefined,
            };

            await api.put(`/objects/${editObject.id}`, objectData);

            Alert.alert(
                'Sucesso!',
                'Objeto atualizado com sucesso!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.log('Erro ao atualizar objeto:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o objeto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Adicionar objeto à lista
    const handleAddToList = () => {
        if (!validateForm()) return;

        const newObject: ObjectItem = {
            id: Date.now().toString(),
            name,
            description,
            category: selectedCategory!,
            subcategory: selectedSubcategory!,
            brand: selectedBrand,
            declaredValue,
            isFragile,
            requiresRefrigeration,
            requiresBox,
            needsDriverBox,
            media: [...media],
            weight,
            height,
            width,
            length,
        };

        setObjectsList([...objectsList, newObject]);
        resetForm();

        Alert.alert(
            'Objeto adicionado!',
            `${newObject.name} foi adicionado à lista. Você tem ${objectsList.length + 1} objeto(s) na lista.`,
            [
                { text: 'Adicionar mais', style: 'default' },
                { text: 'Ver lista', onPress: () => setShowObjectsListModal(true) },
            ]
        );
    };

    // Remover objeto da lista
    const removeFromList = (id: string) => {
        setObjectsList(objectsList.filter(obj => obj.id !== id));
    };

    // Salvar todos os objetos
    const handleSaveAll = async () => {
        if (objectsList.length === 0) {
            Alert.alert('Atenção', 'Adicione pelo menos um objeto à lista antes de salvar.');
            return;
        }

        setLoading(true);
        setShowObjectsListModal(false);

        try {
            let savedCount = 0;
            let errorCount = 0;

            for (const obj of objectsList) {
                try {
                    // Upload das mídias (fotos e vídeos)
                    let uploadedPhotoUrls: string[] = [];
                    let uploadedVideoUrls: string[] = [];

                    if (obj.media.length > 0) {
                        for (const item of obj.media) {
                            const formData = new FormData();
                            const isVideo = item.mediaType === 'video';
                            const ext = isVideo ? 'mp4' : 'jpg';
                            const filename = item.uri.split('/').pop() || `${isVideo ? 'video' : 'photo'}_${Date.now()}.${ext}`;
                            const type = isVideo ? 'video/mp4' : 'image/jpeg';

                            formData.append('file', {
                                uri: item.uri,
                                name: filename,
                                type,
                            } as any);

                            try {
                                const uploadResponse = await api.post('/upload', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                });
                                if (uploadResponse.data?.url) {
                                    if (isVideo) {
                                        uploadedVideoUrls.push(uploadResponse.data.url);
                                    } else {
                                        uploadedPhotoUrls.push(uploadResponse.data.url);
                                    }
                                }
                            } catch (uploadError) {
                                console.log('Erro ao fazer upload:', uploadError);
                            }
                        }
                    }

                    // Criar objeto
                    const objectData = {
                        name: obj.name,
                        description: obj.description || undefined,
                        category: obj.category,
                        subcategory: obj.subcategory,
                        brand: obj.brand || undefined,
                        declaredValue: getDeclaredValueAsNumber(obj.declaredValue) || undefined,
                        isFragile: obj.isFragile,
                        requiresRefrigeration: obj.requiresRefrigeration,
                        requiresSpecialCare: obj.requiresBox,
                        needsDriverBox: obj.needsDriverBox,
                        photos: uploadedPhotoUrls,
                        videos: uploadedVideoUrls,
                        weight: obj.weight ? parseFloat(obj.weight) : undefined,
                        height: obj.height ? parseFloat(obj.height) : undefined,
                        width: obj.width ? parseFloat(obj.width) : undefined,
                        depth: obj.length ? parseFloat(obj.length) : undefined,
                    };

                    console.log('[AddObjectScreen] Salvando objeto:', objectData.name);
                    const response = await api.post('/objects', objectData);
                    console.log('[AddObjectScreen] Objeto salvo com sucesso:', response.data?.id);
                    savedCount++;
                } catch (error: any) {
                    console.log('[AddObjectScreen] Erro ao salvar objeto:', obj.name, error?.response?.data || error?.message);
                    errorCount++;
                }
            }

            if (errorCount === 0) {
                Alert.alert(
                    'Sucesso!',
                    `${savedCount} objeto(s) cadastrado(s) com sucesso!`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(
                    'Atenção',
                    `${savedCount} objeto(s) salvo(s), ${errorCount} erro(s).`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }

            setObjectsList([]);
        } catch (error: any) {
            console.log('Erro geral ao salvar objetos:', error);
            Alert.alert('Erro', 'Não foi possível salvar os objetos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Calcular valor total
    const getTotalValue = () => {
        let total = 0;
        for (const obj of objectsList) {
            const value = getDeclaredValueAsNumber(obj.declaredValue);
            if (value) total += value;
        }
        return total.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const renderObjectListItem = ({ item }: { item: ObjectItem }) => {
        const catInfo = getCategoryInfo(item.category);
        const subInfo = getSubcategoryInfo(item.category, item.subcategory);

        return (
            <View style={styles.listItem}>
                <View style={styles.listItemLeft}>
                    <View style={styles.listItemIcon}>
                        <Ionicons
                            name={(subInfo?.icon || catInfo?.icon || 'cube-outline') as any}
                            size={24}
                            color="#4facfe"
                        />
                    </View>
                    <View style={styles.listItemInfo}>
                        <Text style={styles.listItemName}>{item.name}</Text>
                        <Text style={styles.listItemCategory}>
                            {catInfo?.label} • {subInfo?.label}
                        </Text>
                        {item.declaredValue ? (
                            <Text style={styles.listItemValue}>R$ {item.declaredValue}</Text>
                        ) : null}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.listItemRemove}
                    onPress={() => removeFromList(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditMode ? 'Editar Objeto' : 'Cadastrar Objetos'}
                </Text>
                {!isEditMode && objectsList.length > 0 ? (
                    <TouchableOpacity
                        style={styles.listBadgeButton}
                        onPress={() => setShowObjectsListModal(true)}
                    >
                        <Ionicons name="list" size={20} color="#4facfe" />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{objectsList.length}</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Categoria */}
                <Text style={styles.label}>Categoria *</Text>
                <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <View style={styles.selectorContent}>
                        {selectedCategory ? (
                            <>
                                <Ionicons
                                    name={getCategoryInfo()?.icon as any}
                                    size={22}
                                    color="#4facfe"
                                />
                                <Text style={styles.selectorText}>{getCategoryInfo()?.label}</Text>
                            </>
                        ) : (
                            <Text style={styles.selectorPlaceholder}>Selecione a categoria</Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Subcategoria */}
                {selectedCategory && (
                    <>
                        <Text style={styles.label}>Tipo *</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowSubcategoryModal(true)}
                        >
                            <View style={styles.selectorContent}>
                                {selectedSubcategory ? (
                                    <>
                                        <Ionicons
                                            name={getSubcategoryInfo()?.icon as any}
                                            size={22}
                                            color="#4facfe"
                                        />
                                        <Text style={styles.selectorText}>{getSubcategoryInfo()?.label}</Text>
                                    </>
                                ) : (
                                    <Text style={styles.selectorPlaceholder}>Selecione o tipo</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </>
                )}

                {/* Marca (para eletrônicos) */}
                {selectedCategory === 'electronics' && selectedSubcategory && (getSubcategoryInfo() as any)?.brands?.length > 0 && (
                    <>
                        <Text style={styles.label}>Marca</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowBrandModal(true)}
                        >
                            <View style={styles.selectorContent}>
                                {selectedBrand ? (
                                    <Text style={styles.selectorText}>{selectedBrand}</Text>
                                ) : (
                                    <Text style={styles.selectorPlaceholder}>Selecione a marca</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </>
                )}

                {/* Nome */}
                <Text style={styles.label}>Nome do Objeto *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: TV Samsung 55 polegadas"
                    value={name}
                    onChangeText={setName}
                />

                {/* Descrição */}
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detalhes sobre o objeto (opcional)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                />

                {/* Valor declarado */}
                <Text style={styles.label}>Valor declarado para seguro (Opcional)</Text>
                <View style={styles.valueInputContainer}>
                    <Text style={styles.currencyPrefix}>R$</Text>
                    <TextInput
                        style={styles.valueInput}
                        placeholder="0,00"
                        value={declaredValue}
                        onChangeText={handleDeclaredValueChange}
                        keyboardType="numeric"
                    />
                </View>

                {/* Seletor específico para TV */}
                {selectedSubcategory === 'tv' && (
                    <>
                        <Text style={styles.label}>Tamanho da TV *</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowTvSizeModal(true)}
                        >
                            <View style={styles.selectorContent}>
                                {selectedTvSize ? (
                                    <>
                                        <Ionicons name="tv-outline" size={22} color="#4facfe" />
                                        <Text style={styles.selectorText}>{selectedTvSize} polegadas</Text>
                                    </>
                                ) : (
                                    <Text style={styles.selectorPlaceholder}>Selecione o tamanho</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </>
                )}

                {/* Seletor específico para Eletrodomésticos */}
                {selectedSubcategory === 'appliances' && (
                    <>
                        <Text style={styles.label}>Tipo de Eletrodoméstico *</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowApplianceTypeModal(true)}
                        >
                            <View style={styles.selectorContent}>
                                {selectedApplianceType ? (
                                    <>
                                        <Ionicons name="home-outline" size={22} color="#4facfe" />
                                        <Text style={styles.selectorText}>
                                            {APPLIANCE_TYPES.find(a => a.id === selectedApplianceType)?.label}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.selectorPlaceholder}>Selecione o tipo</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </>
                )}

                {/* Dimensões e Peso */}
                <View style={styles.dimensionsSection}>
                    <View style={styles.dimensionsHeader}>
                        <Text style={styles.label}>Dimensões e Peso</Text>
                        <TouchableOpacity
                            style={styles.videoDimensionButton}
                            onPress={() => setShowVideoDimensionModal(true)}
                        >
                            <Ionicons name="videocam" size={18} color="#4facfe" />
                            <Text style={styles.videoDimensionText}>Medir por vídeo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Indicador de auto-preenchimento */}
                    {dimensionsAutoFilled && dimensionDescription && (
                        <View style={styles.autoFilledBanner}>
                            <Ionicons name="sparkles" size={16} color="#00a040" />
                            <Text style={styles.autoFilledText}>
                                Preenchido automaticamente: {dimensionDescription}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setDimensionsAutoFilled(false);
                                    setDimensionDescription(null);
                                }}
                            >
                                <Text style={styles.autoFilledEdit}>Editar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.dimensionsRow}>
                        <View style={styles.dimensionField}>
                            <Text style={styles.dimensionLabel}>Peso</Text>
                            <View style={[
                                styles.dimensionInputContainer,
                                dimensionsAutoFilled && styles.dimensionInputAutoFilled
                            ]}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    placeholder="0"
                                    value={weight}
                                    onChangeText={(text) => {
                                        setWeight(text);
                                        setDimensionsAutoFilled(false);
                                    }}
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.dimensionUnit}>kg</Text>
                            </View>
                        </View>
                        <View style={styles.dimensionField}>
                            <Text style={styles.dimensionLabel}>Altura</Text>
                            <View style={[
                                styles.dimensionInputContainer,
                                dimensionsAutoFilled && styles.dimensionInputAutoFilled
                            ]}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    placeholder="0"
                                    value={height}
                                    onChangeText={(text) => {
                                        setHeight(text);
                                        setDimensionsAutoFilled(false);
                                    }}
                                    keyboardType="number-pad"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.dimensionsRow}>
                        <View style={styles.dimensionField}>
                            <Text style={styles.dimensionLabel}>Largura</Text>
                            <View style={[
                                styles.dimensionInputContainer,
                                dimensionsAutoFilled && styles.dimensionInputAutoFilled
                            ]}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    placeholder="0"
                                    value={width}
                                    onChangeText={(text) => {
                                        setWidth(text);
                                        setDimensionsAutoFilled(false);
                                    }}
                                    keyboardType="number-pad"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                        <View style={styles.dimensionField}>
                            <Text style={styles.dimensionLabel}>Comprimento</Text>
                            <View style={[
                                styles.dimensionInputContainer,
                                dimensionsAutoFilled && styles.dimensionInputAutoFilled
                            ]}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    placeholder="0"
                                    value={length}
                                    onChangeText={(text) => {
                                        setLength(text);
                                        setDimensionsAutoFilled(false);
                                    }}
                                    keyboardType="number-pad"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                    </View>

                    {calculateVolume() > 0 && (
                        <View style={styles.volumeInfoContainer}>
                            <View style={styles.volumeInfoRow}>
                                <Ionicons name="cube-outline" size={16} color="#4facfe" />
                                <Text style={styles.volumeInfo}>
                                    Volume: {formatVolume(parseFloat(height) || 0, parseFloat(width) || 0, parseFloat(length) || 0)}
                                </Text>
                            </View>
                            {parseFloat(weight) > 0 && (
                                <View style={styles.volumeInfoRow}>
                                    <Ionicons name="scale-outline" size={16} color="#4facfe" />
                                    <Text style={styles.volumeInfo}>
                                        Peso: {parseFloat(weight).toFixed(1)} kg
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Características */}
                <Text style={styles.label}>Características</Text>
                <View style={styles.switchContainer}>
                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <Ionicons name="cube-outline" size={22} color="#4facfe" />
                            <View style={styles.switchLabelContainer}>
                                <Text style={styles.switchLabel}>Vai em caixa</Text>
                                <Text style={styles.switchHint}>O objeto será enviado em uma caixa</Text>
                            </View>
                        </View>
                        <Switch
                            value={requiresBox}
                            onValueChange={setRequiresBox}
                            trackColor={{ false: '#e1e1e1', true: '#4facfe' }}
                            thumbColor="#fff"
                        />
                    </View>
                    {requiresBox && (
                        <View style={[styles.switchRow, styles.switchRowIndented]}>
                            <View style={styles.switchInfo}>
                                <Ionicons name="car-outline" size={22} color="#ff9500" />
                                <View style={styles.switchLabelContainer}>
                                    <Text style={styles.switchLabel}>Motorista leva caixa</Text>
                                    <Text style={styles.switchHint}>O motorista deve levar a caixa para embalar</Text>
                                </View>
                            </View>
                            <Switch
                                value={needsDriverBox}
                                onValueChange={setNeedsDriverBox}
                                trackColor={{ false: '#e1e1e1', true: '#ff9500' }}
                                thumbColor="#fff"
                            />
                        </View>
                    )}
                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <Ionicons name="alert-circle-outline" size={22} color="#ff6b6b" />
                            <Text style={styles.switchLabel}>Frágil</Text>
                        </View>
                        <Switch
                            value={isFragile}
                            onValueChange={setIsFragile}
                            trackColor={{ false: '#e1e1e1', true: '#ff6b6b' }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <Ionicons name="snow-outline" size={22} color="#4facfe" />
                            <Text style={styles.switchLabel}>Requer refrigeração</Text>
                        </View>
                        <Switch
                            value={requiresRefrigeration}
                            onValueChange={setRequiresRefrigeration}
                            trackColor={{ false: '#e1e1e1', true: '#4facfe' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Fotos e Vídeos */}
                <Text style={styles.label}>Fotos e Vídeos</Text>
                <Text style={styles.labelHint}>Adicione até 5 fotos ou vídeos (máx. 30s)</Text>
                <View style={styles.photosContainer}>
                    {media.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.photoItem}
                            onPress={() => {
                                setSelectedMedia(item);
                                setShowMediaModal(true);
                            }}
                            activeOpacity={0.8}
                        >
                            <Image source={{ uri: item.uri }} style={styles.photoImage} />
                            {item.mediaType === 'video' && (
                                <View style={styles.videoIndicator}>
                                    <Ionicons name="play-circle" size={28} color="#fff" />
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.removePhotoButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    removeMedia(index);
                                }}
                            >
                                <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                    {media.length < 5 && (
                        <View style={styles.addPhotoButtons}>
                            <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                                <Ionicons name="camera" size={24} color="#4facfe" />
                                <Text style={styles.addPhotoText}>Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addPhotoButton} onPress={recordVideo}>
                                <Ionicons name="videocam" size={24} color="#ff6b6b" />
                                <Text style={styles.addPhotoText}>Vídeo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addPhotoButton} onPress={pickMedia}>
                                <Ionicons name="images" size={24} color="#4facfe" />
                                <Text style={styles.addPhotoText}>Galeria</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ height: 200 }} />
            </ScrollView>

            {/* Footer com botões */}
            <View style={styles.footer}>
                {isEditMode ? (
                    // Modo de edição - apenas botão de salvar
                    <TouchableOpacity
                        style={[styles.saveButton, styles.saveButtonFull, loading && styles.saveButtonDisabled]}
                        onPress={handleSaveEdit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    // Modo de criação - botões de adicionar à lista e salvar
                    <>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddToList}
                        >
                            <Ionicons name="add" size={20} color="#4facfe" />
                            <Text style={styles.addButtonText}>Adicionar à Lista</Text>
                        </TouchableOpacity>

                        {objectsList.length > 0 && (
                            <TouchableOpacity
                                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                                onPress={handleSaveAll}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text style={styles.saveButtonText}>
                                            Salvar {objectsList.length} Objeto(s)
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>

            {/* Modal Lista de Objetos */}
            <Modal visible={showObjectsListModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.objectsModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Objetos na Lista</Text>
                            <TouchableOpacity onPress={() => setShowObjectsListModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={objectsList}
                            keyExtractor={(item) => item.id}
                            renderItem={renderObjectListItem}
                            ListEmptyComponent={
                                <View style={styles.emptyList}>
                                    <Ionicons name="cube-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyListText}>Nenhum objeto adicionado</Text>
                                </View>
                            }
                        />

                        {objectsList.length > 0 && (
                            <View style={styles.modalFooter}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Valor Total:</Text>
                                    <Text style={styles.totalValue}>R$ {getTotalValue()}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.saveAllButton, loading && styles.saveButtonDisabled]}
                                    onPress={handleSaveAll}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                            <Text style={styles.saveAllButtonText}>
                                                Salvar Todos ({objectsList.length})
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal Categorias */}
            <Modal visible={showCategoryModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Tipo</Text>
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Marca</Text>
                            <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {(getSubcategoryInfo() as any)?.brands?.map((brand: string) => (
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

            {/* Modal Tamanho TV */}
            <Modal visible={showTvSizeModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tamanho da TV</Text>
                            <TouchableOpacity onPress={() => setShowTvSizeModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {TV_SIZES.map((size) => {
                                const dims = getBrandDimensions('tv', size);
                                return (
                                    <TouchableOpacity
                                        key={size}
                                        style={[
                                            styles.optionItem,
                                            selectedTvSize === size && styles.optionItemActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedTvSize(size);
                                            setShowTvSizeModal(false);
                                        }}
                                    >
                                        <Ionicons
                                            name="tv-outline"
                                            size={24}
                                            color={selectedTvSize === size ? '#4facfe' : '#666'}
                                        />
                                        <View style={styles.optionTextContainer}>
                                            <Text style={[
                                                styles.optionText,
                                                selectedTvSize === size && styles.optionTextActive,
                                            ]}>{size} polegadas</Text>
                                            {dims && (
                                                <Text style={styles.optionSubtext}>
                                                    ~{dims.weight}kg • {dims.height}x{dims.width}cm
                                                </Text>
                                            )}
                                        </View>
                                        {selectedTvSize === size && (
                                            <Ionicons name="checkmark-circle" size={22} color="#4facfe" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Tipo Eletrodoméstico */}
            <Modal visible={showApplianceTypeModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tipo de Eletrodoméstico</Text>
                            <TouchableOpacity onPress={() => setShowApplianceTypeModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {APPLIANCE_TYPES.map((appliance) => {
                                const dims = getBrandDimensions('appliances', appliance.id);
                                return (
                                    <TouchableOpacity
                                        key={appliance.id}
                                        style={[
                                            styles.optionItem,
                                            selectedApplianceType === appliance.id && styles.optionItemActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedApplianceType(appliance.id);
                                            setShowApplianceTypeModal(false);
                                        }}
                                    >
                                        <Ionicons
                                            name="home-outline"
                                            size={24}
                                            color={selectedApplianceType === appliance.id ? '#4facfe' : '#666'}
                                        />
                                        <View style={styles.optionTextContainer}>
                                            <Text style={[
                                                styles.optionText,
                                                selectedApplianceType === appliance.id && styles.optionTextActive,
                                            ]}>{appliance.label}</Text>
                                            {dims && (
                                                <Text style={styles.optionSubtext}>
                                                    ~{dims.weight}kg • {dims.height}x{dims.width}x{dims.length}cm
                                                </Text>
                                            )}
                                        </View>
                                        {selectedApplianceType === appliance.id && (
                                            <Ionicons name="checkmark-circle" size={22} color="#4facfe" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Componente de Medição por Vídeo */}
            <VideoDimensionMeasure
                visible={showVideoDimensionModal}
                onClose={() => setShowVideoDimensionModal(false)}
                onMeasure={handleVideoMeasure}
            />

            {/* Modal de Visualização de Mídia */}
            <Modal
                visible={showMediaModal}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setShowMediaModal(false);
                    setSelectedMedia(null);
                }}
            >
                <View style={styles.mediaModalOverlay}>
                    <TouchableOpacity
                        style={styles.mediaModalClose}
                        onPress={() => {
                            setShowMediaModal(false);
                            setSelectedMedia(null);
                        }}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>

                    {selectedMedia && (
                        <View style={styles.mediaModalContent}>
                            {selectedMedia.mediaType === 'video' ? (
                                <Video
                                    ref={videoRef}
                                    source={{ uri: selectedMedia.uri }}
                                    style={styles.mediaModalVideo}
                                    useNativeControls
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay
                                    isLooping={false}
                                />
                            ) : (
                                <Image
                                    source={{ uri: selectedMedia.uri }}
                                    style={styles.mediaModalImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    listBadgeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    badge: {
        backgroundColor: '#ff4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -8,
        marginTop: -8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    labelHint: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
        marginTop: -4,
    },
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
    input: {
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
    switchContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
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
        flex: 1,
    },
    switchLabel: {
        fontSize: 15,
        color: '#333',
    },
    switchLabelContainer: {
        flex: 1,
        flexShrink: 1,
    },
    switchHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    switchRowIndented: {
        marginLeft: 34,
        backgroundColor: '#fff8f0',
        borderRadius: 8,
        marginBottom: 4,
    },
    videoIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoItem: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#ff4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    addPhotoText: {
        fontSize: 12,
        color: '#4facfe',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 100,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    addButton: {
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
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4facfe',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonFull: {
        flex: 1,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
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
        maxHeight: '70%',
    },
    objectsModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '50%',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    saveAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveAllButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
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
    // Lista de objetos
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    listItemIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#e8f4fe',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listItemInfo: {
        flex: 1,
    },
    listItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    listItemCategory: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    listItemValue: {
        fontSize: 14,
        color: '#4facfe',
        fontWeight: '600',
        marginTop: 4,
    },
    listItemRemove: {
        padding: 8,
    },
    emptyList: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyListText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
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
        fontWeight: '500',
        marginLeft: 6,
    },
    volumeInfoContainer: {
        backgroundColor: '#e8f4fe',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
    },
    volumeInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    // Auto-fill styles
    autoFilledBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    autoFilledText: {
        flex: 1,
        fontSize: 12,
        color: '#00a040',
    },
    autoFilledEdit: {
        fontSize: 12,
        color: '#4facfe',
        fontWeight: '600',
    },
    dimensionInputAutoFilled: {
        borderColor: '#00f260',
        backgroundColor: '#f8fff8',
    },
    // Option text container
    optionTextContainer: {
        flex: 1,
    },
    optionSubtext: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    // Media modal styles
    mediaModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    mediaModalContent: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaModalImage: {
        width: '100%',
        height: '100%',
    },
    mediaModalVideo: {
        width: '100%',
        height: '100%',
    },
});
