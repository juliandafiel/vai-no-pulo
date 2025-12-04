import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Alert,
    Dimensions,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AnimatedButton from '../components/AnimatedButton';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigation = useNavigation<any>();

    // Animações dos inputs
    const emailFocusAnim = useRef(new Animated.Value(0)).current;
    const passwordFocusAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    // Animação de flutuação do logo
    useEffect(() => {
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        floatAnimation.start();
        return () => floatAnimation.stop();
    }, []);

    const handleInputFocus = (anim: Animated.Value) => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleInputBlur = (anim: Animated.Value) => {
        Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            console.log('[LOGIN ERROR]', error);

            // Trata mensagens específicas do backend
            if (error?.response?.data?.message) {
                const message = error.response.data.message;
                const profileStatus = error.response.data.profileStatus;

                // Cadastro em análise
                if (profileStatus === 'PENDING') {
                    Alert.alert(
                        'Cadastro em Análise',
                        message,
                        [{ text: 'OK', style: 'default' }]
                    );
                    return;
                }

                // Cadastro rejeitado
                if (profileStatus === 'REJECTED') {
                    Alert.alert(
                        'Cadastro Rejeitado',
                        message,
                        [
                            { text: 'OK', style: 'default' },
                            {
                                text: 'Contatar Suporte',
                                onPress: () => {
                                    // Aqui você pode abrir um link de contato ou enviar email
                                    Alert.alert('Suporte', 'Entre em contato: suporte@vainopulo.com');
                                },
                            },
                        ]
                    );
                    return;
                }

                // Outros erros do backend
                Alert.alert('Erro', message);
            } else {
                // Erro genérico
                Alert.alert('Erro', 'Não foi possível fazer login. Verifique suas credenciais.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada');
        setModalVisible(false);
        setForgotEmail('');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                {
                                    transform: [
                                        {
                                            translateY: floatAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -10],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <LinearGradient
                                colors={['#fff', '#f0f0f0']}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="bus" size={50} color="#667eea" />
                            </LinearGradient>
                        </Animated.View>
                        <Text style={styles.title}>Vai no Pulo</Text>
                        <Text style={styles.subtitle}>Conectando pessoas e mercadorias</Text>
                    </View>

                <View style={styles.form}>
                    <Animated.View
                        style={[
                            styles.inputContainer,
                            {
                                borderColor: emailFocusAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)'],
                                }),
                                transform: [
                                    {
                                        scale: emailFocusAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.02],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-mail"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onFocus={() => handleInputFocus(emailFocusAnim)}
                            onBlur={() => handleInputBlur(emailFocusAnim)}
                        />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.inputContainer,
                            {
                                borderColor: passwordFocusAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)'],
                                }),
                                transform: [
                                    {
                                        scale: passwordFocusAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.02],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            onFocus={() => handleInputFocus(passwordFocusAnim)}
                            onBlur={() => handleInputBlur(passwordFocusAnim)}
                        />
                    </Animated.View>

                    <View style={styles.buttonContainer}>
                        <AnimatedButton
                            title="Entrar"
                            onPress={handleLogin}
                            variant="primary"
                            size="large"
                            icon="log-in-outline"
                            iconPosition="right"
                            loading={isLoading}
                            fullWidth
                            gradientColors={['#fff', '#f0f0f0']}
                            textStyle={{ color: '#667eea' }}
                        />
                    </View>

                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OU</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <AnimatedButton
                        title="Criar uma conta"
                        onPress={() => navigation.navigate('RegisterType')}
                        variant="outline"
                        size="large"
                        icon="person-add-outline"
                        iconPosition="left"
                        fullWidth
                        gradientColors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)']}
                    />
                </View>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Recuperar Senha</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Digite seu e-mail"
                                value={forgotEmail}
                                onChangeText={setForgotEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TouchableOpacity style={styles.modalButton} onPress={handleForgotPassword}>
                                <Text style={styles.modalButtonText}>Enviar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Loading Overlay */}
                <Modal
                    transparent={true}
                    visible={isLoading}
                    animationType="fade"
                >
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#667eea" />
                            <Text style={styles.loadingText}>Entrando...</Text>
                        </View>
                    </View>
                </Modal>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
        position: 'relative',
    },
    // Decorative circles
    circle1: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -width * 0.4,
        right: -width * 0.2,
    },
    circle2: {
        position: 'absolute',
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -width * 0.3,
        left: -width * 0.2,
    },
    circle3: {
        position: 'absolute',
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: height * 0.15,
        left: -width * 0.1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        zIndex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        marginTop: 10,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
        fontWeight: '300',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 16,
        marginBottom: 18,
        paddingHorizontal: 20,
        height: 60,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    buttonContainer: {
        marginTop: 25,
        width: '100%',
    },
    forgotButton: {
        marginTop: 25,
        alignItems: 'center',
        padding: 10,
    },
    forgotText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 15,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 35,
        borderRadius: 24,
        width: '88%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#333',
    },
    modalInput: {
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    modalButton: {
        backgroundColor: '#667eea',
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 12,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '600',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 16,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});
