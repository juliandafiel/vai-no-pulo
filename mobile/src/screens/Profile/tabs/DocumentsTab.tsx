/**
 * DocumentsTab - Aba de documentos (CNH)
 * Apenas para motoristas
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
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
import theme from '../../../theme';

interface DocumentsInfo {
    cnhFront: string | null;
    cnhBack: string | null;
}

export default function DocumentsTab() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [documents, setDocuments] = useState<DocumentsInfo>({
        cnhFront: null,
        cnhBack: null,
    });

    // Carrega documentos ao montar
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await api.get('/auth/profile');
            if (response.data) {
                setDocuments({
                    cnhFront: getFullImageUrl(response.data.documentFront),
                    cnhBack: getFullImageUrl(response.data.documentBack),
                });
            }
        } catch (error) {
            console.log('Documentos nao carregados:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = useCallback(async (type: 'cnhFront' | 'cnhBack') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                t('permissions.gallery'),
                t('permissions.galleryMessage')
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 2], // Formato documento
            quality: 0.8,
        });

        if (!result.canceled) {
            setDocuments(prev => ({
                ...prev,
                [type]: result.assets[0].uri,
            }));
        }
    }, [t]);

    // Converte URL completa para relativa (remove base URL)
    const toRelativeUrl = (url: string | null): string | null => {
        if (!url) return null;
        // Se ja e relativa, retorna como esta
        if (url.startsWith('/uploads/')) return url;
        // Extrai a parte relativa da URL completa
        const match = url.match(/\/uploads\/.*$/);
        return match ? match[0] : url;
    };

    const handleSave = useCallback(async () => {
        if (!documents.cnhFront || !documents.cnhBack) {
            Alert.alert(t('common.attention'), t('documents.requiredFields'));
            return;
        }

        setSaving(true);
        try {
            // Upload da frente da CNH se for arquivo local
            let cnhFrontUrl = documents.cnhFront;
            if (cnhFrontUrl && cnhFrontUrl.startsWith('file://')) {
                cnhFrontUrl = await uploadImage(cnhFrontUrl, 'documents');
            } else {
                // Converte para URL relativa se for URL completa
                cnhFrontUrl = toRelativeUrl(cnhFrontUrl);
            }

            // Upload do verso da CNH se for arquivo local
            let cnhBackUrl = documents.cnhBack;
            if (cnhBackUrl && cnhBackUrl.startsWith('file://')) {
                cnhBackUrl = await uploadImage(cnhBackUrl, 'documents');
            } else {
                // Converte para URL relativa se for URL completa
                cnhBackUrl = toRelativeUrl(cnhBackUrl);
            }

            // Envia para o backend (sempre URLs relativas)
            await api.put('/auth/documents', {
                documentType: 'CNH',
                documentFront: cnhFrontUrl,
                documentBack: cnhBackUrl,
            });

            // Atualiza o estado local com as URLs completas para exibir as imagens
            setDocuments({
                cnhFront: getFullImageUrl(cnhFrontUrl),
                cnhBack: getFullImageUrl(cnhBackUrl),
            });

            Alert.alert(t('common.success'), t('documents.saved'));
        } catch (error: any) {
            console.log('Erro ao salvar documentos:', error.response?.data);
            Alert.alert(t('common.error'), t('documents.saveError'));
        } finally {
            setSaving(false);
        }
    }, [documents, t]);

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
            {/* Secao CNH */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="card-outline" size={22} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>{t('documents.cnhTitle')}</Text>
                </View>

                <Text style={styles.description}>
                    {t('documents.cnhDescription')}
                </Text>

                {/* Grid de documentos */}
                <View style={styles.documentsGrid}>
                    {/* Frente da CNH */}
                    <View style={styles.documentItem}>
                        <Text style={styles.documentLabel}>{t('documents.cnhFront')}</Text>
                        <TouchableOpacity
                            style={styles.documentButton}
                            onPress={() => pickImage('cnhFront')}
                            activeOpacity={0.8}
                        >
                            {documents.cnhFront ? (
                                <Image
                                    source={{ uri: documents.cnhFront }}
                                    style={styles.documentImage}
                                />
                            ) : (
                                <View style={styles.documentPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={theme.colors.textMuted} />
                                    <Text style={styles.placeholderText}>
                                        {t('documents.addPhoto')}
                                    </Text>
                                </View>
                            )}
                            {documents.cnhFront && (
                                <View style={styles.editBadge}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Verso da CNH */}
                    <View style={styles.documentItem}>
                        <Text style={styles.documentLabel}>{t('documents.cnhBack')}</Text>
                        <TouchableOpacity
                            style={styles.documentButton}
                            onPress={() => pickImage('cnhBack')}
                            activeOpacity={0.8}
                        >
                            {documents.cnhBack ? (
                                <Image
                                    source={{ uri: documents.cnhBack }}
                                    style={styles.documentImage}
                                />
                            ) : (
                                <View style={styles.documentPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={theme.colors.textMuted} />
                                    <Text style={styles.placeholderText}>
                                        {t('documents.addPhoto')}
                                    </Text>
                                </View>
                            )}
                            {documents.cnhBack && (
                                <View style={styles.editBadge}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dicas */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Dicas para uma boa foto:</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Documento completo e legivel</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Boa iluminacao, sem reflexos</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.tipText}>Fundo neutro e estavel</Text>
                    </View>
                </View>

                {/* Botao salvar */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.saveButtonText}>{t('common.saving')}</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>{t('documents.saveDocuments')}</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    },
    description: {
        ...theme.typography.bodySmall,
        marginBottom: theme.spacing.xl,
        lineHeight: 20,
    },
    documentsGrid: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
    },
    documentItem: {
        flex: 1,
    },
    documentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    documentButton: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        aspectRatio: 1.5,
        position: 'relative',
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
        gap: theme.spacing.sm,
    },
    placeholderText: {
        ...theme.typography.caption,
        textAlign: 'center',
    },
    editBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipsContainer: {
        backgroundColor: theme.colors.successLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginTop: theme.spacing.xl,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.successDark,
        marginBottom: theme.spacing.sm,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
    },
    tipText: {
        ...theme.typography.caption,
        color: theme.colors.successDark,
    },
    saveButton: {
        backgroundColor: theme.colors.success,
        height: 56,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.xl,
        gap: theme.spacing.sm,
        ...theme.shadows.md,
    },
    saveButtonDisabled: {
        backgroundColor: theme.colors.border,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
