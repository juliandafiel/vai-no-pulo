/**
 * Toast - Componente de notificacao nao-intrusiva
 *
 * Substitui Alert.alert() para feedback nao-critico
 *
 * Uso via contexto:
 *   const { showToast } = useToast();
 *   showToast('Salvo com sucesso!', 'success');
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    visible: boolean;
    message: string;
    type: ToastType;
    duration?: number;
    onHide: () => void;
    action?: {
        label: string;
        onPress: () => void;
    };
}

const TOAST_CONFIG = {
    success: {
        icon: 'checkmark-circle',
        backgroundColor: theme.colors.success,
        textColor: '#fff',
    },
    error: {
        icon: 'alert-circle',
        backgroundColor: theme.colors.error,
        textColor: '#fff',
    },
    warning: {
        icon: 'warning',
        backgroundColor: theme.colors.warning,
        textColor: '#fff',
    },
    info: {
        icon: 'information-circle',
        backgroundColor: theme.colors.primary,
        textColor: '#fff',
    },
};

export default function Toast({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onHide,
    action,
}: ToastProps) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const config = TOAST_CONFIG[type];

    useEffect(() => {
        if (visible) {
            // Anima entrada
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-hide
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onHide());
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top + 10,
                    backgroundColor: config.backgroundColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={hideToast}
                activeOpacity={0.9}
            >
                <Ionicons
                    name={config.icon as any}
                    size={24}
                    color={config.textColor}
                />
                <Text style={[styles.message, { color: config.textColor }]} numberOfLines={2}>
                    {message}
                </Text>
                {action && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            action.onPress();
                            hideToast();
                        }}
                    >
                        <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={hideToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={20} color={config.textColor} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.lg,
        zIndex: 9999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    actionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
