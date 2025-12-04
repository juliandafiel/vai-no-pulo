# Plano de Melhorias UX/UI - App "Vai no Pulo"

> Documento criado pelo UX/UI Designer
> Data: 27/11/2025

---

## 1. BUSCA SIMPLIFICADA DE VIAGEM

### Problema Atual
- 6 campos para preencher (CEP, endereco, cidade, estado x2)
- Muitos passos, alto risco de abandono
- UX fragmentada

### Solucao Proposta
**2 campos unificados com autocomplete** usando Google Places API

### Wireframe (ASCII)
```
+------------------------------------------+
|        ENVIAR MERCADORIA                 |
+------------------------------------------+
|                                          |
|  De onde sai?                            |
|  +------------------------------------+  |
|  | [pin] Sao Paulo, SP            [x] |  |
|  +------------------------------------+  |
|           |                              |
|           v                              |
|  Para onde vai?                          |
|  +------------------------------------+  |
|  | [flag] Digite o destino...         |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [calendar] Hoje, 27 Nov        [>] |  |
|  +------------------------------------+  |
|                                          |
|  +====================================+  |
|  |      BUSCAR MOTORISTAS             |  |
|  +====================================+  |
|                                          |
+------------------------------------------+
```

### Implementacao

#### Novo Componente: `AddressAutocomplete.tsx`
```tsx
// mobile/src/components/AddressAutocomplete.tsx

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

interface AddressResult {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

interface Props {
    label: string;
    placeholder: string;
    icon: string;
    value: string;
    onSelect: (address: AddressResult) => void;
    onClear: () => void;
}

export default function AddressAutocomplete({
    label,
    placeholder,
    icon,
    value,
    onSelect,
    onClear,
}: Props) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<AddressResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Debounce para nao fazer muitas requisicoes
    const searchPlaces = useRef(
        debounce(async (text: string) => {
            if (text.length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Usar Google Places Autocomplete API
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&components=country:br&language=pt-BR&key=${GOOGLE_API_KEY}`
                );
                const data = await response.json();

                if (data.predictions) {
                    setResults(
                        data.predictions.map((p: any) => ({
                            placeId: p.place_id,
                            description: p.description,
                            mainText: p.structured_formatting.main_text,
                            secondaryText: p.structured_formatting.secondary_text,
                        }))
                    );
                }
            } catch (error) {
                console.error('Erro ao buscar enderecos:', error);
            } finally {
                setLoading(false);
            }
        }, 300)
    ).current;

    const handleChangeText = (text: string) => {
        setQuery(text);
        searchPlaces(text);
    };

    const handleSelect = (item: AddressResult) => {
        setQuery(item.description);
        setResults([]);
        setIsFocused(false);
        onSelect(item);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                <Ionicons name={icon as any} size={20} color="#4facfe" />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={handleChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {loading && <ActivityIndicator size="small" color="#4facfe" />}
                {query.length > 0 && !loading && (
                    <TouchableOpacity onPress={() => { setQuery(''); onClear(); }}>
                        <Ionicons name="close-circle" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown de resultados */}
            {isFocused && results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.placeId}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Ionicons name="location" size={18} color="#666" />
                                <View style={styles.resultText}>
                                    <Text style={styles.mainText}>{item.mainText}</Text>
                                    <Text style={styles.secondaryText}>{item.secondaryText}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.list}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        zIndex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        gap: 12,
    },
    inputFocused: {
        borderColor: '#4facfe',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    dropdown: {
        position: 'absolute',
        top: 88,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 100,
    },
    list: {
        maxHeight: 250,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 12,
    },
    resultText: {
        flex: 1,
    },
    mainText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    secondaryText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
});
```

#### Nova SearchTripScreen Simplificada
```tsx
// mobile/src/screens/SearchTripScreenV2.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddressAutocomplete from '../components/AddressAutocomplete';
import DateSelector from '../components/DateSelector';

