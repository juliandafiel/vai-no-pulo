import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoDimensionMeasureProps {
    visible: boolean;
    onClose: () => void;
    onMeasure: (dimensions: { weight: number; height: number; width: number; length: number }) => void;
}

type MeasureMode = 'select_method' | 'ruler_mode' | 'photo_mode' | 'manual_adjust';

// Objetos de referência comuns com suas dimensões
const REFERENCE_OBJECTS = [
    { id: 'a4', name: 'Folha A4', width: 21, height: 29.7, icon: 'document-outline' },
    { id: 'smartphone', name: 'Celular (média)', width: 7.5, height: 15, icon: 'phone-portrait-outline' },
    { id: 'hand', name: 'Palmo da mão', width: 20, height: 20, icon: 'hand-left-outline' },
    { id: 'shoe', name: 'Pé/Sapato', width: 10, height: 27, icon: 'footsteps-outline' },
];

export default function VideoDimensionMeasure({ visible, onClose, onMeasure }: VideoDimensionMeasureProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [mode, setMode] = useState<MeasureMode>('select_method');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Dimensões finais
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [length, setLength] = useState('');
    const [weight, setWeight] = useState('');

    // Modo régua virtual
    const [rulerStep, setRulerStep] = useState<'front' | 'side' | 'top'>('front');
    const [rulerMeasurements, setRulerMeasurements] = useState<{ front: number; side: number; top: number }>({
        front: 0,
        side: 0,
        top: 0,
    });

    // Para o modo régua - posição do slider
    const [sliderValue, setSliderValue] = useState(50);

    // Referência selecionada
    const [selectedReference, setSelectedReference] = useState<string | null>(null);

    const cameraRef = useRef<any>(null);

    useEffect(() => {
        if (visible) {
            setMode('select_method');
            setCapturedImage(null);
            setWidth('');
            setHeight('');
            setLength('');
            setWeight('');
            setRulerStep('front');
            setRulerMeasurements({ front: 0, side: 0, top: 0 });
            setSliderValue(50);
            setSelectedReference(null);
        }
    }, [visible]);

    const takePicture = async () => {
        if (cameraRef.current) {
            setProcessing(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setCapturedImage(photo.uri);
            } catch (error) {
                console.log('Erro ao tirar foto:', error);
                Alert.alert('Erro', 'Não foi possível capturar a imagem');
            } finally {
                setProcessing(false);
            }
        }
    };

    // Estima peso baseado no volume
    const estimateWeight = (w: number, h: number, l: number): number => {
        const volumeDm3 = (w * h * l) / 1000;
        return Math.max(0.5, Math.round(volumeDm3 * 0.25 * 10) / 10);
    };

    const handleConfirmMeasurement = () => {
        const w = parseFloat(width) || 0;
        const h = parseFloat(height) || 0;
        const l = parseFloat(length) || 0;
        const wt = parseFloat(weight) || estimateWeight(w, h, l);

        if (w <= 0 || h <= 0 || l <= 0) {
            Alert.alert('Atenção', 'Preencha todas as dimensões');
            return;
        }

        onMeasure({
            width: w,
            height: h,
            length: l,
            weight: wt,
        });
        onClose();
    };

    // Modo Régua Virtual - converte posição do slider para cm
    const getSliderCm = (): number => {
        // Slider vai de 0 a 200cm
        return Math.round(sliderValue * 2);
    };

    const handleRulerConfirm = () => {
        const cm = getSliderCm();

        if (rulerStep === 'front') {
            setRulerMeasurements(prev => ({ ...prev, front: cm }));
            setWidth(cm.toString());
            setRulerStep('side');
            setSliderValue(50);
        } else if (rulerStep === 'side') {
            setRulerMeasurements(prev => ({ ...prev, side: cm }));
            setHeight(cm.toString());
            setRulerStep('top');
            setSliderValue(50);
        } else {
            setRulerMeasurements(prev => ({ ...prev, top: cm }));
            setLength(cm.toString());
            // Estima peso
            const w = parseFloat(width) || 0;
            const h = parseFloat(height) || 0;
            setWeight(estimateWeight(w, h, cm).toString());
            setMode('manual_adjust');
        }
    };

    // Renderiza seleção de método
    const renderMethodSelection = () => (
        <View style={styles.methodContainer}>
            <Ionicons name="cube-outline" size={60} color="#4facfe" />
            <Text style={styles.methodTitle}>Como você quer medir?</Text>
            <Text style={styles.methodSubtitle}>Escolha a forma mais fácil para você</Text>

            <View style={styles.methodOptions}>
                {/* Régua Virtual */}
                <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => setMode('ruler_mode')}
                >
                    <View style={styles.methodIconContainer}>
                        <Ionicons name="resize-outline" size={40} color="#4facfe" />
                    </View>
                    <Text style={styles.methodCardTitle}>Régua Virtual</Text>
                    <Text style={styles.methodCardDesc}>
                        Use a câmera como guia e ajuste o tamanho visualmente
                    </Text>
                    <View style={styles.methodBadge}>
                        <Text style={styles.methodBadgeText}>Recomendado</Text>
                    </View>
                </TouchableOpacity>

                {/* Foto + Ajuste */}
                <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => setMode('photo_mode')}
                >
                    <View style={styles.methodIconContainer}>
                        <Ionicons name="camera-outline" size={40} color="#4facfe" />
                    </View>
                    <Text style={styles.methodCardTitle}>Foto + Estimativa</Text>
                    <Text style={styles.methodCardDesc}>
                        Tire uma foto e ajuste as dimensões manualmente
                    </Text>
                </TouchableOpacity>

                {/* Inserir Manual */}
                <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => setMode('manual_adjust')}
                >
                    <View style={styles.methodIconContainer}>
                        <Ionicons name="create-outline" size={40} color="#4facfe" />
                    </View>
                    <Text style={styles.methodCardTitle}>Digitar Medidas</Text>
                    <Text style={styles.methodCardDesc}>
                        Já sabe as medidas? Digite diretamente
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Renderiza modo Régua Virtual
    const renderRulerMode = () => {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={60} color="#ccc" />
                    <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
                    <Text style={styles.permissionText}>
                        Precisamos de acesso à câmera para usar a régua virtual
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const getStepInfo = () => {
            switch (rulerStep) {
                case 'front':
                    return {
                        title: 'Medir LARGURA',
                        instruction: 'Aponte para o objeto e ajuste a barra azul para corresponder à largura',
                        icon: 'swap-horizontal',
                    };
                case 'side':
                    return {
                        title: 'Medir ALTURA',
                        instruction: 'Ajuste a barra para corresponder à altura do objeto',
                        icon: 'swap-vertical',
                    };
                case 'top':
                    return {
                        title: 'Medir COMPRIMENTO',
                        instruction: 'Veja o objeto de lado ou cima e ajuste o comprimento',
                        icon: 'resize',
                    };
            }
        };

        const stepInfo = getStepInfo();
        const currentCm = getSliderCm();

        return (
            <View style={styles.rulerContainer}>
                {/* Header com instrução */}
                <View style={styles.rulerHeader}>
                    <Ionicons name={stepInfo.icon as any} size={24} color="#4facfe" />
                    <Text style={styles.rulerTitle}>{stepInfo.title}</Text>
                </View>
                <Text style={styles.rulerInstruction}>{stepInfo.instruction}</Text>

                {/* Câmera com régua sobreposta */}
                <View style={styles.cameraWithRuler}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.rulerCamera}
                        facing="back"
                    >
                        {/* Barra de medição visual */}
                        <View style={styles.measureOverlay}>
                            {rulerStep === 'front' || rulerStep === 'top' ? (
                                // Barra horizontal
                                <View style={[styles.measureBar, { width: `${sliderValue}%` }]}>
                                    <View style={styles.measureBarEnd} />
                                    <View style={styles.measureBarLine} />
                                    <View style={styles.measureBarEnd} />
                                </View>
                            ) : (
                                // Barra vertical
                                <View style={[styles.measureBarVertical, { height: `${sliderValue}%` }]}>
                                    <View style={styles.measureBarEndV} />
                                    <View style={styles.measureBarLineV} />
                                    <View style={styles.measureBarEndV} />
                                </View>
                            )}
                        </View>

                        {/* Display da medida atual */}
                        <View style={styles.measureDisplay}>
                            <Text style={styles.measureDisplayText}>{currentCm} cm</Text>
                        </View>
                    </CameraView>
                </View>

                {/* Slider para ajustar */}
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Arraste para ajustar:</Text>
                    <View style={styles.sliderTrack}>
                        <View style={[styles.sliderFill, { width: `${sliderValue}%` }]} />
                        <View
                            style={[styles.sliderThumb, { left: `${sliderValue}%` }]}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderMove={(e) => {
                                const trackWidth = SCREEN_WIDTH - 80;
                                const x = e.nativeEvent.locationX + (sliderValue / 100 * trackWidth);
                                const newValue = Math.max(5, Math.min(100, (x / trackWidth) * 100));
                                setSliderValue(newValue);
                            }}
                        />
                    </View>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderMinMax}>10cm</Text>
                        <Text style={styles.sliderMinMax}>200cm</Text>
                    </View>
                </View>

                {/* Atalhos de tamanhos comuns */}
                <View style={styles.quickSizes}>
                    <Text style={styles.quickSizesLabel}>Tamanhos rápidos:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[10, 20, 30, 50, 70, 100, 150].map(size => (
                            <TouchableOpacity
                                key={size}
                                style={[
                                    styles.quickSizeButton,
                                    currentCm === size && styles.quickSizeButtonActive
                                ]}
                                onPress={() => setSliderValue(size / 2)}
                            >
                                <Text style={[
                                    styles.quickSizeText,
                                    currentCm === size && styles.quickSizeTextActive
                                ]}>{size}cm</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Progresso */}
                <View style={styles.rulerProgress}>
                    <View style={[styles.progressStep, rulerStep === 'front' && styles.progressStepActive]}>
                        <Text style={styles.progressStepText}>Largura</Text>
                        {rulerMeasurements.front > 0 && (
                            <Text style={styles.progressStepValue}>{rulerMeasurements.front}cm</Text>
                        )}
                    </View>
                    <View style={styles.progressArrow}>
                        <Ionicons name="arrow-forward" size={16} color="#ccc" />
                    </View>
                    <View style={[styles.progressStep, rulerStep === 'side' && styles.progressStepActive]}>
                        <Text style={styles.progressStepText}>Altura</Text>
                        {rulerMeasurements.side > 0 && (
                            <Text style={styles.progressStepValue}>{rulerMeasurements.side}cm</Text>
                        )}
                    </View>
                    <View style={styles.progressArrow}>
                        <Ionicons name="arrow-forward" size={16} color="#ccc" />
                    </View>
                    <View style={[styles.progressStep, rulerStep === 'top' && styles.progressStepActive]}>
                        <Text style={styles.progressStepText}>Compr.</Text>
                    </View>
                </View>

                {/* Botão confirmar */}
                <TouchableOpacity style={styles.rulerConfirmButton} onPress={handleRulerConfirm}>
                    <Text style={styles.rulerConfirmText}>
                        Confirmar {currentCm}cm
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    };

    // Renderiza modo foto
    const renderPhotoMode = () => {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={60} color="#ccc" />
                    <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (capturedImage) {
            return (
                <View style={styles.photoPreviewContainer}>
                    <Text style={styles.photoPreviewTitle}>Foto do Objeto</Text>
                    <Text style={styles.photoPreviewSubtitle}>
                        Olhe para a foto e estime as dimensões do objeto
                    </Text>

                    <Image source={{ uri: capturedImage }} style={styles.photoPreview} />

                    <View style={styles.photoInputs}>
                        <View style={styles.photoInputRow}>
                            <View style={styles.photoInputField}>
                                <Text style={styles.photoInputLabel}>Largura</Text>
                                <View style={styles.photoInputContainer}>
                                    <TextInput
                                        style={styles.photoInput}
                                        value={width}
                                        onChangeText={setWidth}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                    />
                                    <Text style={styles.photoInputUnit}>cm</Text>
                                </View>
                            </View>
                            <View style={styles.photoInputField}>
                                <Text style={styles.photoInputLabel}>Altura</Text>
                                <View style={styles.photoInputContainer}>
                                    <TextInput
                                        style={styles.photoInput}
                                        value={height}
                                        onChangeText={setHeight}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                    />
                                    <Text style={styles.photoInputUnit}>cm</Text>
                                </View>
                            </View>
                            <View style={styles.photoInputField}>
                                <Text style={styles.photoInputLabel}>Compr.</Text>
                                <View style={styles.photoInputContainer}>
                                    <TextInput
                                        style={styles.photoInput}
                                        value={length}
                                        onChangeText={setLength}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                    />
                                    <Text style={styles.photoInputUnit}>cm</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.photoButtons}>
                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={() => setCapturedImage(null)}
                        >
                            <Ionicons name="refresh" size={20} color="#4facfe" />
                            <Text style={styles.retakeButtonText}>Nova Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.usePhotoButton}
                            onPress={() => {
                                const w = parseFloat(width) || 0;
                                const h = parseFloat(height) || 0;
                                const l = parseFloat(length) || 0;
                                if (w > 0 && h > 0 && l > 0) {
                                    setWeight(estimateWeight(w, h, l).toString());
                                    setMode('manual_adjust');
                                } else {
                                    Alert.alert('Atenção', 'Preencha todas as dimensões');
                                }
                            }}
                        >
                            <Text style={styles.usePhotoButtonText}>Continuar</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <Text style={styles.cameraTitle}>Tire uma foto do objeto</Text>
                <Text style={styles.cameraSubtitle}>
                    Depois você irá informar as dimensões aproximadas
                </Text>

                <View style={styles.cameraWrapper}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                    >
                        <View style={styles.cameraGuide}>
                            <Ionicons name="scan-outline" size={120} color="rgba(255,255,255,0.4)" />
                        </View>
                    </CameraView>
                </View>

                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePicture}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <View style={styles.captureButtonInner} />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    // Renderiza ajuste manual / resultado
    const renderManualAdjust = () => {
        const w = parseFloat(width) || 0;
        const h = parseFloat(height) || 0;
        const l = parseFloat(length) || 0;
        const volumeM3 = (w * h * l) / 1000000;

        return (
            <ScrollView style={styles.manualContainer} contentContainerStyle={styles.manualContent}>
                <View style={styles.manualHeader}>
                    <Ionicons name="cube" size={50} color="#4facfe" />
                    <Text style={styles.manualTitle}>Dimensões do Objeto</Text>
                    <Text style={styles.manualSubtitle}>Ajuste os valores se necessário</Text>
                </View>

                <View style={styles.dimensionInputs}>
                    <View style={styles.dimensionRow}>
                        <View style={styles.dimensionField}>
                            <View style={styles.dimensionLabelRow}>
                                <Ionicons name="swap-horizontal" size={18} color="#4facfe" />
                                <Text style={styles.dimensionLabel}>Largura</Text>
                            </View>
                            <View style={styles.dimensionInputContainer}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    value={width}
                                    onChangeText={setWidth}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                        <View style={styles.dimensionField}>
                            <View style={styles.dimensionLabelRow}>
                                <Ionicons name="swap-vertical" size={18} color="#4facfe" />
                                <Text style={styles.dimensionLabel}>Altura</Text>
                            </View>
                            <View style={styles.dimensionInputContainer}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.dimensionRow}>
                        <View style={styles.dimensionField}>
                            <View style={styles.dimensionLabelRow}>
                                <Ionicons name="resize" size={18} color="#4facfe" />
                                <Text style={styles.dimensionLabel}>Comprimento</Text>
                            </View>
                            <View style={styles.dimensionInputContainer}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    value={length}
                                    onChangeText={setLength}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                />
                                <Text style={styles.dimensionUnit}>cm</Text>
                            </View>
                        </View>
                        <View style={styles.dimensionField}>
                            <View style={styles.dimensionLabelRow}>
                                <Ionicons name="scale" size={18} color="#4facfe" />
                                <Text style={styles.dimensionLabel}>Peso (est.)</Text>
                            </View>
                            <View style={styles.dimensionInputContainer}>
                                <TextInput
                                    style={styles.dimensionInput}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                />
                                <Text style={styles.dimensionUnit}>kg</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Volume calculado */}
                {w > 0 && h > 0 && l > 0 && (
                    <View style={styles.volumeCard}>
                        <Ionicons name="cube-outline" size={24} color="#00a040" />
                        <View style={styles.volumeInfo}>
                            <Text style={styles.volumeLabel}>Volume calculado</Text>
                            <Text style={styles.volumeValue}>
                                {volumeM3 < 0.001
                                    ? `${(volumeM3 * 1000000).toFixed(0)} cm³`
                                    : `${volumeM3.toFixed(3)} m³`
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Tamanhos de referência */}
                <View style={styles.referenceSection}>
                    <Text style={styles.referenceSectionTitle}>Precisa de referência?</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={styles.referenceItem}
                            onPress={() => { setWidth('30'); setHeight('20'); setLength('20'); setWeight('3'); }}
                        >
                            <Ionicons name="gift-outline" size={24} color="#666" />
                            <Text style={styles.referenceItemText}>Caixa pequena</Text>
                            <Text style={styles.referenceItemSize}>30x20x20 ~3kg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.referenceItem}
                            onPress={() => { setWidth('50'); setHeight('40'); setLength('40'); setWeight('10'); }}
                        >
                            <Ionicons name="cube-outline" size={24} color="#666" />
                            <Text style={styles.referenceItemText}>Caixa média</Text>
                            <Text style={styles.referenceItemSize}>50x40x40 ~10kg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.referenceItem}
                            onPress={() => { setWidth('60'); setHeight('50'); setLength('50'); setWeight('20'); }}
                        >
                            <Ionicons name="archive-outline" size={24} color="#666" />
                            <Text style={styles.referenceItemText}>Caixa grande</Text>
                            <Text style={styles.referenceItemSize}>60x50x50 ~20kg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.referenceItem}
                            onPress={() => { setWidth('35'); setHeight('2'); setLength('25'); setWeight('2'); }}
                        >
                            <Ionicons name="laptop-outline" size={24} color="#666" />
                            <Text style={styles.referenceItemText}>Notebook</Text>
                            <Text style={styles.referenceItemSize}>35x2x25 ~2kg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.referenceItem}
                            onPress={() => { setWidth('120'); setHeight('70'); setLength('15'); setWeight('15'); }}
                        >
                            <Ionicons name="tv-outline" size={24} color="#666" />
                            <Text style={styles.referenceItemText}>TV 50"</Text>
                            <Text style={styles.referenceItemSize}>120x70x15 ~15kg</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Botão confirmar */}
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (w <= 0 || h <= 0 || l <= 0) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmMeasurement}
                    disabled={w <= 0 || h <= 0 || l <= 0}
                >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.confirmButtonText}>Usar estas medidas</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderContent = () => {
        switch (mode) {
            case 'select_method':
                return renderMethodSelection();
            case 'ruler_mode':
                return renderRulerMode();
            case 'photo_mode':
                return renderPhotoMode();
            case 'manual_adjust':
                return renderManualAdjust();
            default:
                return renderMethodSelection();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (mode === 'select_method') {
                                onClose();
                            } else if (mode === 'manual_adjust' && (width || height || length)) {
                                setMode('select_method');
                            } else {
                                setMode('select_method');
                            }
                        }}
                    >
                        <Ionicons name={mode === 'select_method' ? "close" : "arrow-back"} size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Medir Objeto</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    // Method selection
    methodContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    methodTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    methodSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        marginBottom: 24,
    },
    methodOptions: {
        width: '100%',
        gap: 16,
    },
    methodCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    methodIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e8f4fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    methodCardDesc: {
        fontSize: 13,
        color: '#666',
        width: '100%',
        marginTop: 8,
        marginLeft: 76,
    },
    methodBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#00f260',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    methodBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Permission
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    permissionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#4facfe',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Ruler mode
    rulerContainer: {
        flex: 1,
    },
    rulerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        gap: 8,
    },
    rulerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    rulerInstruction: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
        marginTop: 8,
    },
    cameraWithRuler: {
        flex: 1,
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    rulerCamera: {
        flex: 1,
    },
    measureOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    measureBar: {
        height: 4,
        backgroundColor: '#4facfe',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 50,
    },
    measureBarEnd: {
        width: 4,
        height: 30,
        backgroundColor: '#4facfe',
    },
    measureBarLine: {
        flex: 1,
        height: 4,
        backgroundColor: '#4facfe',
    },
    measureBarVertical: {
        width: 4,
        backgroundColor: '#4facfe',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 50,
    },
    measureBarEndV: {
        width: 30,
        height: 4,
        backgroundColor: '#4facfe',
    },
    measureBarLineV: {
        flex: 1,
        width: 4,
        backgroundColor: '#4facfe',
    },
    measureDisplay: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    measureDisplayText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    sliderContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sliderLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    sliderTrack: {
        height: 40,
        backgroundColor: '#e1e1e1',
        borderRadius: 20,
        position: 'relative',
    },
    sliderFill: {
        height: '100%',
        backgroundColor: '#4facfe',
        borderRadius: 20,
    },
    sliderThumb: {
        position: 'absolute',
        top: -5,
        marginLeft: -25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#4facfe',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderMinMax: {
        fontSize: 11,
        color: '#999',
    },
    quickSizes: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    quickSizesLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    quickSizeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginRight: 8,
    },
    quickSizeButtonActive: {
        backgroundColor: '#4facfe',
    },
    quickSizeText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    quickSizeTextActive: {
        color: '#fff',
    },
    rulerProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    progressStep: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    progressStepActive: {
        backgroundColor: '#e8f4fe',
    },
    progressStepText: {
        fontSize: 12,
        color: '#666',
    },
    progressStepValue: {
        fontSize: 11,
        color: '#4facfe',
        fontWeight: 'bold',
    },
    progressArrow: {
        marginHorizontal: 8,
    },
    rulerConfirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        marginHorizontal: 20,
        marginBottom: 30,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    rulerConfirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Camera / Photo mode
    cameraContainer: {
        flex: 1,
        alignItems: 'center',
    },
    cameraTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    cameraSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        marginBottom: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    cameraWrapper: {
        flex: 1,
        width: SCREEN_WIDTH - 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    cameraGuide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    captureButtonInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#4facfe',
    },
    // Photo preview
    photoPreviewContainer: {
        flex: 1,
        padding: 16,
    },
    photoPreviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    photoPreviewSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    photoPreview: {
        flex: 1,
        borderRadius: 12,
        marginBottom: 16,
    },
    photoInputs: {
        marginBottom: 16,
    },
    photoInputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    photoInputField: {
        flex: 1,
    },
    photoInputLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    photoInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    photoInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    photoInputUnit: {
        fontSize: 14,
        color: '#666',
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4facfe',
        gap: 8,
    },
    retakeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4facfe',
    },
    usePhotoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    usePhotoButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    // Manual adjust
    manualContainer: {
        flex: 1,
    },
    manualContent: {
        padding: 20,
    },
    manualHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    manualTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    manualSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    dimensionInputs: {
        gap: 16,
    },
    dimensionRow: {
        flexDirection: 'row',
        gap: 16,
    },
    dimensionField: {
        flex: 1,
    },
    dimensionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    dimensionLabel: {
        fontSize: 13,
        color: '#666',
    },
    dimensionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    dimensionInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    dimensionUnit: {
        fontSize: 14,
        color: '#888',
    },
    volumeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6fff0',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        gap: 12,
    },
    volumeInfo: {
        flex: 1,
    },
    volumeLabel: {
        fontSize: 12,
        color: '#00a040',
    },
    volumeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00a040',
    },
    referenceSection: {
        marginTop: 24,
    },
    referenceSectionTitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    referenceItem: {
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
        minWidth: 90,
    },
    referenceItemText: {
        fontSize: 11,
        color: '#666',
        marginTop: 6,
    },
    referenceItemSize: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00f260',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 30,
        gap: 10,
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
