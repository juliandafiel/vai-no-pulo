import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FACE_OVAL_SIZE = SCREEN_WIDTH * 0.7;

interface FaceDetectionCameraProps {
    onCapture: (uri: string) => void;
    onCancel: () => void;
    instruction?: string;
    requiredFacePosition?: 'front' | 'left' | 'right' | 'up';
}

export default function FaceDetectionCamera({
    onCapture,
    onCancel,
    instruction = 'Posicione seu rosto no oval',
    requiredFacePosition = 'front',
}: FaceDetectionCameraProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const readyTimeout = useRef<NodeJS.Timeout | null>(null);

    // Animação de pulso
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Marca como pronto após 2 segundos para dar tempo de posicionar
        readyTimeout.current = setTimeout(() => {
            setIsReady(true);
        }, 2000);

        return () => {
            if (readyTimeout.current) {
                clearTimeout(readyTimeout.current);
            }
        };
    }, []);

    // Countdown para captura
    useEffect(() => {
        if (countdown === null) return;

        if (countdown === 0) {
            capturePhoto();
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const getPositionInstruction = () => {
        switch (requiredFacePosition) {
            case 'front':
                return 'Olhe diretamente para a câmera';
            case 'left':
                return 'Vire levemente para a ESQUERDA';
            case 'right':
                return 'Vire levemente para a DIREITA';
            case 'up':
                return 'Incline a cabeça levemente para CIMA';
            default:
                return instruction;
        }
    };

    const getPositionIcon = () => {
        switch (requiredFacePosition) {
            case 'front':
                return 'happy-outline';
            case 'left':
                return 'arrow-back-circle-outline';
            case 'right':
                return 'arrow-forward-circle-outline';
            case 'up':
                return 'arrow-up-circle-outline';
            default:
                return 'scan-outline';
        }
    };

    const startCountdown = () => {
        if (!isReady || isCapturing) return;
        setCountdown(3);
    };

    const capturePhoto = async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        setCountdown(null);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: false,
            });

            if (photo?.uri) {
                onCapture(photo.uri);
            }
        } catch (error) {
            console.error('Erro ao capturar foto:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
                <Text style={styles.loadingText}>Verificando permissões...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={64} color="#999" />
                <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
                <Text style={styles.permissionText}>
                    Precisamos de acesso à câmera para capturar sua foto de perfil com segurança.
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
            >
                {/* Overlay escuro com recorte oval */}
                <View style={styles.overlay}>
                    {/* Área superior */}
                    <View style={styles.overlayTop} />

                    {/* Área do meio com oval */}
                    <View style={styles.overlayMiddle}>
                        <View style={styles.overlaySide} />
                        <Animated.View
                            style={[
                                styles.faceOval,
                                {
                                    borderColor: isReady ? '#00f260' : 'rgba(255, 255, 255, 0.5)',
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            {/* Ícone de posição */}
                            <View style={styles.positionIconContainer}>
                                <Ionicons
                                    name={getPositionIcon() as any}
                                    size={60}
                                    color="rgba(255, 255, 255, 0.3)"
                                />
                            </View>

                            {/* Guias de posicionamento */}
                            <View style={[styles.guide, styles.guideTop]} />
                            <View style={[styles.guide, styles.guideBottom]} />
                            <View style={[styles.guide, styles.guideLeft]} />
                            <View style={[styles.guide, styles.guideRight]} />

                            {/* Countdown */}
                            {countdown !== null && (
                                <View style={styles.countdownOverlay}>
                                    <Text style={styles.countdownText}>{countdown}</Text>
                                </View>
                            )}
                        </Animated.View>
                        <View style={styles.overlaySide} />
                    </View>

                    {/* Área inferior */}
                    <View style={styles.overlayBottom} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verificação Facial</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Instruções */}
                <View style={styles.instructionContainer}>
                    <View style={styles.instructionBox}>
                        <Ionicons
                            name={getPositionIcon() as any}
                            size={24}
                            color="#4facfe"
                        />
                        <Text style={styles.instructionText}>
                            {getPositionInstruction()}
                        </Text>
                    </View>
                </View>

                {/* Feedback */}
                <View style={styles.feedbackContainer}>
                    <View style={[
                        styles.feedbackBox,
                        isReady && styles.feedbackBoxSuccess
                    ]}>
                        <Ionicons
                            name={isReady ? "checkmark-circle" : "time-outline"}
                            size={24}
                            color={isReady ? "#00f260" : "#ffcc00"}
                        />
                        <Text style={styles.feedbackText}>
                            {!isReady
                                ? 'Posicione seu rosto na moldura...'
                                : countdown !== null
                                    ? 'Mantenha a posição!'
                                    : 'Pronto! Toque no botão para capturar'
                            }
                        </Text>
                    </View>
                </View>

                {/* Dicas */}
                <View style={styles.tipsContainer}>
                    <View style={styles.tipItem}>
                        <Ionicons name="sunny-outline" size={16} color="#fff" />
                        <Text style={styles.tipText}>Boa iluminação</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="glasses-outline" size={16} color="#fff" />
                        <Text style={styles.tipText}>Sem óculos escuros</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="happy-outline" size={16} color="#fff" />
                        <Text style={styles.tipText}>Rosto visível</Text>
                    </View>
                </View>

                {/* Botão de captura */}
                <View style={styles.captureContainer}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            (!isReady || isCapturing || countdown !== null) && styles.captureButtonDisabled
                        ]}
                        onPress={startCountdown}
                        disabled={!isReady || isCapturing || countdown !== null}
                    >
                        {isCapturing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : countdown !== null ? (
                            <Text style={styles.countdownButtonText}>{countdown}</Text>
                        ) : (
                            <View style={styles.captureButtonInner} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.captureHint}>
                        {!isReady
                            ? 'Aguarde...'
                            : countdown !== null
                                ? 'Capturando em...'
                                : 'Toque para iniciar captura'
                        }
                    </Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 15,
        fontSize: 16,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    permissionTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    permissionText: {
        color: '#999',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#4facfe',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 15,
    },
    cancelButtonText: {
        color: '#999',
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: FACE_OVAL_SIZE * 1.3,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    faceOval: {
        width: FACE_OVAL_SIZE,
        height: FACE_OVAL_SIZE * 1.3,
        borderRadius: FACE_OVAL_SIZE / 2,
        borderWidth: 4,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    positionIconContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    guide: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    guideTop: {
        top: 20,
        width: 40,
        height: 3,
        borderRadius: 2,
    },
    guideBottom: {
        bottom: 20,
        width: 40,
        height: 3,
        borderRadius: 2,
    },
    guideLeft: {
        left: 20,
        width: 3,
        height: 40,
        borderRadius: 2,
    },
    guideRight: {
        right: 20,
        width: 3,
        height: 40,
        borderRadius: 2,
    },
    countdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: FACE_OVAL_SIZE / 2,
    },
    countdownText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#fff',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    instructionContainer: {
        position: 'absolute',
        top: 110,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 10,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    feedbackContainer: {
        position: 'absolute',
        bottom: 200,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    feedbackBoxSuccess: {
        backgroundColor: 'rgba(0, 242, 96, 0.2)',
    },
    feedbackText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    tipsContainer: {
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    tipText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
    captureContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    countdownButtonText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    captureHint: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
        marginTop: 10,
    },
});
