import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface AnimatedCardProps {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    features: string[];
    buttonText: string;
    gradientColors: string[];
    onPress: () => void;
    delay: number;
}

function AnimatedCard({
    title,
    description,
    icon,
    features,
    buttonText,
    gradientColors,
    onPress,
    delay,
}: AnimatedCardProps) {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const iconRotate = useRef(new Animated.Value(0)).current;
    const iconPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Animação de pulso contínuo no ícone
            Animated.loop(
                Animated.sequence([
                    Animated.timing(iconPulse, {
                        toValue: 1.1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(iconPulse, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.97,
                friction: 5,
                tension: 200,
                useNativeDriver: true,
            }),
            Animated.timing(iconRotate, {
                toValue: 1,
                duration: 200,
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
            Animated.timing(iconRotate, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const iconSpin = iconRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'],
    });

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={styles.card}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCard}
                >
                    {/* Decorative circles */}
                    <View style={styles.decorCircle1} />
                    <View style={styles.decorCircle2} />

                    <Animated.View
                        style={[
                            styles.iconCircle,
                            {
                                transform: [
                                    { scale: iconPulse },
                                    { rotate: iconSpin },
                                ],
                            },
                        ]}
                    >
                        <Ionicons name={icon} size={40} color="#fff" />
                    </Animated.View>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDescription}>{description}</Text>
                    <View style={styles.featuresList}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.featureCheckContainer}>
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.cardButton}>
                        <Text style={styles.cardButtonText}>{buttonText}</Text>
                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function RegisterTypeScreen() {
    const navigation = useNavigation<any>();
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(headerSlide, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#f8f9fa', '#e9ecef', '#f8f9fa']}
                style={styles.backgroundGradient}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: headerFade,
                                transform: [{ translateY: headerSlide }],
                            },
                        ]}
                    >
                        <Text style={styles.title}>Bem-vindo!</Text>
                        <Text style={styles.subtitle}>
                            Escolha como você deseja usar o Vai no Pulo
                        </Text>
                    </Animated.View>

                    {/* CLIENTE */}
                    <AnimatedCard
                        title="Sou Cliente"
                        description="Preciso enviar mercadorias e encontrar motoristas de confiança"
                        icon="cube"
                        features={[
                            'Envie mercadorias com segurança',
                            'Acompanhe em tempo real',
                            'Pagamento facilitado',
                        ]}
                        buttonText="Cadastrar como Cliente"
                        gradientColors={['#00f260', '#0575e6']}
                        onPress={() => navigation.navigate('CustomerRegister')}
                        delay={200}
                    />

                    {/* MOTORISTA */}
                    <AnimatedCard
                        title="Sou Motorista"
                        description="Quero oferecer meus serviços de transporte e ganhar dinheiro"
                        icon="car-sport"
                        features={[
                            'Ganhe dinheiro transportando',
                            'Defina seus horários',
                            'Receba pagamentos seguros',
                        ]}
                        buttonText="Cadastrar como Motorista"
                        gradientColors={['#4facfe', '#667eea']}
                        onPress={() => navigation.navigate('DriverRegister')}
                        delay={400}
                    />

                    <Animated.View
                        style={{
                            opacity: headerFade,
                        }}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={20} color="#666" />
                            <Text style={styles.backButtonText}>Já tenho uma conta</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    backgroundGradient: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a1a2e',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        color: '#666',
        lineHeight: 26,
    },
    cardContainer: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    gradientCard: {
        padding: 25,
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -width * 0.2,
        right: -width * 0.1,
    },
    decorCircle2: {
        position: 'absolute',
        width: width * 0.3,
        height: width * 0.3,
        borderRadius: width * 0.15,
        backgroundColor: 'rgba(255,255,255,0.08)',
        bottom: -width * 0.1,
        left: -width * 0.05,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    cardDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 20,
        lineHeight: 24,
    },
    featuresList: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureCheckContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: '#fff',
        flex: 1,
        fontWeight: '500',
    },
    cardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    arrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        flexDirection: 'row',
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
});
