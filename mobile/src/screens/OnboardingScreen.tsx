/**
 * OnboardingScreen - Telas de introducao para novos usuarios
 *
 * 4 slides explicando o app:
 * 1. Bem-vindo
 * 2. Envie mercadorias
 * 3. Seja motorista
 * 4. Rastreie em tempo real
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    icon: string;
    title: string;
    description: string;
    colors: string[];
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        icon: 'rocket-outline',
        title: 'Bem-vindo ao\nVai no Pulo!',
        description: 'A forma mais inteligente de enviar e transportar mercadorias pelo Brasil.',
        colors: ['#667eea', '#764ba2'],
    },
    {
        id: '2',
        icon: 'cube-outline',
        title: 'Envie suas\nmercadorias',
        description: 'Encontre motoristas que ja vao para seu destino e economize no frete.',
        colors: ['#4facfe', '#00f2fe'],
    },
    {
        id: '3',
        icon: 'car-outline',
        title: 'Seja um\nmotorista',
        description: 'Cadastre seus trajetos e ganhe dinheiro extra transportando mercadorias.',
        colors: ['#00f260', '#0575e6'],
    },
    {
        id: '4',
        icon: 'location-outline',
        title: 'Rastreie em\ntempo real',
        description: 'Acompanhe sua mercadoria do inicio ao fim com GPS em tempo real.',
        colors: ['#f093fb', '#f5576c'],
    },
];

interface Props {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = useCallback(() => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            completeOnboarding();
        }
    }, [currentIndex]);

    const handleSkip = useCallback(() => {
        completeOnboarding();
    }, []);

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('@onboarding_complete', 'true');
        } catch (error) {
            console.log('Erro ao salvar onboarding:', error);
        }
        onComplete();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
        });

        return (
            <LinearGradient
                colors={item.colors as any}
                style={styles.slide}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View style={[styles.slideContent, { transform: [{ scale }], opacity }]}>
                    {/* Icone */}
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon as any} size={100} color="rgba(255,255,255,0.9)" />
                    </View>

                    {/* Texto */}
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </LinearGradient>
        );
    };

    const renderPagination = () => {
        return (
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    // Usando scaleX em vez de width para compatibilidade com useNativeDriver: true
                    const dotScale = scrollX.interpolate({
                        inputRange,
                        outputRange: [1, 3, 1], // escala de 8px para 24px (3x)
                        extrapolate: 'clamp',
                    });

                    const dotOpacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    transform: [{ scaleX: dotScale }],
                                    opacity: dotOpacity,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Skip button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Pular</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                scrollEventThrottle={16}
            />

            {/* Bottom section */}
            <View style={styles.bottomSection}>
                {renderPagination()}

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastSlide ? 'Comecar' : 'Proximo'}
                    </Text>
                    <Ionicons
                        name={isLastSlide ? 'checkmark' : 'arrow-forward'}
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    skipText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    slideContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 44,
    },
    description: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 26,
        maxWidth: 300,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginHorizontal: 8, // aumentado para compensar a escala
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 10,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