export default function SearchTripScreenV2() {
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState(new Date());

    const canSearch = origin && destination;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Enviar Mercadoria</Text>
                <Text style={styles.subtitle}>
                    Encontre motoristas no seu trajeto
                </Text>
            </View>

            <View style={styles.form}>
                {/* Linha conectora visual */}
                <View style={styles.routeLine}>
                    <View style={styles.originDot} />
                    <View style={styles.dashedLine} />
                    <View style={styles.destinationDot} />
                </View>

                <View style={styles.inputs}>
                    <AddressAutocomplete
                        label="De onde sai?"
                        placeholder="Digite o endereco de origem"
                        icon="location"
                        value={origin?.description || ''}
                        onSelect={setOrigin}
                        onClear={() => setOrigin(null)}
                    />

                    <AddressAutocomplete
                        label="Para onde vai?"
                        placeholder="Digite o endereco de destino"
                        icon="flag"
                        value={destination?.description || ''}
                        onSelect={setDestination}
                        onClear={() => setDestination(null)}
                    />
                </View>
            </View>

            {/* Seletor de data simplificado */}
            <DateSelector
                value={date}
                onChange={setDate}
                label="Quando?"
            />

            {/* Botao de busca */}
            <TouchableOpacity
                style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
                disabled={!canSearch}
            >
                <Ionicons name="search" size={22} color="#fff" />
                <Text style={styles.searchButtonText}>Buscar Motoristas</Text>
            </TouchableOpacity>

            {/* Dica de uso */}
            <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={18} color="#4facfe" />
                <Text style={styles.tipText}>
                    Dica: Quanto mais flexivel a data, mais opcoes de motoristas!
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        marginTop: 4,
    },
    form: {
        flexDirection: 'row',
    },
    routeLine: {
        width: 24,
        alignItems: 'center',
        paddingTop: 40,
        marginRight: 8,
    },
    originDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4facfe',
    },
    dashedLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#ddd',
        marginVertical: 4,
    },
    destinationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00f260',
    },
    inputs: {
        flex: 1,
    },
    searchButton: {
        backgroundColor: '#4facfe',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 10,
    },
    searchButtonDisabled: {
        backgroundColor: '#ccc',
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4fe',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        gap: 10,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#4facfe',
    },
});
```

---

## 2. PROFILE SCREEN EM ABAS

### Problema Atual
- Tela com 1500+ linhas de codigo
- Scroll infinito frustrante
- Usuario perde contexto

### Solucao Proposta
**3 abas fixas**: Dados | Documentos | Veiculo

### Wireframe (ASCII)
```
+------------------------------------------+
|  Perfil                          [sair]  |
+------------------------------------------+
|        +------+                          |
|        | foto |   email@exemplo.com      |
|        +------+   [Motorista]            |
+------------------------------------------+
|  [ Dados ]  [ Documentos ]  [ Veiculo ]  |
+==========================================+
|                                          |
|  (conteudo da aba selecionada)           |
|                                          |
+------------------------------------------+
```

### Implementacao

#### Estrutura de Arquivos
```
mobile/src/screens/Profile/
  ├── ProfileScreen.tsx        # Tela principal com tabs
  ├── tabs/
  │   ├── PersonalDataTab.tsx  # Dados pessoais
  │   ├── DocumentsTab.tsx     # CNH e documentos
  │   └── VehicleTab.tsx       # Dados do veiculo
  └── components/
      └── ProfileHeader.tsx    # Foto e info basica
```

#### ProfileScreen.tsx (Refatorado)
```tsx
// mobile/src/screens/Profile/ProfileScreen.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from './components/ProfileHeader';
import PersonalDataTab from './tabs/PersonalDataTab';
import DocumentsTab from './tabs/DocumentsTab';
import VehicleTab from './tabs/VehicleTab';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'dados' | 'documentos' | 'veiculo';

const TABS: { id: TabType; label: string; icon: string }[] = [
    { id: 'dados', label: 'Dados', icon: 'person-outline' },
    { id: 'documentos', label: 'Documentos', icon: 'document-outline' },
    { id: 'veiculo', label: 'Veiculo', icon: 'car-outline' },
];

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('dados');
    const isDriver = user?.userType === 'driver';

    // Filtra tabs - cliente nao ve veiculo
    const visibleTabs = isDriver ? TABS : TABS.filter(t => t.id !== 'veiculo');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dados':
                return <PersonalDataTab />;
            case 'documentos':
                return <DocumentsTab />;
            case 'veiculo':
                return isDriver ? <VehicleTab /> : null;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header com foto */}
            <ProfileHeader onLogout={signOut} />

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {visibleTabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            activeTab === tab.id && styles.tabActive,
                        ]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.id ? '#4facfe' : '#999'}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.id && styles.tabTextActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#4facfe',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    tabTextActive: {
        color: '#4facfe',
    },
    content: {
        flex: 1,
    },
});
```

---

## 3. THEME CENTRALIZADO

### Problema Atual
- Cores diferentes em cada arquivo
- Dificil manter consistencia
- Estilos duplicados

### Solucao Proposta
**Arquivo theme.ts** com tokens de design

### Implementacao

#### theme.ts
```tsx
// mobile/src/theme/index.ts

