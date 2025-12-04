/**
 * AddressAutocomplete - Campo de endereco com autocomplete
 *
 * Busca enderecos usando:
 * 1. CEP (ViaCEP) - se detectar formato de CEP
 * 2. Geocoding (Expo Location) - para texto livre
 *
 * Uso:
 *   <AddressAutocomplete
 *     label="De onde sai?"
 *     placeholder="Digite endereco ou CEP"
 *     icon="location"
 *     value={origin}
 *     onSelect={(address) => setOrigin(address)}
 *     onClear={() => setOrigin(null)}
 *   />
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import theme from '../theme';

// Tipos
export interface AddressResult {
    id: string;
    description: string;
    mainText: string;
    secondaryText: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
}

interface Props {
    label?: string;
    placeholder?: string;
    icon?: string;
    value?: AddressResult | null;
    onSelect: (address: AddressResult) => void;
    onClear?: () => void;
    disabled?: boolean;
    error?: string;
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function AddressAutocomplete({
    label,
    placeholder = 'Digite o endereco...',
    icon = 'location',
    value,
    onSelect,
    onClear,
    disabled = false,
    error,
}: Props) {
    const [query, setQuery] = useState(value?.description || '');
    const [results, setResults] = useState<AddressResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const inputRef = useRef<TextInput>(null);

    // Verifica se e um CEP
    const isCEP = (text: string): boolean => {
        const cleanText = text.replace(/\D/g, '');
        return cleanText.length === 8;
    };

    // Busca por CEP (ViaCEP)
    const searchByCEP = async (cep: string): Promise<AddressResult | null> => {
        const cleanCEP = cep.replace(/\D/g, '');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const data = await response.json();

            if (data.erro) return null;

            const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;

            // Geocodifica para obter lat/lng
            const geocodeResults = await Location.geocodeAsync(fullAddress);
            const coords = geocodeResults[0] || { latitude: 0, longitude: 0 };

            return {
                id: `cep-${cleanCEP}`,
                description: fullAddress,
                mainText: data.logradouro || data.bairro,
                secondaryText: `${data.localidade} - ${data.uf}`,
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: data.localidade,
                state: data.uf,
            };
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return null;
        }
    };

    // Busca usando Nominatim (OpenStreetMap) - mais preciso para Brasil
    const searchByNominatim = async (text: string): Promise<AddressResult[]> => {
        try {
            const searchText = encodeURIComponent(`${text}, Brasil`);
            const url = `https://nominatim.openstreetmap.org/search?q=${searchText}&format=json&addressdetails=1&limit=5&countrycodes=br`;

            console.log('[Nominatim] Buscando:', text);
            console.log('[Nominatim] URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'VaiNoPuloApp/1.0 (contact@example.com)',
                    'Accept': 'application/json',
                    'Accept-Language': 'pt-BR,pt;q=0.9',
                },
            });

            console.log('[Nominatim] Status:', response.status);

            if (!response.ok) {
                console.error('[Nominatim] Response not ok:', response.status, response.statusText);
                throw new Error(`Nominatim request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Nominatim] Resultados:', data.length);

            if (!Array.isArray(data) || data.length === 0) {
                console.log('[Nominatim] Nenhum resultado encontrado');
                return [];
            }

            return data.map((item: any, index: number) => {
                const addr = item.address || {};
                const mainText = addr.road || addr.pedestrian || addr.hamlet ||
                                 addr.village || addr.town || addr.city || item.display_name.split(',')[0];
                const city = addr.city || addr.town || addr.municipality || addr.village || '';
                const state = addr.state || '';
                const secondaryText = [city, state].filter(Boolean).join(' - ');

                console.log(`[Nominatim] Resultado ${index}:`, mainText, '-', secondaryText);

                return {
                    id: `nom-${index}-${item.place_id}`,
                    description: item.display_name,
                    mainText,
                    secondaryText,
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    city,
                    state,
                };
            });
        } catch (error) {
            console.error('[Nominatim] Erro:', error);
            return [];
        }
    };

    // Busca por texto (Geocoding) - fallback para Expo Location
    const searchByText = async (text: string): Promise<AddressResult[]> => {
        try {
            // Tenta primeiro com Nominatim (mais preciso para enderecos brasileiros)
            const nominatimResults = await searchByNominatim(text);
            if (nominatimResults.length > 0) {
                return nominatimResults;
            }

            // Fallback para Expo Location
            const searchText = text.includes('Brasil') ? text : `${text}, Brasil`;
            const geocodeResults = await Location.geocodeAsync(searchText);

            // Reverse geocode para obter enderecos formatados
            const results: AddressResult[] = [];

            for (let i = 0; i < Math.min(geocodeResults.length, 5); i++) {
                const { latitude, longitude } = geocodeResults[i];
                const reverseResults = await Location.reverseGeocodeAsync({ latitude, longitude });

                if (reverseResults.length > 0) {
                    const addr = reverseResults[0];
                    const mainText = addr.street || addr.name || text;
                    const secondaryText = [addr.city, addr.region].filter(Boolean).join(' - ');

                    results.push({
                        id: `geo-${i}-${latitude}-${longitude}`,
                        description: [mainText, secondaryText].filter(Boolean).join(', '),
                        mainText,
                        secondaryText,
                        latitude,
                        longitude,
                        city: addr.city || '',
                        state: addr.region || '',
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Erro ao buscar endereco:', error);
            return [];
        }
    };

    // Funcao de busca com debounce
    const performSearch = useCallback(
        debounce(async (text: string) => {
            console.log('[Search] performSearch chamado com:', text);

            if (text.length < 3) {
                console.log('[Search] Texto muito curto, ignorando');
                setResults([]);
                setShowResults(false);
                return;
            }

            setLoading(true);
            console.log('[Search] Iniciando busca...');

            try {
                if (isCEP(text)) {
                    console.log('[Search] Detectado CEP');
                    // Busca por CEP
                    const result = await searchByCEP(text);
                    if (result) {
                        setResults([result]);
                        setShowResults(true);
                    } else {
                        setResults([]);
                    }
                } else {
                    console.log('[Search] Buscando por texto...');
                    // Busca por texto
                    const searchResults = await searchByText(text);
                    console.log('[Search] Resultados encontrados:', searchResults.length);
                    setResults(searchResults);
                    setShowResults(searchResults.length > 0);
                }
            } catch (error) {
                console.error('[Search] Erro na busca:', error);
            } finally {
                setLoading(false);
                console.log('[Search] Busca finalizada');
            }
        }, 400),
        []
    );

    const handleChangeText = (text: string) => {
        setQuery(text);
        performSearch(text);
    };

    const handleSelect = (item: AddressResult) => {
        setQuery(item.description);
        setResults([]);
        setShowResults(false);
        Keyboard.dismiss();
        onSelect(item);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setShowResults(false);
        onClear?.();
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (results.length > 0) {
            setShowResults(true);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Delay para permitir clique em resultado
        setTimeout(() => setShowResults(false), 200);
    };

    return (
        <View style={styles.container}>
            {/* Label */}
            {label && <Text style={styles.label}>{label}</Text>}

            {/* Input */}
            <View
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    disabled && styles.inputDisabled,
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={20}
                    color={isFocused ? theme.colors.primary : theme.colors.textMuted}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    value={query}
                    onChangeText={handleChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={!disabled}
                    autoCorrect={false}
                    autoCapitalize="words"
                />
                {loading && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
                {!loading && query.length > 0 && (
                    <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Erro */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Dropdown de resultados */}
            {showResults && results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[
                                    styles.resultItem,
                                    index === results.length - 1 && styles.resultItemLast,
                                ]}
                                onPress={() => handleSelect(item)}
                            >
                                <Ionicons name="location" size={18} color={theme.colors.textSecondary} />
                                <View style={styles.resultText}>
                                    <Text style={styles.mainText} numberOfLines={1}>
                                        {item.mainText}
                                    </Text>
                                    {item.secondaryText && (
                                        <Text style={styles.secondaryText} numberOfLines={1}>
                                            {item.secondaryText}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.resultsList}
                    />
                </View>
            )}

            {/* Mensagem de nenhum resultado */}
            {showResults && results.length === 0 && !loading && query.length >= 3 && (
                <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>Nenhum endereco encontrado</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
        zIndex: 10,
    },
    label: {
        ...theme.typography.label,
        marginBottom: theme.spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        height: 56,
        borderWidth: 2,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    inputFocused: {
        borderColor: theme.colors.primary,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    inputDisabled: {
        backgroundColor: theme.colors.borderLight,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    errorText: {
        ...theme.typography.caption,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: 88, // label height + input height + spacing
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        maxHeight: 250,
        ...theme.shadows.lg,
        zIndex: 100,
    },
    resultsList: {
        maxHeight: 250,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    resultItemLast: {
        borderBottomWidth: 0,
    },
    resultText: {
        flex: 1,
    },
    mainText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    secondaryText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },

    // No results
    noResults: {
        position: 'absolute',
        top: 88,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xl,
        alignItems: 'center',
        ...theme.shadows.md,
        zIndex: 100,
    },
    noResultsText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textMuted,
    },
});
