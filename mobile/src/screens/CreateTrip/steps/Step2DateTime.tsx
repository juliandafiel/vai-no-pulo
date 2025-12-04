/**
 * Step2DateTime - Etapa 2: Data e hora da viagem
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    onNext: () => void;
    onBack: () => void;
}

const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function Step2DateTime({ data, onUpdate, onNext, onBack }: Props) {
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Proximos 7 dias
    const nextDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }, []);

    const formatDayName = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === tomorrow.toDateString()) return 'Amanha';

        return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    };

    const formatDayNumber = (date: Date) => {
        return date.getDate().toString();
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    };

    const isSelectedDate = (date: Date) => {
        return date.toDateString() === data.date.toDateString();
    };

    const handleDateSelect = useCallback((date: Date) => {
        onUpdate({ date });
    }, [onUpdate]);

    const handleTimeSelect = useCallback((time: string) => {
        onUpdate({ time });
    }, [onUpdate]);

    const handleDatePickerChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            onUpdate({ date: selectedDate });
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Card unificado de Data e Hora */}
            <View style={styles.dateTimeCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderIcon}>
                        <Ionicons name="calendar" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cardHeaderTitle}>📅 Data e Hora da Saida</Text>
                </View>

                {/* Secao de data */}
                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Selecione o dia</Text>

                    {/* Quick dates */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.daysScroll}
                        contentContainerStyle={styles.daysContainer}
                    >
                        {nextDays.map((date, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayButton,
                                    isSelectedDate(date) && styles.dayButtonSelected,
                                ]}
                                onPress={() => handleDateSelect(date)}
                            >
                                <Text
                                    style={[
                                        styles.dayName,
                                        isSelectedDate(date) && styles.dayNameSelected,
                                    ]}
                                >
                                    {formatDayName(date)}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayNumber,
                                        isSelectedDate(date) && styles.dayNumberSelected,
                                    ]}
                                >
                                    {formatDayNumber(date)}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayMonth,
                                        isSelectedDate(date) && styles.dayMonthSelected,
                                    ]}
                                >
                                    {formatMonth(date)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Outra data */}
                    <TouchableOpacity
                        style={styles.otherDateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.otherDateText}>Escolher outra data</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={data.date}
                            mode="date"
                            display="default"
                            onChange={handleDatePickerChange}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Divisor */}
                <View style={styles.divider} />

                {/* Secao de horario */}
                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Selecione o horario</Text>

                    <View style={styles.timeSlotsGrid}>
                        {TIME_SLOTS.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={[
                                    styles.timeSlot,
                                    data.time === time && styles.timeSlotSelected,
                                ]}
                                onPress={() => handleTimeSelect(time)}
                            >
                                <Text
                                    style={[
                                        styles.timeSlotText,
                                        data.time === time && styles.timeSlotTextSelected,
                                    ]}
                                >
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Resumo com destaque */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                </View>
                <View style={styles.summaryTextContainer}>
                    <Text style={styles.summaryLabel}>Partida programada para</Text>
                    <Text style={styles.summaryValue}>
                        {data.date.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })} as {data.time}
                    </Text>
                </View>
            </View>

            {/* Botoes */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={onNext}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cube-outline" size={20} color="#fff" />
                    <Text style={styles.nextButtonText}>Definir Capacidade</Text>
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
    dateTimeCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderWidth: 2,
        borderColor: theme.colors.primary + '30',
        ...theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    cardHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardHeaderTitle: {
        ...theme.typography.h4,
        color: theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.h4,
    },
    daysScroll: {
        marginHorizontal: -theme.spacing.xl,
    },
    daysContainer: {
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    dayButton: {
        width: 70,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    dayButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayName: {
        fontSize: 12,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
    },
    dayNameSelected: {
        color: 'rgba(255,255,255,0.8)',
    },
    dayNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
        marginVertical: theme.spacing.xs,
    },
    dayNumberSelected: {
        color: '#fff',
    },
    dayMonth: {
        fontSize: 12,
        color: theme.colors.textMuted,
        textTransform: 'capitalize',
    },
    dayMonthSelected: {
        color: 'rgba(255,255,255,0.8)',
    },
    otherDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },
    otherDateText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    timeSlotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    timeSlot: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.border,
        minWidth: '30%',
        alignItems: 'center',
    },
    timeSlotSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    timeSlotText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    timeSlotTextSelected: {
        color: '#fff',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.successLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.success + '40',
    },
    summaryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.successDark,
        lineHeight: 20,
    },
    summaryText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.primary,
        lineHeight: 20,
    },
    summaryHighlight: {
        fontWeight: '700',
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
    nextButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary,
        gap: theme.spacing.sm,
        ...theme.shadows.primary,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