export const colors = {
    // Primarias
    primary: '#4facfe',
    primaryDark: '#3d8fd9',
    primaryLight: '#e8f4fe',

    // Secundarias
    secondary: '#667eea',
    secondaryDark: '#5567d4',
    secondaryLight: '#f0f4ff',

    // Semanticas
    success: '#00f260',
    successLight: '#e8f8f5',
    warning: '#f39c12',
    warningLight: '#fef3e2',
    error: '#e74c3c',
    errorLight: '#ffebee',

    // Neutras
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e1e1e1',
    borderLight: '#f0f0f0',

    // WhatsApp / Social
    whatsapp: '#25D366',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const typography = {
    // Headings
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: colors.text,
    },
    // Body
    body: {
        fontSize: 16,
        color: colors.text,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    // Caption
    caption: {
        fontSize: 12,
        color: colors.textMuted,
    },
    // Labels
    label: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: colors.text,
    },
    // Buttons
    button: {
        fontSize: 16,
        fontWeight: 'bold' as const,
    },
    buttonSmall: {
        fontSize: 14,
        fontWeight: '600' as const,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    primary: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
};

// Componentes comuns pre-definidos
export const components = {
    // Input padrao
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        height: 56,
        borderWidth: 1,
        borderColor: colors.border,
    },
    // Botao primario
    buttonPrimary: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.md,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        ...shadows.primary,
    },
    // Card
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
    },
    // Section
    section: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
};

export default {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    components,
};
```

#### Uso do Theme
```tsx
// Exemplo de uso em componente
import theme from '../theme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
    },
    title: {
        ...theme.typography.h1,
        marginBottom: theme.spacing.md,
    },
    card: {
        ...theme.components.card,
    },
    button: {
        ...theme.components.buttonPrimary,
    },
});
```

---

## 4. SKELETON LOADING

### Problema Atual
- Telas "piscam" ao carregar
- Usuario nao sabe se esta carregando
- Experiencia desconexa

### Solucao Proposta
**Componente Skeleton reutilizavel** com animacao shimmer

### Implementacao

#### Skeleton.tsx
```tsx
// mobile/src/components/Skeleton.tsx

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                styles.container,
                { width, height, borderRadius },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
}

// Skeletons pre-definidos
export function SkeletonText({ lines = 1, width = '100%' }: { lines?: number; width?: number | string }) {
    return (
        <View>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 && lines > 1 ? '60%' : width}
                    height={16}
                    style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
                />
            ))}
        </View>
    );
}

export function SkeletonAvatar({ size = 50 }: { size?: number }) {
    return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <SkeletonAvatar size={44} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                </View>
            </View>
            <SkeletonText lines={2} />
            <View style={styles.cardFooter}>
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width={100} height={36} borderRadius={18} />
            </View>
        </View>
    );
}

// Skeleton para lista de viagens
export function TripsListSkeleton() {
    return (
        <View>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#e1e1e1',
        overflow: 'hidden',
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        flex: 1,
        width: 200,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
});
```

#### Uso do Skeleton
```tsx
// Em TripsScreen.tsx
import { TripsListSkeleton } from '../components/Skeleton';

// Substituir loading simples:
if (loading) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={100} height={28} />
            </View>
            <View style={styles.content}>
                <TripsListSkeleton />
            </View>
        </SafeAreaView>
    );
}
```

---

## 5. WIZARD PARA CRIAR TRAJETO

### Problema Atual
- Formulario extenso (600+ linhas de scroll)
- Usuario perde contexto
- Alto abandono

### Solucao Proposta
**Wizard de 3 etapas** com indicador de progresso

### Wireframe (ASCII)
```
Etapa 1 de 3
[====------]  Trajeto

+------------------------------------------+
|           (MAPA GRANDE)                  |
|                                          |
+------------------------------------------+
|  De onde voce sai?                       |
|  +------------------------------------+  |
|  | [pin] Selecionar origem            |  |
|  +------------------------------------+  |
|                                          |
|  Para onde voce vai?                     |
|  +------------------------------------+  |
|  | [flag] Selecionar destino          |  |
|  +------------------------------------+  |
|                                          |
|        [     CONTINUAR     ]             |
+------------------------------------------+


Etapa 2 de 3
[========--]  Data e Hora

+------------------------------------------+
|  Quando voce vai viajar?                 |
|                                          |
|  +------------------------------------+  |
|  |  S   T   Q   Q   S   S   D        |  |
|  |  .   .   .   .   .   1   2        |  |
|  |  3   4   5   6   7   8   9        |  |
|  | 10  11  12  13  14  15  16        |  |
|  | ...                                |  |
|  +------------------------------------+  |
|                                          |
|  Horario de partida                      |
|  +------------------------------------+  |
|  |    08:00     09:00     10:00      |  |
|  |    11:00     12:00     13:00      |  |
|  +------------------------------------+  |
|                                          |
|  [VOLTAR]          [CONTINUAR]           |
+------------------------------------------+


Etapa 3 de 3
[==========]  Capacidade

