import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api, { getFullImageUrl } from '../services/api';
import { uploadImage } from '../services/upload';
import SearchableSelect from '../components/SearchableSelect';
import LanguageSelector from '../components/LanguageSelector';
import {
    carBrands,
    vanBrands,
    truckBrands,
    motorcycleBrands,
    getModelsByBrand,
    getBrandLabel,
    getModelLabel
} from '../data/vehicleData';

interface VehicleInfo {
    brand: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    type: string;
    photo: string | null;
    crlvPhoto: string | null;
}

interface DocumentsInfo {
    cnhFront: string | null;
    cnhBack: string | null;
}

interface DriverInfo {
    cnh: string;
    cnhCategory: string;
    cnhExpiry: string;
    vehicle: VehicleInfo;
    documents: DocumentsInfo;
}

export default function ProfileScreen() {
    const { user, signOut, updateUser } = useAuth();
    const { t } = useLanguage();

    const VEHICLE_TYPES = [
        { id: 'car', label: t('vehicle.car'), icon: 'car-outline' },
        { id: 'van', label: t('vehicle.van'), icon: 'bus-outline' },
        { id: 'truck', label: t('vehicle.truck'), icon: 'cube-outline' },
        { id: 'motorcycle', label: t('vehicle.motorcycle'), icon: 'bicycle-outline' },
    ];
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [savingVehicle, setSavingVehicle] = useState(false);
    const [vehicleStatus, setVehicleStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
    const [vehicleAdminMessage, setVehicleAdminMessage] = useState<string | null>(null);

    const isDriver = user?.userType === 'driver';
    const isVehiclePending = vehicleStatus === 'PENDING';
    const isVehicleEditable = vehicleStatus !== 'PENDING';

    // Seleciona a lista de marcas baseada no tipo de veículo
    const availableBrands = useMemo(() => {
        switch (driverInfo.vehicle.type) {
            case 'car':
                return carBrands;
            case 'van':
                return vanBrands;
            case 'truck':
                return truckBrands;
            case 'motorcycle':
                return motorcycleBrands;
            default:
                return carBrands;
        }
    }, [driverInfo.vehicle.type]);

    // Campos comuns (cliente e motorista)
    const [name, setName] = useState(user?.name || '');
    const [birthDate, setBirthDate] = useState(user?.birthDate || '');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(
        user?.profilePhoto || null
    );

    // Campos exclusivos do motorista
    const [driverInfo, setDriverInfo] = useState<DriverInfo>({
        cnh: '',
        cnhCategory: 'B',
        cnhExpiry: '',
        vehicle: {
            brand: '',
            model: '',
            year: '',
            color: '',
            licensePlate: '',
            type: 'car',
            photo: null,
            crlvPhoto: null,
        },
        documents: {
            cnhFront: null,
            cnhBack: null,
        },
    });

    // Recarrega dados do motorista sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            if (isDriver) {
                loadDriverInfo();
            }
        }, [isDriver])
    );

    async function loadDriverInfo() {
        setLoading(true);
        try {
            // Tenta carregar dados do perfil e veículos em paralelo
            const [profileResponse, vehiclesResponse] = await Promise.allSettled([
                api.get('/auth/profile'),
                api.get('/vehicles/my-vehicles'),
            ]);

            // Processar dados do perfil
            if (profileResponse.status === 'fulfilled' && profileResponse.value.data) {
                const data = profileResponse.value.data;
                // Converte URLs relativas para completas
                const cnhFrontUrl = getFullImageUrl(data.documentFront);
                const cnhBackUrl = getFullImageUrl(data.documentBack);
                setDriverInfo(prev => ({
                    ...prev,
                    cnh: data.cnh || '',
                    cnhCategory: data.cnhCategory || 'B',
                    cnhExpiry: data.cnhExpiry || '',
                    documents: {
                        cnhFront: cnhFrontUrl,
                        cnhBack: cnhBackUrl,
                    },
                }));
            }

            // Processar veículos
            if (vehiclesResponse.status === 'fulfilled' && vehiclesResponse.value.data?.length > 0) {
                const vehicle = vehiclesResponse.value.data[0]; // Primeiro veículo
                // Os dados extras estão no campo documents (JSON)
                const docs = vehicle.documents || {};
                // Converte as URLs relativas para completas
                const photoUrl = getFullImageUrl(docs.photo);
                const crlvPhotoUrl = getFullImageUrl(docs.crlvPhoto);
                setDriverInfo(prev => ({
                    ...prev,
                    vehicle: {
                        brand: docs.brand || '',
                        model: docs.model || '',
                        year: docs.year?.toString() || '',
                        color: docs.color || '',
                        licensePlate: vehicle.plate || '',
                        type: (docs.type || 'car').toLowerCase(),
                        photo: photoUrl,
                        crlvPhoto: crlvPhotoUrl,
                    },
                }));
                // Armazena o status do veículo (normaliza para uppercase)
                const status = vehicle.status?.toUpperCase();
                setVehicleStatus(status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED' ? status : null);
                // Armazena a mensagem do admin (se houver)
                setVehicleAdminMessage(vehicle.adminNotes || vehicle.rejectionReason || null);

                console.log('Vehicle status loaded:', status);
            } else {
                // Se não tem veículo, permite cadastrar (não está pendente)
                setVehicleStatus(null);
                setVehicleAdminMessage(null);
            }
        } catch (error: any) {
            // Silencia erros - dados podem não existir ainda
            console.log('Info: Dados do motorista ainda não cadastrados');
        } finally {
            setLoading(false);
        }
    }

    const [savingPhoto, setSavingPhoto] = useState(false);

    async function pickImage(type: 'profile' | 'vehicle' | 'crlv' | 'cnhFront' | 'cnhBack') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('permissions.gallery'),
                t('permissions.galleryMessage')
            );
            return;
        }

        // Define o aspect ratio baseado no tipo
        let aspect: [number, number] = [4, 3];
        if (type === 'profile') {
            aspect = [1, 1];
        } else if (type === 'cnhFront' || type === 'cnhBack' || type === 'crlv') {
            aspect = [3, 2]; // Formato mais comum para documentos
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            const base64Image = result.assets[0].base64
                ? `data:image/jpeg;base64,${result.assets[0].base64}`
                : imageUri;

            switch (type) {
                case 'profile':
                    setProfilePhoto(imageUri);
                    // Salva automaticamente a foto de perfil
                    await saveProfilePhoto(base64Image);
                    break;
                case 'vehicle':
                    setDriverInfo({
                        ...driverInfo,
                        vehicle: { ...driverInfo.vehicle, photo: imageUri },
                    });
                    break;
                case 'crlv':
                    setDriverInfo({
                        ...driverInfo,
                        vehicle: { ...driverInfo.vehicle, crlvPhoto: imageUri },
                    });
                    break;
                case 'cnhFront':
                    setDriverInfo({
                        ...driverInfo,
                        documents: { ...driverInfo.documents, cnhFront: imageUri },
                    });
                    break;
                case 'cnhBack':
                    setDriverInfo({
                        ...driverInfo,
                        documents: { ...driverInfo.documents, cnhBack: imageUri },
                    });
                    break;
            }
        }
    }

    async function saveProfilePhoto(photoData: string) {
        setSavingPhoto(true);
        try {
            await updateUser({ profilePhoto: photoData });
            Alert.alert(t('common.success'), t('profile.photoUpdated'));
        } catch (error: any) {
            console.log('Erro ao salvar foto:', error);
            Alert.alert(t('common.error'), t('profile.photoError'));
            // Reverte para a foto anterior se falhar
            setProfilePhoto(user?.profilePhoto || null);
        } finally {
            setSavingPhoto(false);
        }
    }

    function handleDateChange(event: any, selectedDate?: Date) {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toLocaleDateString('pt-BR');
            setBirthDate(formattedDate);
        }
    }

    function parseDateString(dateString: string): Date {
        if (!dateString) return new Date();
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return new Date(
                parseInt(parts[2]),
                parseInt(parts[1]) - 1,
                parseInt(parts[0])
            );
        }
        return new Date();
    }

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert(t('common.attention'), t('common.required'));
            return;
        }

        setSaving(true);
        try {
            // Atualiza dados basicos do usuario
            await updateUser({
                name,
                birthDate,
                profilePhoto,
            });

            // Se for motorista, atualiza dados adicionais
            if (isDriver) {
                await api.put('/drivers/profile', driverInfo);
            }

            Alert.alert(t('common.success'), t('profile.profileUpdated'));
        } catch (error) {
            Alert.alert(t('common.error'), t('profile.profileError'));
        } finally {
            setSaving(false);
        }
    }

    function handleLogout() {
        Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('auth.logout'), style: 'destructive', onPress: signOut },
        ]);
    }

    async function handleSaveVehicle() {
        const { brand, model, year, color, licensePlate } = driverInfo.vehicle;

        if (!brand || !model || !year || !licensePlate) {
            Alert.alert(t('common.attention'), t('vehicle.requiredFields'));
            return;
        }

        setSavingVehicle(true);
        try {
            // Upload da foto do veiculo se for um arquivo local
            let vehiclePhotoUrl = driverInfo.vehicle.photo;
            if (vehiclePhotoUrl && vehiclePhotoUrl.startsWith('file://')) {
                console.log('[ProfileScreen] Fazendo upload da foto do veiculo...');
                vehiclePhotoUrl = await uploadImage(vehiclePhotoUrl, 'vehicles');
                console.log('[ProfileScreen] Foto do veiculo enviada:', vehiclePhotoUrl);
            }

            // Upload do CRLV se for um arquivo local
            let crlvPhotoUrl = driverInfo.vehicle.crlvPhoto;
            if (crlvPhotoUrl && crlvPhotoUrl.startsWith('file://')) {
                console.log('[ProfileScreen] Fazendo upload do CRLV...');
                crlvPhotoUrl = await uploadImage(crlvPhotoUrl, 'documents');
                console.log('[ProfileScreen] CRLV enviado:', crlvPhotoUrl);
            }

            // Envia tanto o value quanto o label para o backend
            await api.put('/vehicles/my-vehicle', {
                brand: driverInfo.vehicle.brand, // Value (ex: 'FIAT')
                brandLabel: getBrandLabel(driverInfo.vehicle.brand), // Label (ex: 'Fiat')
                model: driverInfo.vehicle.model, // Value (ex: 'FIAT_STRADA')
                modelLabel: getModelLabel(driverInfo.vehicle.model), // Label (ex: 'Strada')
                year: parseInt(driverInfo.vehicle.year),
                color: driverInfo.vehicle.color,
                plate: driverInfo.vehicle.licensePlate,
                type: driverInfo.vehicle.type?.toUpperCase() || 'CAR',
                photo: vehiclePhotoUrl,
                crlvPhoto: crlvPhotoUrl,
            });
            // Define o status como PENDING após salvar
            setVehicleStatus('PENDING');
            Alert.alert(
                t('vehicle.sentForValidation'),
                t('vehicle.sentForValidationMessage')
            );
        } catch (error: any) {
            console.log('Erro ao salvar veiculo:', error.response?.data);
            const errorMessage = error.response?.data?.message || t('vehicle.saveError');
            Alert.alert(t('common.error'), errorMessage);
        } finally {
            setSavingVehicle(false);
        }
    }

    const [savingDocuments, setSavingDocuments] = useState(false);

    async function handleSaveDocuments() {
        const { cnhFront, cnhBack } = driverInfo.documents;

        if (!cnhFront || !cnhBack) {
            Alert.alert(t('common.attention'), t('documents.requiredFields'));
            return;
        }

        setSavingDocuments(true);
        try {
            // Upload da frente da CNH se for arquivo local
            let cnhFrontUrl = cnhFront;
            if (cnhFrontUrl && cnhFrontUrl.startsWith('file://')) {
                console.log('[ProfileScreen] Fazendo upload da frente da CNH...');
                cnhFrontUrl = await uploadImage(cnhFrontUrl, 'documents');
                console.log('[ProfileScreen] Frente da CNH enviada:', cnhFrontUrl);
            }

            // Upload do verso da CNH se for arquivo local
            let cnhBackUrl = cnhBack;
            if (cnhBackUrl && cnhBackUrl.startsWith('file://')) {
                console.log('[ProfileScreen] Fazendo upload do verso da CNH...');
                cnhBackUrl = await uploadImage(cnhBackUrl, 'documents');
                console.log('[ProfileScreen] Verso da CNH enviado:', cnhBackUrl);
            }

            // Envia para o backend
            await api.put('/auth/documents', {
                documentType: 'CNH',
                documentFront: cnhFrontUrl,
                documentBack: cnhBackUrl,
            });

            Alert.alert(
                t('common.success'),
                t('documents.saved')
            );
        } catch (error: any) {
            console.log('Erro ao salvar documentos:', error.response?.data);
            const errorMessage = error.response?.data?.message || t('documents.saveError');
            Alert.alert(t('common.error'), errorMessage);
        } finally {
            setSavingDocuments(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                <View style={styles.headerRight}>
                    <LanguageSelector showLabel={false} />
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* FOTO DE PERFIL */}
                <View style={styles.photoSection}>
                    <TouchableOpacity
                        style={styles.photoContainer}
                        onPress={() => !savingPhoto && pickImage('profile')}
                        disabled={savingPhoto}
                    >
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={50} color="#999" />
                            </View>
                        )}
                        {savingPhoto ? (
                            <View style={styles.photoLoadingOverlay}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        ) : (
                            <View style={styles.editPhotoButton}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.userTypeBadge}>
                        <Ionicons
                            name={isDriver ? 'car' : 'person'}
                            size={14}
                            color="#4facfe"
                        />
                        <Text style={styles.userTypeText}>
                            {isDriver ? t('profile.driver') : t('profile.customer')}
                        </Text>
                    </View>
                </View>

                {/* DADOS PESSOAIS - SOMENTE LEITURA */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={22} color="#4facfe" />
                        <Text style={styles.sectionTitle}>{t('profile.personalData')}</Text>
                        <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={12} color="#999" />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('profile.name')}</Text>
                        <View style={[styles.inputContainer, styles.inputDisabled]}>
                            <Text style={[styles.input, styles.inputTextDisabled]}>
                                {name || '-'}
                            </Text>
                            <Ionicons name="lock-closed-outline" size={16} color="#ccc" />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('profile.birthDate')}</Text>
                        <View style={[styles.inputContainer, styles.inputDisabled]}>
                            <Text style={[styles.input, styles.inputTextDisabled]}>
                                {birthDate || '-'}
                            </Text>
                            <Ionicons name="lock-closed-outline" size={16} color="#ccc" />
                        </View>
                    </View>

                    <Text style={styles.infoText}>
                        <Ionicons name="information-circle-outline" size={14} color="#999" />
                        {' '}{t('cnh.infoMessage')}
                    </Text>
                </View>

                {/* DADOS DO MOTORISTA (apenas motorista) */}
                {isDriver && (
                    <>
                        {/* DOCUMENTOS CNH - Upload */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="card-outline" size={22} color="#4facfe" />
                                <Text style={styles.sectionTitle}>{t('documents.cnhTitle')}</Text>
                            </View>

                            <Text style={styles.sectionDescription}>
                                {t('documents.cnhDescription')}
                            </Text>

                            <View style={styles.documentsGrid}>
                                {/* Frente da CNH */}
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>{t('documents.cnhFront')}</Text>
                                    <TouchableOpacity
                                        style={styles.documentUploadButton}
                                        onPress={() => pickImage('cnhFront')}
                                    >
                                        {driverInfo.documents.cnhFront ? (
                                            <Image
                                                source={{ uri: driverInfo.documents.cnhFront }}
                                                style={styles.documentImage}
                                            />
                                        ) : (
                                            <View style={styles.documentPlaceholder}>
                                                <Ionicons name="camera-outline" size={32} color="#999" />
                                                <Text style={styles.documentPlaceholderText}>
                                                    {t('documents.addPhoto')}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Verso da CNH */}
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>{t('documents.cnhBack')}</Text>
                                    <TouchableOpacity
                                        style={styles.documentUploadButton}
                                        onPress={() => pickImage('cnhBack')}
                                    >
                                        {driverInfo.documents.cnhBack ? (
                                            <Image
                                                source={{ uri: driverInfo.documents.cnhBack }}
                                                style={styles.documentImage}
                                            />
                                        ) : (
                                            <View style={styles.documentPlaceholder}>
                                                <Ionicons name="camera-outline" size={32} color="#999" />
                                                <Text style={styles.documentPlaceholderText}>
                                                    {t('documents.addPhoto')}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Botão Salvar Documentos */}
                            <TouchableOpacity
                                style={[styles.saveDocumentsButton, savingDocuments && styles.saveButtonDisabled]}
                                onPress={handleSaveDocuments}
                                disabled={savingDocuments}
                            >
                                {savingDocuments ? (
                                    <>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.saveDocumentsButtonText}>{t('common.saving')}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                        <Text style={styles.saveDocumentsButtonText}>{t('documents.saveDocuments')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* VEÍCULO */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="car-outline" size={22} color="#4facfe" />
                                <Text style={styles.sectionTitle}>{t('vehicle.title')}</Text>
                                {vehicleStatus && (
                                    <View style={[
                                        styles.vehicleStatusBadge,
                                        vehicleStatus === 'PENDING' && styles.vehicleStatusPending,
                                        vehicleStatus === 'APPROVED' && styles.vehicleStatusApproved,
                                        vehicleStatus === 'REJECTED' && styles.vehicleStatusRejected,
                                    ]}>
                                        <Ionicons
                                            name={
                                                vehicleStatus === 'PENDING' ? 'time-outline' :
                                                vehicleStatus === 'APPROVED' ? 'checkmark-circle-outline' :
                                                'close-circle-outline'
                                            }
                                            size={14}
                                            color={
                                                vehicleStatus === 'PENDING' ? '#f39c12' :
                                                vehicleStatus === 'APPROVED' ? '#27ae60' :
                                                '#e74c3c'
                                            }
                                        />
                                        <Text style={[
                                            styles.vehicleStatusText,
                                            vehicleStatus === 'PENDING' && styles.vehicleStatusTextPending,
                                            vehicleStatus === 'APPROVED' && styles.vehicleStatusTextApproved,
                                            vehicleStatus === 'REJECTED' && styles.vehicleStatusTextRejected,
                                        ]}>
                                            {vehicleStatus === 'PENDING' ? t('vehicle.status.pending') :
                                             vehicleStatus === 'APPROVED' ? t('vehicle.status.approved') :
                                             t('vehicle.status.rejected')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Mensagem quando em validação */}
                            {isVehiclePending && (
                                <View style={styles.pendingMessageContainer}>
                                    <Ionicons name="information-circle" size={20} color="#f39c12" />
                                    <Text style={styles.pendingMessageText}>
                                        {t('vehicle.pendingMessage')}
                                    </Text>
                                </View>
                            )}

                            {/* Tipo de Veículo */}
                            <View style={[styles.formGroup, isVehiclePending && styles.formGroupDisabled]}>
                                <Text style={styles.label}>{t('vehicle.type')}</Text>
                                <View style={[styles.vehicleTypeContainer, isVehiclePending && styles.disabledOverlay]}>
                                    {VEHICLE_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.vehicleTypeButton,
                                                driverInfo.vehicle.type === type.id && styles.vehicleTypeButtonActive,
                                                isVehiclePending && styles.vehicleTypeButtonDisabled,
                                            ]}
                                            onPress={() => {
                                                if (!isVehiclePending) {
                                                    // Reseta marca e modelo ao mudar o tipo de veículo
                                                    setDriverInfo({
                                                        ...driverInfo,
                                                        vehicle: {
                                                            ...driverInfo.vehicle,
                                                            type: type.id,
                                                            brand: '',
                                                            model: '',
                                                        },
                                                    });
                                                }
                                            }}
                                            disabled={isVehiclePending}
                                        >
                                            <Ionicons
                                                name={type.icon as any}
                                                size={24}
                                                color={driverInfo.vehicle.type === type.id ? '#fff' : '#666'}
                                            />
                                            <Text
                                                style={[
                                                    styles.vehicleTypeLabel,
                                                    driverInfo.vehicle.type === type.id && styles.vehicleTypeLabelActive,
                                                ]}
                                            >
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Marca - Select com busca (filtrado pelo tipo de veículo) */}
                            <SearchableSelect
                                label={t('vehicle.brand')}
                                placeholder={t('vehicle.selectBrand')}
                                options={availableBrands}
                                value={driverInfo.vehicle.brand}
                                onChange={(value) => {
                                    setDriverInfo({
                                        ...driverInfo,
                                        vehicle: {
                                            ...driverInfo.vehicle,
                                            brand: value,
                                            model: '', // Limpa o modelo ao mudar a marca
                                        },
                                    });
                                }}
                                disabled={isVehiclePending}
                            />

                            {/* Modelo - Select com busca (filtrado pela marca) */}
                            <SearchableSelect
                                label={t('vehicle.model')}
                                placeholder={driverInfo.vehicle.brand ? t('vehicle.selectModel') : t('vehicle.selectBrandFirst')}
                                options={getModelsByBrand(driverInfo.vehicle.brand).map(m => ({ value: m.value, label: m.label }))}
                                value={driverInfo.vehicle.model}
                                onChange={(value) => {
                                    setDriverInfo({
                                        ...driverInfo,
                                        vehicle: { ...driverInfo.vehicle, model: value },
                                    });
                                }}
                                disabled={!driverInfo.vehicle.brand || isVehiclePending}
                            />

                            <View style={styles.rowContainer}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>{t('vehicle.year')}</Text>
                                    <View style={[styles.inputContainer, isVehiclePending && styles.inputContainerDisabled]}>
                                        <TextInput
                                            style={[styles.input, isVehiclePending && styles.inputDisabled]}
                                            value={driverInfo.vehicle.year}
                                            onChangeText={(text) =>
                                                setDriverInfo({
                                                    ...driverInfo,
                                                    vehicle: { ...driverInfo.vehicle, year: text },
                                                })
                                            }
                                            placeholder="Ex: 2022"
                                            placeholderTextColor="#999"
                                            keyboardType="numeric"
                                            maxLength={4}
                                            editable={!isVehiclePending}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>{t('vehicle.color')}</Text>
                                    <View style={[styles.inputContainer, isVehiclePending && styles.inputContainerDisabled]}>
                                        <TextInput
                                            style={[styles.input, isVehiclePending && styles.inputDisabled]}
                                            value={driverInfo.vehicle.color}
                                            onChangeText={(text) =>
                                                setDriverInfo({
                                                    ...driverInfo,
                                                    vehicle: { ...driverInfo.vehicle, color: text },
                                                })
                                            }
                                            placeholder="Ex: Branco"
                                            placeholderTextColor="#999"
                                            editable={!isVehiclePending}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('vehicle.plate')}</Text>
                                <View style={[styles.inputContainer, isVehiclePending && styles.inputContainerDisabled]}>
                                    <TextInput
                                        style={[styles.input, isVehiclePending && styles.inputDisabled]}
                                        value={driverInfo.vehicle.licensePlate}
                                        onChangeText={(text) =>
                                            setDriverInfo({
                                                ...driverInfo,
                                                vehicle: { ...driverInfo.vehicle, licensePlate: text.toUpperCase() },
                                            })
                                        }
                                        placeholder="Ex: ABC1D23"
                                        placeholderTextColor="#999"
                                        autoCapitalize="characters"
                                        maxLength={7}
                                        editable={!isVehiclePending}
                                    />
                                </View>
                            </View>

                            {/* Fotos do Veículo */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('vehicle.photos')}</Text>
                                <View style={styles.vehiclePhotosGrid}>
                                    {/* Foto do Veículo */}
                                    <View style={styles.vehiclePhotoItem}>
                                        <Text style={styles.vehiclePhotoLabel}>{t('vehicle.vehiclePhoto')}</Text>
                                        <TouchableOpacity
                                            style={[styles.vehiclePhotoButtonSmall, isVehiclePending && styles.vehiclePhotoButtonDisabled]}
                                            onPress={() => !isVehiclePending && pickImage('vehicle')}
                                            disabled={isVehiclePending}
                                        >
                                            {driverInfo.vehicle.photo ? (
                                                <Image
                                                    source={{ uri: driverInfo.vehicle.photo }}
                                                    style={styles.vehiclePhotoSmall}
                                                />
                                            ) : (
                                                <View style={styles.vehiclePhotoPlaceholderSmall}>
                                                    <Ionicons name="car-outline" size={32} color="#999" />
                                                    <Text style={styles.vehiclePhotoTextSmall}>{t('documents.addPhoto')}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {/* Foto do CRLV */}
                                    <View style={styles.vehiclePhotoItem}>
                                        <Text style={styles.vehiclePhotoLabel}>{t('vehicle.crlvPhoto')}</Text>
                                        <TouchableOpacity
                                            style={[styles.vehiclePhotoButtonSmall, isVehiclePending && styles.vehiclePhotoButtonDisabled]}
                                            onPress={() => !isVehiclePending && pickImage('crlv')}
                                            disabled={isVehiclePending}
                                        >
                                            {driverInfo.vehicle.crlvPhoto ? (
                                                <Image
                                                    source={{ uri: driverInfo.vehicle.crlvPhoto }}
                                                    style={styles.vehiclePhotoSmall}
                                                />
                                            ) : (
                                                <View style={styles.vehiclePhotoPlaceholderSmall}>
                                                    <Ionicons name="document-text-outline" size={32} color="#999" />
                                                    <Text style={styles.vehiclePhotoTextSmall}>{t('documents.addPhoto')}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Botão Salvar Veículo - Oculto quando em validação */}
                            {!isVehiclePending && (
                                <TouchableOpacity
                                    style={[styles.saveVehicleButton, savingVehicle && styles.saveVehicleButtonDisabled]}
                                    onPress={handleSaveVehicle}
                                    disabled={savingVehicle}
                                >
                                    {savingVehicle ? (
                                        <>
                                            <ActivityIndicator color="#999" size="small" />
                                            <Text style={styles.saveVehicleButtonTextDisabled}>{t('vehicle.saving')}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="save-outline" size={20} color="#fff" />
                                            <Text style={styles.saveVehicleButtonText}>{t('vehicle.save')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {/* Mensagem do Admin (quando aprovado/reprovado) */}
                            {vehicleAdminMessage && (vehicleStatus === 'APPROVED' || vehicleStatus === 'REJECTED') && (
                                <View style={[
                                    styles.adminMessageContainer,
                                    vehicleStatus === 'APPROVED' && styles.adminMessageApproved,
                                    vehicleStatus === 'REJECTED' && styles.adminMessageRejected,
                                ]}>
                                    <View style={styles.adminMessageHeader}>
                                        <Ionicons
                                            name={vehicleStatus === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'}
                                            size={20}
                                            color={vehicleStatus === 'APPROVED' ? '#27ae60' : '#e74c3c'}
                                        />
                                        <Text style={[
                                            styles.adminMessageTitle,
                                            vehicleStatus === 'APPROVED' && styles.adminMessageTitleApproved,
                                            vehicleStatus === 'REJECTED' && styles.adminMessageTitleRejected,
                                        ]}>
                                            {vehicleStatus === 'APPROVED' ? t('vehicle.adminMessageApproved') : t('vehicle.adminMessageRejected')}
                                        </Text>
                                    </View>
                                    <Text style={styles.adminMessageText}>{vehicleAdminMessage}</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* ACESSAR PERFIL COMPLETO DO MOTORISTA */}
                {isDriver && (
                    <TouchableOpacity
                        style={styles.fullProfileButton}
                        onPress={() => navigation.navigate('DriverProfile')}
                    >
                        <Ionicons name="person-circle-outline" size={22} color="#667eea" />
                        <Text style={styles.fullProfileButtonText}>{t('profile.viewFullProfile')}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#667eea" />
                    </TouchableOpacity>
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoutButton: {
        padding: 10,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    photoContainer: {
        position: 'relative',
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4facfe',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    photoLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
    },
    userTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4fe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    userTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4facfe',
        marginLeft: 5,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    placeholder: {
        color: '#999',
    },
    rowContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    halfWidth: {
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
        backgroundColor: '#f8f9fa',
        padding: 12,
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
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginTop: 5,
    },
    vehicleTypeLabelActive: {
        color: '#fff',
    },
    vehiclePhotoButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    vehiclePhoto: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    vehiclePhotoPlaceholder: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehiclePhotoText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    saveButton: {
        backgroundColor: '#4facfe',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
    // Estilos do card de percursos
    routesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f4ff',
    },
    routesCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    routesCardContent: {
        flex: 1,
    },
    routesCardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    routesCardSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    // Estilos para campos desabilitados
    inputDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e5e5e5',
    },
    inputTextDisabled: {
        color: '#666',
    },
    lockedBadge: {
        marginLeft: 'auto',
        backgroundColor: '#f0f0f0',
        padding: 6,
        borderRadius: 12,
    },
    infoText: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    // Estilos para botão de solicitar alteração
    requestChangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4ff',
        padding: 14,
        borderRadius: 12,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#e0e8ff',
    },
    requestChangeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
        marginLeft: 8,
    },
    // Estilos para display de foto do veículo
    vehiclePhotoDisplay: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    // Estilos para botão de perfil completo
    fullProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e8ff',
    },
    fullProfileButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
        marginLeft: 10,
    },
    // Estilos para botão de salvar veículo
    saveVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        padding: 16,
        borderRadius: 12,
        marginTop: 15,
    },
    saveVehicleButtonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    saveVehicleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    saveVehicleButtonTextDisabled: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginLeft: 8,
    },
    // Estilos para status do veículo
    vehicleStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    vehicleStatusPending: {
        backgroundColor: '#fef3e2',
    },
    vehicleStatusApproved: {
        backgroundColor: '#e8f5e9',
    },
    vehicleStatusRejected: {
        backgroundColor: '#ffebee',
    },
    vehicleStatusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    vehicleStatusTextPending: {
        color: '#f39c12',
    },
    vehicleStatusTextApproved: {
        color: '#27ae60',
    },
    vehicleStatusTextRejected: {
        color: '#e74c3c',
    },
    // Estilos para mensagem de pendente
    pendingMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fef3e2',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    pendingMessageText: {
        flex: 1,
        fontSize: 13,
        color: '#8a6914',
        marginLeft: 10,
        lineHeight: 18,
    },
    // Estilos para campos desabilitados
    formGroupDisabled: {
        opacity: 0.7,
    },
    inputContainerDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
    },
    inputDisabled: {
        color: '#999',
    },
    vehicleTypeButtonDisabled: {
        opacity: 0.5,
    },
    vehiclePhotoButtonDisabled: {
        opacity: 0.6,
    },
    disabledOverlay: {
        opacity: 0.7,
    },
    // Estilos para mensagem do admin
    adminMessageContainer: {
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        borderLeftWidth: 4,
    },
    adminMessageApproved: {
        backgroundColor: '#e8f5e9',
        borderLeftColor: '#27ae60',
    },
    adminMessageRejected: {
        backgroundColor: '#ffebee',
        borderLeftColor: '#e74c3c',
    },
    adminMessageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    adminMessageTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    adminMessageTitleApproved: {
        color: '#27ae60',
    },
    adminMessageTitleRejected: {
        color: '#e74c3c',
    },
    adminMessageText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    // Estilos para seção de documentos
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    documentsGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    documentItem: {
        flex: 1,
    },
    documentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    documentUploadButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
        aspectRatio: 1.5,
    },
    documentImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    documentPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentPlaceholderText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    saveDocumentsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27ae60',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    saveDocumentsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    // Estilos para grid de fotos do veículo
    vehiclePhotosGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    vehiclePhotoItem: {
        flex: 1,
    },
    vehiclePhotoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    vehiclePhotoButtonSmall: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
        aspectRatio: 1.3,
    },
    vehiclePhotoSmall: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    vehiclePhotoPlaceholderSmall: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehiclePhotoTextSmall: {
        marginTop: 6,
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
    },
});
