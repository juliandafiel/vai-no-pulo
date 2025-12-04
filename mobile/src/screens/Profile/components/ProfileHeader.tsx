/**
 * ProfileHeader - Cabecalho do perfil com foto e info basica
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import LanguageSelector from '../../../components/LanguageSelector';
import theme from '../../../theme';

interface Props {
    onLogout: () => void;
}

export default function ProfileHeader({ onLogout }: Props) {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const [savingPhoto, setSavingPhoto] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(
        user?.profilePhoto || null
    );

    const isDriver = user?.userType === 'driver';

    const pickImage = useCallback(async () => {
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
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            const base64Image = result.assets[0].base64
                ? `data:image/jpeg;base64,${result.assets[0].base64}`
                : imageUri;

            setProfilePhoto(imageUri);
            await saveProfilePhoto(base64Image);
        }
    }, [t]);

    const saveProfilePhoto = useCallback(async (photoData: string) => {
        setSavingPhoto(true);
        try {
            await updateUser({ profilePhoto: photoData });
            Alert.alert(t('common.success'), t('profile.photoUpdated'));
        } catch (error: any) {
            console.log('Erro ao salvar foto:', error);
            Alert.alert(t('common.error'), t('profile.photoError'));
            setProfilePhoto(user?.profilePhoto || null);
        } finally {
            setSavingPhoto(false);
        }
    }, [updateUser, t, user?.profilePhoto]);

    const handleLogout = useCallback(() => {
        Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('auth.logout'), style: 'destructive', onPress: onLogout },
        ]);
    }, [t, onLogout]);

    return (
        <View style={styles.container}>
            {/* Header bar */}
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                <View style={styles.headerActions}>
                    <LanguageSelector showLabel={false} />
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Photo section */}
            <View style={styles.photoSection}>
                <TouchableOpacity
                    style={styles.photoContainer}
                    onPress={pickImage}
                    disabled={savingPhoto}
                    activeOpacity={0.8}
                >
                    {profilePhoto ? (
                        <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={50} color={theme.colors.textMuted} />
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
                        color={theme.colors.primary}
                    />
                    <Text style={styles.userTypeText}>
                        {isDriver ? t('profile.driver') : t('profile.customer')}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    headerTitle: {
        ...theme.typography.h1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    logoutButton: {
        padding: theme.spacing.sm,
    },
    photoSection: {
        alignItems: 'center',
        paddingBottom: theme.spacing.xl,
    },
    photoContainer: {
        position: 'relative',
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    photoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    photoLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userEmail: {
        ...theme.typography.bodySmall,
        marginTop: theme.spacing.md,
    },
    userTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.xl,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    userTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
