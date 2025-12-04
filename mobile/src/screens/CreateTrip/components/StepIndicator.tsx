/**
 * StepIndicator - Indicador de progresso do wizard
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import theme from '../../../theme';

interface Step {
    id: number;
    title: string;
}

interface Props {
    steps: Step[];
    currentStep: number;
    animatedProgress?: Animated.Value;
}

export default function StepIndicator({ steps, currentStep, animatedProgress }: Props) {
    const progress = ((currentStep) / steps.length) * 100;

    return (
        <View style={styles.container}>
            {/* Barra de progresso */}
            <View style={styles.progressBar}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: animatedProgress
                                ? animatedProgress.interpolate({
                                    inputRange: [0, steps.length],
                                    outputRange: ['0%', '100%'],
                                })
                                : `${progress}%`,
                        },
                    ]}
                />
            </View>

            {/* Labels */}
            <View style={styles.labels}>
                {steps.map((step) => (
                    <View key={step.id} style={styles.labelContainer}>
                        <View
                            style={[
                                styles.stepDot,
                                currentStep >= step.id && styles.stepDotActive,
                                currentStep === step.id && styles.stepDotCurrent,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.stepNumber,
                                    currentStep >= step.id && styles.stepNumberActive,
                                ]}
                            >
                                {step.id}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.stepTitle,
                                currentStep >= step.id && styles.stepTitleActive,
                            ]}
                            numberOfLines={1}
                        >
                            {step.title}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    progressBar: {
        height: 4,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    labelContainer: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    stepDotActive: {
        backgroundColor: theme.colors.primary,
    },
    stepDotCurrent: {
        backgroundColor: theme.colors.primary,
        transform: [{ scale: 1.1 }],
        ...theme.shadows.primary,
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepTitle: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    stepTitleActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
});
