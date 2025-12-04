/**
 * VehicleTab - Aba de dados do veiculo (apenas motoristas)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../../contexts/LanguageContext';
import api, { getFullImageUrl } from '../../../services/api';
import { uploadImage } from '../../../services/upload';
import SearchableSelect from '../../../components/SearchableSelect';
import {
    carBrands,
    vanBrands,
    truckBrands,
    motorcycleBrands,
    getModelsByBrand,
    getBrandLabel,
    getModelLabel,
} from '../../../data/vehicleData';
import theme from '../../../theme';

interface VehicleInfo {
    type: string;
    brand: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    photo: string | null;
    crlvPhoto: string | null;
}

type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

export default function VehicleTab() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<VehicleStatus>(null);
    const [adminMessage, setAdminMessage] = useState<string | null>(null);

    const [vehicle, setVehicle] = useState<VehicleInfo>({
        type: 'car',
        brand: '',
        model: '',
        year: '',
        color: '',
        licensePlate: '',
        photo: null,
        crlvPhoto: null,
    });

    const isPending = status === 'PENDING';
    const isEditable = status !== 'PENDING';

    // Tipos de veiculo
    const VEHICLE_TYPES = useMemo(() => [
        { id: 'car', label: t('vehicle.car'), icon: 'car-outline' },
        { id: 'van', label: t('vehicle.van'), icon: 'bus-outline' },
        { id: 'truck', label: t('vehicle.truck'), icon: 'cube-outline' },
        { id: 'motorcycle', label: t('vehicle.motorcycle'), icon: 'bicycle-outline' },
    ], [t]);

    // Marcas filtradas por tipo
    const availableBrands = useMemo(() => {
        switch (vehicle.type) {
            case 'car': return carBrands;
            case 'van': return vanBrands;
            case 'truck': return truckBrands;
            case 'motorcycle': return motorcycleBrands;
            default: return carBrands;
        }
    }, [vehicle.type]);

    // Carrega dados do veiculo
    useEffect(() => {
        loadVehicle();
    }, []);

    const loadVehicle = async () => {
        try {
            const response = await api.get('/vehicles/my-vehicles');
            if (response.data?.length > 0) {
                const v = response.data[0];
                const docs = v.documents || {};
                setVehicle({
                    type: (docs.type || 'car').toLowerCase(),
                    brand: docs.brand || '',
                    model: docs.model || '',
                    year: docs.year?.toString() || '',
                    color: docs.color || '',
                    licensePlate: v.plate || '',
                    photo: getFullImageUrl(docs.photo),
                    crlvPhoto: getFullImageUrl(docs.crlvPhoto),
                });
                const s = v.status?.toUpperCase();
                setStatus(s === 'PENDING' || s === 'APPROVED' || s === 'REJECTED' ? s : null);
                setAdminMessage(v.adminNotes || v.rejectionReason || null);
            }
        } catch (error) {
            console.log('Veiculo nao carregado:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = useCallback(async (type: 'photo' | 'crlvPhoto') => {
        if (isPending) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('permissions.gallery'), t('permissions.galleryMessage'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: type === 'photo' ? [4, 3] : [3, 2],
            quality: 0.8,
        });

        if (!result.canceled) {
            setVehicle(prev => ({
                ...prev,
                [type]: result.assets[0].uri,
            }));
        }
    }, [isPending, t]);

    const handleSave = useCallback(async () => {
        if (!vehicle.brand || !vehicle.model || !vehicle.year || !vehicle.licensePlate) {
            Alert.alert(t('common.attention'), t('vehicle.requiredFields'));
            return;
        }

        setSaving(true);
        try {
            // Upload fotos se forem locais
            let photoUrl = vehicle.photo;
            if (photoUrl && photoUrl.startsWith('file://')) {
                photoUrl = await uploadImage(photoUrl, 'vehicles');
            }

            let crlvPhotoUrl = vehicle.crlvPhoto;
            if (crlvPhotoUrl && crlvPhotoUrl.startsWith('file://')) {
                crlvPhotoUrl = await uploadImage(crlvPhotoUrl, 'documents');
            }

            await api.put('/vehicles/my-vehicle', {
                brand: vehicle.brand,
                brandLabel: getBrandLabel(vehicle.brand),
                model: vehicle.model,
                modelLabel: getModelLabel(vehicle.model),
                year: parseInt(vehicle.year),
                color: vehicle.color,
                plate: vehicle.licensePlate,
                type: vehicle.type?.toUpperCase() || 'CAR',
                photo: photoUrl,
                crlvPhoto: crlvPhotoUrl,
            });

            setStatus('PENDING');
            Alert.alert(
                t('vehicle.sentForValidation'),
                t('vehicle.sentForValidationMessage')
            );
        } catch (error: any) {
            console.log('Erro ao salvar veiculo:', error.response?.data);
            Alert.alert(t('common.error'), error.response?.data?.message || t('vehicle.saveError'));
        } finally {
            setSaving(false);
        }
    }, [vehicle, t]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.section}>
                {/* Header com status */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="car-outline" size={22} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>{t('vehicle.title')}</Text>
                    {status && (
                        <View style={[
                            styles.statusBadge,
                            status === 'PENDING' && styles.statusPending,
                            status === 'APPROVED' && styles.statusApproved,
                            status === 'REJECTED' && styles.statusRejected,
                        ]}>
                            <Ionicons
                                name={
                                    status === 'PENDING' ? 'time-outline' :
                                    status === 'APPROVED' ? 'checkmark-circle-outline' :
                                    'close-circle-outline'
                                }
                                size={14}
                                color={
                                    status === 'PENDING' ? theme.colors.warning :
                                    status === 'APPROVED' ? theme.colors.success :
                                    theme.colors.error
                                }
                            />
                            <Text style={[
                                styles.statusText,
                                status === 'PENDING' && styles.statusTextPending,
                                status === 'APPROVED' && styles.statusTextApproved,
                                status === 'REJECTED' && styles.statusTextRejected,
                            ]}>
                                {status === 'PENDING' ? t('vehicle.status.pending') :
                                 status === 'APPROVED' ? t('vehicle.status.approved') :
                                 t('vehicle.status.rejected')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Mensagem de pendente */}
                {isPending && (
                    <View style={styles.pendingMessage}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
                        <Text style={styles.pendingMessageText}>
                            {t('vehicle.pendingMessage')}
                        </Text>
                    </View>
                )}

                {/* Tipo de veiculo */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('vehicle.type')}</Text>
                    <View style={[styles.vehicleTypeGrid, isPending && styles.disabledOverlay]}>
                        {VEHICLE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.vehicleTypeButton,
                                    vehicle.type === type.id && styles.vehicleTypeButtonActive,
                                ]}
                                onPress={() => !isPending && setVehicle(prev => ({
                                    ...prev,
                                    type: type.id,
                                    brand: '',
                                    model: '',
                                }))}
                                disabled={isPending}
                            >
                                <Ionicons
                                    name={type.icon as any}
                                    size={24}
                                    color={vehicle.type === type.id ? '#fff' : theme.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.vehicleTypeLabel,
                                    vehicle.type === type.id && styles.vehicleTypeLabelActive,
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Marca */}
                <SearchableSelect
                    label={t('vehicle.brand')}
                    placeholder={t('vehicle.selectBrand')}
                    options={availableBrands}
                    value={vehicle.brand}
                    onChange={(value) => setVehicle(prev => ({ ...prev, brand: value, model: '' }))}
                    disabled={isPending}
                />

                {/* Modelo */}
                <SearchableSelect
                    label={t('vehicle.model')}
                    placeholder={vehicle.brand ? t('vehicle.selectModel') : t('vehicle.selectBrandFirst')}
                    options={getModelsByBrand(vehicle.brand)}
                    value={vehicle.model}
                    onChange={(value) => setVehicle(prev => ({ ...prev, model: value }))}
                    disabled={!vehicle.brand || isPending}
                />

                {/* Ano e Cor */}
                <View style={styles.rowFields}>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>{t('vehicle.year')}</Text>
                        <View style={[styles.inputContainer, isPending && styles.inputDisabled]}>
                            <TextInput
                                style={styles.input}
                                value={vehicle.year}
                                onChangeText={(text) => setVehicle(prev => ({ ...prev, year: text }))}
                                placeholder="Ex: 2022"
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="numeric"
                                maxLength={4}
                                editable={!isPending}
                            />
                        </View>
                    </View>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>{t('vehicle.color')}</Text>
                        <View style={[styles.inputContainer, isPending && styles.inputDisabled]}>
                            <TextInput
                                style={styles.input}
                                value={vehicle.color}
                                onChangeText={(text) => setVehicle(prev => ({ ...prev, color: text }))}
                                placeholder="Ex: Branco"
                                placeholderTextColor={theme.colors.textMuted}
                                editable={!isPending}
                            />
                        </View>
                    </View>
                </View>

                {/* Placa */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('vehicle.plate')}</Text>
                    <View style={[styles.inputContainer, isPending && styles.inputDisabled]}>
                        <TextInput
                            style={styles.input}
                            value={vehicle.licensePlate}
                            onChangeText={(text) => setVehicle(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
                            placeholder="Ex: ABC1D23"
                            placeholderTextColor={theme.colors.textMuted}
                            autoCapitalize="characters"
                            maxLength={7}
                            editable={!isPending}
                        />
                    </View>
                </View>

                {/* Fotos */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('vehicle.photos')}</Text>
                    <View style={styles.photosGrid}>
                        {/* Foto do veiculo */}
                        <View style={styles.photoItem}>
                            <Text style={styles.photoLabel}>{t('vehicle.vehiclePhoto')}</Text>
                            <TouchableOpacity
                                style={[styles.photoButton, isPending && styles.photoButtonDisabled]}
                                onPress={() => pickImage('photo')}
                                disabled={isPending}
                            >
                                {vehicle.photo ? (
                                    <Image source={{ uri: vehicle.photo }} style={styles.photoImage} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="car-outline" size={32} color={theme.colors.textMuted} />
                                        <Text style={styles.photoPlaceholderText}>{t('documents.addPhoto')}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Foto do CRLV */}
                        <View style={styles.photoItem}>
                            <Text style={styles.photoLabel}>{t('vehicle.crlvPhoto')}</Text>
                            <TouchableOpacity
                                style={[styles.photoButton, isPending && styles.photoButtonDisabled]}
                                onPress={() => pickImage('crlvPhoto')}
                                disabled={isPending}
                            >
                                {vehicle.crlvPhoto ? (
                                    <Image source={{ uri: vehicle.crlvPhoto }} style={styles.photoImage} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="document-text-outline" size={32} color={theme.colors.textMuted} />
                                        <Text style={styles.photoPlaceholderText}>{t('documents.addPhoto')}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Botao salvar */}
                {!isPending && (
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.saveButtonText}>{t('vehicle.saving')}</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>{t('vehicle.save')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Mensagem do admin */}
                {adminMessage && (status === 'APPROVED' || status === 'REJECTED') && (
                    <View style={[
                        styles.adminMessage,
                        status === 'APPROVED' && styles.adminMessageApproved,
                        status === 'REJECTED' && styles.adminMessageRejected,
                    ]}>
                        <View style={styles.adminMessageHeader}>
                            <Ionicons
                                name={status === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'}
                                size={20}
                                color={status === 'APPROVED' ? theme.colors.success : theme.colors.error}
                            />
                            <Text style={[
                                styles.adminMessageTitle,
                                status === 'APPROVED' && { color: theme.colors.success },
                                status === 'REJECTED' && { color: theme.colors.error },
                            ]}>
                                {status === 'APPROVED' ? t('vehicle.adminMessageApproved') : t('vehicle.adminMessageRejected')}
                            </Text>
                        </View>
                        <Text style={styles.adminMessageText}>{adminMessage}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.xl,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        ...theme.components.section,
    },
    sectionHeader: {
        ...theme.components.sectionHeader,
    },
    sectionTitle: {
        ...theme.typography.h4,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.xs,
    },
    statusPending: { backgroundColor: theme.colors.warningLight },
    statusApproved: { backgroundColor: theme.colors.successLight },
    statusRejected: { backgroundColor: theme.colors.errorLight },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextPending: { color: theme.colors.warning },
    statusTextApproved: { color: theme.colors.success },
    statusTextRejected: { color: theme.colors.error },
    pendingMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.warningLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.warning,
    },
    pendingMessageText: {
        flex: 1,
        fontSize: 13,
        color: '#8a6914',
        lineHeight: 18,
    },
    field: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.label,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    vehicleTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    vehicleTypeButton: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    vehicleTypeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    vehicleTypeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: theme.spacing.xs,
    },
    vehicleTypeLabelActive: {
        color: '#fff',
    },
    disabledOverlay: {
        opacity: 0.6,
    },
    rowFields: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    halfField: {
        flex: 1,
    },
    inputContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        height: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
    },
    inputDisabled: {
        backgroundColor: theme.colors.borderLight,
        borderColor: theme.colors.border,
    },
    input: {
        fontSize: 15,
        color: theme.colors.text,
    },
    photosGrid: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
    },
    photoItem: {
        flex: 1,
    },
    photoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    photoButton: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        aspectRatio: 1.3,
    },
    photoButtonDisabled: {
        opacity: 0.6,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    photoPlaceholderText: {
        fontSize: 11,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    saveButton: {
        ...theme.components.buttonPrimary,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    saveButtonDisabled: {
        ...theme.components.buttonDisabled,
    },
    saveButtonText: {
        ...theme.components.buttonPrimaryText,
    },
    adminMessage: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.lg,
        borderLeftWidth: 4,
    },
    adminMessageApproved: {
        backgroundColor: theme.colors.successLight,
        borderLeftColor: theme.colors.success,
    },
    adminMessageRejected: {
        backgroundColor: theme.colors.errorLight,
        borderLeftColor: theme.colors.error,
    },
    adminMessageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    adminMessageTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    adminMessageText: {
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20,
    },
});
