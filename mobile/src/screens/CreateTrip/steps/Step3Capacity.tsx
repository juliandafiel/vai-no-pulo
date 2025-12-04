/**
 * Step3Capacity - Etapa 3: Capacidade e confirmacao
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import theme from '../../../theme';
import { AddressResult } from '../../../components/AddressAutocomplete';

interface TripData {
    origin: AddressResult | null;
    destination: AddressResult | null;
    date: Date;
    time: string;
    capacity: number;
    availableWeight: number;
}

interface Props {
    data: TripData;
    onUpdate: (data: Partial<TripData>) => void;
    onBack: () => void;
}

const CAPACITY_PRESETS = [50, 100, 200, 500, 1000];

export default function Step3Capacity({ data, onUpdate, onBack }: Props) {
    const navigation = useNavigation<any>();
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');

    const handleCapacityChange = useCallback((value: number) => {
        onUpdate({ capacity: Math.round(value), availableWeight: Math.round(value) });
    }, [onUpdate]);

    const handlePresetSelect = useCallback((value: number) => {
        onUpdate({ capacity: value, availableWeight: value });
    }, [onUpdate]);

    const handleCreateTrip = useCallback(async () => {
        if (!data.origin || !data.destination) {
            Alert.alert('Erro', 'Origem e destino sao obrigatorios');
            return;
        }

        setSaving(true);
        try {
            // Combina data e hora
            const [hours, minutes] = data.time.split(':');
            const departureDateTime = new Date(data.date);
            departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            await api.post('/trips', {
                origin: data.origin.city || data.origin.mainText,
                destination: data.destination.city || data.destination.mainText,
                originAddress: data.origin.description,
                destinationAddress: data.destination.description,
                originLat: data.origin.latitude,
                originLng: data.origin.longitude,
                destLat: data.destination.latitude,
                destLng: data.destination.longitude,
                date: departureDateTime.toISOString(),
                departureTime: data.time,
                availableWeight: data.availableWeight,
                notes,
            });

            Alert.alert(
                'Trajeto Criado!',
                'Seu trajeto foi cadastrado com sucesso. Agora clientes podem encontrar voce.',
                [
                    {
                        text: 'Ver Meus Trajetos',
                        onPress: () => navigation.navigate('TripsMain'),
                    },
                ]
            );
        } catch (error: any) {
            console.log('Erro ao criar trajeto:', error.response?.data);
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar trajeto');
        } finally {
            setSaving(false);
        }
    }, [data, notes, navigation]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Secao de capacidade */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="cube-outline" size={22} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>Capacidade disponivel</Text>
                </View>

                <Text style={styles.description}>
                    Informe quanto peso voce pode transportar nesta viagem
                </Text>

                {/* Display do valor */}
                <View style={styles.capacityDisplay}>
                    <Text style={styles.capacityValue}>{data.capacity}</Text>
                    <Text style={styles.capacityUnit}>kg</Text>
                </View>

                {/* Slider */}
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={10}
                        maximumValue={1500}
                        step={10}
                        value={data.capacity}
                        onValueChange={handleCapacityChange}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.border}
                        thumbTintColor={theme.colors.primary}
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>10kg</Text>
                        <Text style={styles.sliderLabel}>1500kg</Text>
                    </View>
                </View>

                {/* Presets */}
                <View style={styles.presetsContainer}>
                    {CAPACITY_PRESETS.map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[
                                styles.presetButton,
                                data.capacity === preset && styles.presetButtonSelected,
                            ]}
                            onPress={() => handlePresetSelect(preset)}
                        >
                            <Text
                                style={[
                                    styles.presetText,
                                    data.capacity === preset && styles.presetTextSelected,
                                ]}
                            >
                                {preset}kg
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Observacoes */}
            <View style={styles.notesSection}>
                <View style={styles.notesSectionHeader}>
                    <View style={styles.notesSectionIcon}>
                        <Ionicons name="create-outline" size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.notesSectionTitle}>Observacoes</Text>
                        <Text style={styles.notesSectionSubtitle}>Opcional - ajude os clientes a entender sua viagem</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.notesInput}
                    placeholder="Ex: Aceito apenas caixas ate 30kg, nao transporto frageis, tenho espaco para 3 volumes medios..."
                    placeholderTextColor={theme.colors.textMuted + '99'}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                />
            </View>

            {/* Resumo final */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumo do Trajeto</Text>

                <View style={styles.summaryRow}>
                    <Ionicons name="location" size={18} color={theme.colors.primary} />
                    <Text style={styles.summaryLabel}>Origem:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                        {data.origin?.city || data.origin?.mainText || '-'}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Ionicons name="flag" size={18} color={theme.colors.success} />
                    <Text style={styles.summaryLabel}>Destino:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                        {data.destination?.city || data.destination?.mainText || '-'}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Ionicons name="calendar" size={18} color={theme.colors.secondary} />
                    <Text style={styles.summaryLabel}>Data:</Text>
                    <Text style={styles.summaryValue}>
                        {data.date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })} as {data.time}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Ionicons name="cube" size={18} color={theme.colors.warning} />
                    <Text style={styles.summaryLabel}>Capacidade:</Text>
                    <Text style={styles.summaryValue}>{data.capacity} kg</Text>
                </View>
            </View>

            {/* Botoes */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                    disabled={saving}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.createButton, saving && styles.createButtonDisabled]}
                    onPress={handleCreateTrip}
                    activeOpacity={0.8}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.createButtonText}>Criando...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.createButtonText}>Criar Trajeto</Text>
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
    section: {
        ...theme.components.section,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.h4,
    },
    description: {
        ...theme.typography.bodySmall,
        marginBottom: theme.spacing.xl,
    },
    capacityDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    capacityValue: {
        fontSize: 64,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    capacityUnit: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginLeft: theme.spacing.xs,
    },
    sliderContainer: {
        marginBottom: theme.spacing.xl,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderLabel: {
        ...theme.typography.caption,
    },
    presetsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    presetButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    presetButtonSelected: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    presetText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    presetTextSelected: {
        color: theme.colors.primary,
    },
    notesSection: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderWidth: 2,
        borderColor: theme.colors.secondary + '30',
        ...theme.shadows.sm,
    },
    notesSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    notesSectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notesSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    notesSectionSubtitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    notesInput: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        fontSize: 15,
        color: theme.colors.text,
        minHeight: 110,
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        ...theme.shadows.md,
    },
    summaryTitle: {
        ...theme.typography.h4,
        marginBottom: theme.spacing.lg,
        color: theme.colors.primary,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        width: 70,
    },
    summaryValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        gap: theme.spacing.sm,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    createButton: {
        flex: 2.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.success,
        gap: theme.spacing.sm,
        ...theme.shadows.success,
        elevation: 4,
    },
    createButtonDisabled: {
        backgroundColor: theme.colors.border,
        elevation: 0,
    },
    createButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
});
