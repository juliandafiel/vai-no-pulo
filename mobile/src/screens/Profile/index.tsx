/**
 * ProfileScreen - Tela de perfil refatorada com abas
 *
 * ANTES: 1500+ linhas em um unico arquivo com scroll infinito
 * AGORA: 3 abas separadas (Dados | Documentos | Veiculo)
 *
 * Melhorias UX:
 * - Navegacao por abas (sem scroll infinito)
 * - Componentes isolados e focados
 * - Carregamento independente por aba
 * - Melhor performance com lazy loading
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProfileHeader from './components/ProfileHeader';
import PersonalDataTab from './tabs/PersonalDataTab';
import DocumentsTab from './tabs/DocumentsTab';
import VehicleTab from './tabs/VehicleTab';
import theme from '../../theme';

type TabType = 'dados' | 'documentos' | 'veiculo';

interface TabConfig {
    id: TabType;
    label: string;
    icon: string;
    driverOnly?: boolean;
}

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('dados');

    const isDriver = user?.userType === 'driver';

    // Configuracao das abas
    const TABS: TabConfig[] = useMemo(() => [
        { id: 'dados', label: t('profile.personalData') || 'Dados', icon: 'person-outline' },
        { id: 'documentos', label: 'Habilitação', icon: 'card-outline', driverOnly: true },
        { id: 'veiculo', label: t('vehicle.title') || 'Veiculo', icon: 'car-outline', driverOnly: true },
    ], [t]);

    // Filtra abas visiveis (cliente nao ve documentos/veiculo)
    const visibleTabs = useMemo(() => {
        return TABS.filter(tab => !tab.driverOnly || isDriver);
    }, [TABS, isDriver]);

    // Renderiza conteudo da aba ativa
    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'dados':
                return <PersonalDataTab />;
            case 'documentos':
                return isDriver ? <DocumentsTab /> : null;
            case 'veiculo':
                return isDriver ? <VehicleTab /> : null;
            default:
                return <PersonalDataTab />;
        }
    }, [activeTab, isDriver]);

    // Handler de mudanca de aba com useCallback
    const handleTabChange = useCallback((tabId: TabType) => {
        setActiveTab(tabId);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header com foto e info */}
            <ProfileHeader onLogout={signOut} />

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => handleTabChange(tab.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={20}
                                color={isActive ? theme.colors.primary : theme.colors.textMuted}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    isActive && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Conteudo da aba */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.xs,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    tabTextActive: {
        color: theme.colors.primary,
    },
    content: {
        flex: 1,
    },
});