+------------------------------------------+
|  Qual a capacidade do veiculo?           |
|                                          |
|  +------------------------------------+  |
|  |    [slider visual 0 - 1000kg]     |  |
|  |         ===O================      |  |
|  |              150 kg                |  |
|  +------------------------------------+  |
|                                          |
|  Resumo do Trajeto                       |
|  +------------------------------------+  |
|  | Sao Paulo, SP -> Rio de Janeiro    |  |
|  | 28/Nov/2025 as 08:00               |  |
|  | Distancia: ~430km                  |  |
|  | Tempo estimado: ~5h30              |  |
|  +------------------------------------+  |
|                                          |
|  [VOLTAR]     [CRIAR TRAJETO]            |
+------------------------------------------+
```

### Implementacao

#### CreateTripWizard.tsx
```tsx
// mobile/src/screens/CreateTrip/CreateTripWizard.tsx

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Animated,
    Dimensions,
} from 'react-native';
import StepIndicator from './components/StepIndicator';
import Step1Route from './steps/Step1Route';
import Step2DateTime from './steps/Step2DateTime';
import Step3Capacity from './steps/Step3Capacity';

const { width } = Dimensions.get('window');

const STEPS = [
    { id: 1, title: 'Trajeto' },
    { id: 2, title: 'Data e Hora' },
    { id: 3, title: 'Capacidade' },
];

interface TripData {
    origin: any;
    destination: any;
    date: Date;
    time: string;
    capacity: number;
}

export default function CreateTripWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [tripData, setTripData] = useState<TripData>({
        origin: null,
        destination: null,
        date: new Date(),
        time: '08:00',
        capacity: 100,
    });

    const slideAnim = useRef(new Animated.Value(0)).current;

    const goToStep = (step: number) => {
        const direction = step > currentStep ? -1 : 1;

        Animated.timing(slideAnim, {
            toValue: direction * width,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setCurrentStep(step);
            slideAnim.setValue(-direction * width);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleNext = () => {
        if (currentStep < 3) {
            goToStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    };

    const updateTripData = (data: Partial<TripData>) => {
        setTripData({ ...tripData, ...data });
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1Route
                        data={tripData}
                        onUpdate={updateTripData}
                        onNext={handleNext}
                    />
                );
            case 2:
                return (
                    <Step2DateTime
                        data={tripData}
                        onUpdate={updateTripData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                    <Step3Capacity
                        data={tripData}
                        onUpdate={updateTripData}
                        onBack={handleBack}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header com indicador de progresso */}
            <View style={styles.header}>
                <Text style={styles.stepLabel}>
                    Etapa {currentStep} de {STEPS.length}
                </Text>
                <StepIndicator
                    steps={STEPS}
                    currentStep={currentStep}
                />
            </View>

            {/* Conteudo animado */}
            <Animated.View
                style={[
                    styles.content,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                {renderStep()}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    stepLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    content: {
        flex: 1,
    },
});
```

#### StepIndicator.tsx
```tsx
// mobile/src/screens/CreateTrip/components/StepIndicator.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../../theme';

interface Step {
    id: number;
    title: string;
}

interface Props {
    steps: Step[];
    currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: Props) {
    return (
        <View style={styles.container}>
            {/* Barra de progresso */}
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(currentStep / steps.length) * 100}%` },
                    ]}
                />
            </View>

            {/* Labels das etapas */}
            <View style={styles.labels}>
                {steps.map((step) => (
                    <Text
                        key={step.id}
                        style={[
                            styles.label,
                            currentStep >= step.id && styles.labelActive,
                        ]}
                    >
                        {step.title}
                    </Text>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e1e1e1',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    label: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    labelActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
});
```

---

## 6. CRONOGRAMA DE IMPLEMENTACAO

### Fase 1 - Fundacao (1-2 sprints)
- [ ] Criar `theme.ts` centralizado
- [ ] Criar componente `Skeleton`
- [ ] Aplicar theme nas telas existentes

### Fase 2 - Quick Wins (2-3 sprints)
- [ ] Refatorar `SearchTripScreen` com autocomplete
- [ ] Criar componente `AddressAutocomplete`
- [ ] Dividir `ProfileScreen` em abas

### Fase 3 - Melhorias de Fluxo (3-4 sprints)
- [ ] Implementar wizard `CreateTrip`
- [ ] Adicionar skeleton loading em todas as telas
- [ ] Melhorar feedback de erros (toasts)

### Fase 4 - Polish (2 sprints)
- [ ] Adicionar animacoes de transicao
- [ ] Testes de acessibilidade
- [ ] Ajustes de contraste e touch targets

---

## 7. METRICAS DE SUCESSO

| Metrica | Atual (estimado) | Meta |
|---------|------------------|------|
| Taxa de conclusao do cadastro de viagem | ~40% | 70%+ |
| Tempo medio para criar trajeto | ~3min | <1min |
| Taxa de abandono no perfil | ~60% | <30% |
| Tempo para primeira acao apos login | ~15s | <5s |
| Avaliacao da loja (UX) | - | 4.5+ |

---

*Documento gerado pelo UX/UI Designer do App de Entregas*
