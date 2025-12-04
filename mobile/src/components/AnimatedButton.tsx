import React, { useRef, useEffect } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface AnimatedButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    gradientColors?: string[];
    hapticFeedback?: boolean;
}

const GRADIENT_PRESETS: Record<ButtonVariant, string[]> = {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#4facfe', '#00f2fe'],
    outline: ['transparent', 'transparent'],
    success: ['#00f260', '#0575e6'],
    danger: ['#ff416c', '#ff4b2b'],
    ghost: ['transparent', 'transparent'],
};

const SIZE_CONFIG = {
    small: { height: 44, fontSize: 14, iconSize: 18, paddingHorizontal: 16 },
    medium: { height: 56, fontSize: 16, iconSize: 20, paddingHorizontal: 24 },
    large: { height: 64, fontSize: 18, iconSize: 24, paddingHorizontal: 32 },
};

export default function AnimatedButton({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    textStyle,
    gradientColors,
}: AnimatedButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const shadowAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shinePosition = useRef(new Animated.Value(-100)).current;

    // Efeito de brilho contínuo para botões de destaque
    useEffect(() => {
        if (variant === 'primary' || variant === 'success') {
            const shineAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(shinePosition, {
                        toValue: 400,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shinePosition, {
                        toValue: -100,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
            shineAnimation.start();
            return () => shineAnimation.stop();
        }
    }, [variant]);

    // Animação de pulso para loading
    useEffect(() => {
        if (loading) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.95,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
            return () => pulseAnimation.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [loading]);

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.95,
                friction: 5,
                tension: 200,
                useNativeDriver: true,
            }),
            Animated.timing(shadowAnim, {
                toValue: 0.5,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shadowAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const sizeConfig = SIZE_CONFIG[size];
    const colors = gradientColors || GRADIENT_PRESETS[variant];
    const isOutline = variant === 'outline' || variant === 'ghost';

    const buttonStyle: ViewStyle = {
        height: sizeConfig.height,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        width: fullWidth ? '100%' : undefined,
        borderRadius: sizeConfig.height / 4,
        opacity: disabled ? 0.5 : 1,
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={isOutline ? colors[0] : '#fff'}
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={sizeConfig.iconSize}
                            color={isOutline ? colors[0] : '#fff'}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            {
                                fontSize: sizeConfig.fontSize,
                                color: isOutline ? colors[0] : '#fff',
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={sizeConfig.iconSize}
                            color={isOutline ? colors[0] : '#fff'}
                            style={styles.iconRight}
                        />
                    )}
                </>
            )}
        </View>
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={1}
            style={[fullWidth && { width: '100%' }, style]}
        >
            <Animated.View
                style={[
                    styles.container,
                    buttonStyle,
                    isOutline && styles.outlineContainer,
                    isOutline && { borderColor: colors[0] },
                    {
                        transform: [
                            { scale: loading ? pulseAnim : scaleAnim },
                        ],
                    },
                ]}
            >
                {!isOutline ? (
                    <LinearGradient
                        colors={colors}
                        style={[styles.gradient, buttonStyle]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Efeito de brilho */}
                        <Animated.View
                            style={[
                                styles.shine,
                                {
                                    transform: [{ translateX: shinePosition }],
                                },
                            ]}
                        />
                        {renderContent()}
                    </LinearGradient>
                ) : (
                    renderContent()
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    outlineContainer: {
        borderWidth: 2,
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    gradient: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
});

// Componente de botão com ícone circular
interface IconButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: number;
    disabled?: boolean;
    loading?: boolean;
}

export function AnimatedIconButton({
    icon,
    onPress,
    variant = 'primary',
    size = 56,
    disabled = false,
    loading = false,
}: IconButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (loading) {
            const rotateAnimation = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            );
            rotateAnimation.start();
            return () => rotateAnimation.stop();
        } else {
            rotateAnim.setValue(0);
        }
    }, [loading]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            friction: 5,
            tension: 200,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const colors = GRADIENT_PRESETS[variant];
    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    iconButtonStyles.container,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        opacity: disabled ? 0.5 : 1,
                        transform: [
                            { scale: scaleAnim },
                            { rotate: loading ? spin : '0deg' },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={colors}
                    style={[
                        iconButtonStyles.gradient,
                        { borderRadius: size / 2 },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name={icon}
                            size={size * 0.45}
                            color="#fff"
                        />
                    )}
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
}

const iconButtonStyles = StyleSheet.create({
    container: {
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
