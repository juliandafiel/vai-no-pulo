/**
 * PersonalDataTab - Aba de dados pessoais (somente leitura)
 */

import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import theme from '../../../theme';

export default function PersonalDataTab() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigation = useNavigation<any>();

    // Abre chat de suporte
    const handleSupportChat = useCallback(() => {
        // Navega para a tela de chat com o suporte
        navigation.navigate('Chat', {
            recipientId: 'support',
            recipientName: 'Suporte Vai no Pulo',
            isSupport: true,
        });
    }, [navigation]);

    // Abre email para solicitar alteracao de dados
    const handleChangeData = useCallback(async () => {
        const email = 'suporte@vainopulo.com.br';
        const subject = encodeURIComponent('Solicitacao de Alteracao de Dados Cadastrais');
        const body = encodeURIComponent(
            `Ola,\n\nGostaria de solicitar alteracao dos meus dados cadastrais.\n\n` +
            `Nome atual: ${user?.name || '-'}\n` +
            `Email: ${user?.email || '-'}\n` +
            `Telefone: ${user?.phone || '-'}\n\n` +
            `Dados que desejo alterar:\n` +
            `[Descreva aqui as alteracoes desejadas]\n\n` +
            `Atenciosamente.`
        );

        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

        try {
            const canOpen = await Linking.canOpenURL(mailtoUrl);
            if (canOpen) {
                await Linking.openURL(mailtoUrl);
            } else {
                Alert.alert(
                    'Email',
                    `Envie um email para ${email} solicitando a alteracao dos seus dados.`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert(
                'Erro',
                'Nao foi possivel abrir o aplicativo de email.',
                [{ text: 'OK' }]
            );
        }
    }, [user]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Secao de dados pessoais */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>{t('profile.personalData')}</Text>
                    <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
                    </View>
                </View>

                {/* Nome */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.name')}</Text>
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{user?.name || '-'}</Text>
                        <Ionicons name="lock-closed-outline" size={16} color={theme.colors.border} />
                    </View>
                </View>

                {/* Data de nascimento */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.birthDate')}</Text>
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{user?.birthDate || '-'}</Text>
                        <Ionicons name="lock-closed-outline" size={16} color={theme.colors.border} />
                    </View>
                </View>

                {/* Email */}
                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{user?.email || '-'}</Text>
                        <Ionicons name="lock-closed-outline" size={16} color={theme.colors.border} />
                    </View>
                </View>

                {/* Telefone */}
                <View style={[styles.field, styles.fieldLast]}>
                    <Text style={styles.label}>{t('profile.phone') || 'Telefone'}</Text>
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{user?.phone || '-'}</Text>
                        <Ionicons name="lock-closed-outline" size={16} color={theme.colors.border} />
                    </View>
                </View>

                {/* Mensagem informativa */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                        {t('cnh.infoMessage')}
                    </Text>
                </View>
            </View>

            {/* Secao de contato/suporte */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>Precisa de ajuda?</Text>
                </View>

                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={handleSupportChat}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.secondary} />
                    <View style={styles.helpButtonText}>
                        <Text style={styles.helpButtonTitle}>Suporte via Chat</Text>
                        <Text style={styles.helpButtonSubtitle}>Fale com nossa equipe</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.helpButton, styles.helpButtonLast]}
                    onPress={handleChangeData}
                    activeOpacity={0.7}
                >
                    <Ionicons name="mail-outline" size={20} color={theme.colors.secondary} />
                    <View style={styles.helpButtonText}>
                        <Text style={styles.helpButtonTitle}>Alterar dados cadastrais</Text>
                        <Text style={styles.helpButtonSubtitle}>Solicitar alteracao por email</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
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
    lockedBadge: {
        backgroundColor: theme.colors.borderLight,
        padding: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
    },
    field: {
        marginBottom: theme.spacing.lg,
    },
    fieldLast: {
        marginBottom: 0,
    },
    label: {
        ...theme.typography.label,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        height: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    value: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.textSecondary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginTop: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    infoText: {
        flex: 1,
        ...theme.typography.caption,
        color: theme.colors.primary,
        lineHeight: 18,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    helpButtonLast: {
        borderBottomWidth: 0,
    },
    helpButtonText: {
        flex: 1,
    },
    helpButtonTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    helpButtonSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
});
