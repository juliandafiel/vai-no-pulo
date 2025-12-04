import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { uploadDocuments, uploadFaceVerificationPhotos, uploadImage } from '../services/upload';
import FaceDetectionCamera from '../components/FaceDetectionCamera';

const VEHICLE_TYPES = [
    { id: 'car', label: 'Carro', icon: 'car-outline' },
    { id: 'van', label: 'Van', icon: 'bus-outline' },
    { id: 'truck', label: 'Caminhão', icon: 'cube-outline' },
    { id: 'motorcycle', label: 'Moto', icon: 'bicycle-outline' },
];

const BRAZILIAN_BANKS = [
    { code: '001', name: 'Banco do Brasil' },
    { code: '033', name: 'Santander' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Bradesco' },
    { code: '341', name: 'Itaú' },
    { code: '356', name: 'Banco Real' },
    { code: '389', name: 'Banco Mercantil do Brasil' },
    { code: '399', name: 'HSBC' },
    { code: '422', name: 'Banco Safra' },
    { code: '453', name: 'Banco Rural' },
    { code: '633', name: 'Banco Rendimento' },
    { code: '652', name: 'Itaú Unibanco' },
    { code: '745', name: 'Citibank' },
    { code: '077', name: 'Banco Inter' },
    { code: '260', name: 'Nubank' },
    { code: '290', name: 'Pagseguro' },
    { code: '323', name: 'Mercado Pago' },
    { code: '655', name: 'Banco Votorantim' },
    { code: '041', name: 'Banrisul' },
    { code: '070', name: 'BRB - Banco de Brasília' },
    { code: '136', name: 'Unicred' },
    { code: '748', name: 'Sicredi' },
    { code: '756', name: 'Bancoob (Sicoob)' },
    { code: '212', name: 'Banco Original' },
    { code: '739', name: 'Banco Cetelem' },
    { code: '743', name: 'Banco Semear' },
    { code: '336', name: 'Banco C6' },
    { code: '380', name: 'PicPay' },
    { code: '450', name: 'Banco Ribeirão Preto' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function DriverRegisterScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Pessoais, 2: CNH, 3: Veículo, 4: Financeiro

    // Função para formatar telefone
    const formatPhone = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 3) return `(${cleaned.slice(0, 2)})${cleaned.slice(2)}`;
        if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    };

    // Função para formatar data
    const formatDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    };

    // Função para formatar CPF
    const formatCPF = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
        if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    };

    // Função para formatar RG
    const formatRG = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
        if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8, 9)}`;
    };

    // Função para formatar placa de veículo (ABC-1234 ou ABC1D23)
    const formatPlate = (text: string) => {
        const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (cleaned.length <= 3) return cleaned;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
    };

    // Função para validar CPF
    const validateCPF = (cpf: string): boolean => {
        const cleanCPF = cpf.replace(/\D/g, '');

        if (cleanCPF.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cleanCPF)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

        return true;
    };

    // Função para verificar se email já existe
    const checkEmailExists = async (email: string) => {
        if (!email || !email.trim()) {
            setEmailError('');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Digite um e-mail válido');
            return;
        }

        setCheckingEmail(true);
        try {
            const response = await api.post('/auth/check-email', { email: email.trim().toLowerCase() });
            if (response.data.exists) {
                setEmailError('Este e-mail já está cadastrado');
            } else {
                setEmailError('');
            }
        } catch (error) {
            console.error('Erro ao verificar email:', error);
            setEmailError('');
        } finally {
            setCheckingEmail(false);
        }
    };

    // Função para validar CPF ao sair do campo
    const handleCPFBlur = () => {
        if (documentType === 'cpf' && driverData.cpf) {
            const cleanCPF = driverData.cpf.replace(/\D/g, '');
            if (cleanCPF.length === 11 && !validateCPF(driverData.cpf)) {
                setCpfError('CPF inválido');
            } else {
                setCpfError('');
            }
        }
    };

    const [driverData, setDriverData] = useState({
        // Dados pessoais
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        cpf: '',
        rg: '',
        birthDate: '',

        // CNH
        cnh: '',
        cnhCategory: 'B',
        cnhExpiry: '',
        profilePhoto: null as string | null,
        documents: [] as Array<{ id: string; name: string; uri: string; type: string }>,

        // Veículo
        vehicle: {
            type: 'car',
            brand: '',
            model: '',
            year: '',
            color: '',
            licensePlate: '',
            renavam: '',
            photo: null as string | null,
            crlv: null as string | null,
        },

        // Financeiro
        paymentMethod: 'pix' as 'pix' | 'bank', // PIX ou Conta Bancária
        pixKey: '',
        bankAccount: {
            bank: '',
            accountType: 'corrente',
            accountNumber: '',
            agency: '',
            accountHolder: '',
        },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [showFaceVerification, setShowFaceVerification] = useState(false);
    const [faceVerificationStep, setFaceVerificationStep] = useState(0);
    const [emailError, setEmailError] = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [cpfError, setCpfError] = useState('');
    const [documentType, setDocumentType] = useState<'cpf' | 'rg'>('cpf'); // Escolha entre CPF ou RG
    const [facePhotos, setFacePhotos] = useState({
        front: null as string | null,
        left: null as string | null,
        right: null as string | null,
        up: null as string | null,
    });

    async function pickProfilePhoto() {
        // Mostra opções para escolher entre câmera e galeria
        Alert.alert(
            'Foto de Perfil (Selfie)',
            'Como deseja adicionar sua foto?',
            [
                {
                    text: 'Verificação Facial',
                    onPress: () => startFaceVerification(),
                },
                {
                    text: 'Galeria',
                    onPress: () => chooseProfileFromGallery(),
                },
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
            ]
        );
    }

    async function startFaceVerification() {
        // Reseta o processo de verificação
        setFaceVerificationStep(0);
        setFacePhotos({
            front: null,
            left: null,
            right: null,
            up: null,
        });
        setShowFaceVerification(true);
    }

    function handleFaceCapture(uri: string) {
        const currentStep = faceVerificationSteps[faceVerificationStep];

        // Atualiza a foto do passo atual
        setFacePhotos((prev) => ({
            ...prev,
            [currentStep.key]: uri,
        }));

        // Se for o primeiro passo (frente), define como foto de perfil
        if (faceVerificationStep === 0) {
            setDriverData({ ...driverData, profilePhoto: uri });
        }

        // Avança para o próximo passo ou finaliza
        if (faceVerificationStep < faceVerificationSteps.length - 1) {
            setFaceVerificationStep(faceVerificationStep + 1);
        } else {
            // Finaliza a verificação
            setShowFaceVerification(false);
            Alert.alert(
                'Verificação Concluída!',
                'Todas as fotos foram capturadas com sucesso. Sua verificação facial está completa.'
            );
        }
    }

    const faceVerificationSteps = [
        { key: 'front', title: 'Olhe para frente', icon: 'happy-outline', description: 'Posicione seu rosto de frente para a câmera' },
        { key: 'left', title: 'Vire para a esquerda', icon: 'arrow-back', description: 'Vire seu rosto para a esquerda' },
        { key: 'right', title: 'Vire para a direita', icon: 'arrow-forward', description: 'Vire seu rosto para a direita' },
        { key: 'up', title: 'Olhe para cima', icon: 'arrow-up', description: 'Incline sua cabeça levemente para cima' },
    ];

    async function takeFaceVerificationPhoto() {
        const currentStep = faceVerificationSteps[faceVerificationStep];

        const result = await ImagePicker.launchCameraAsync({
            cameraType: ImagePicker.CameraType.front,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            const photoUri = result.assets[0].uri;

            // Atualiza a foto do passo atual
            setFacePhotos((prev) => ({
                ...prev,
                [currentStep.key]: photoUri,
            }));

            // Se for o primeiro passo (frente), define como foto de perfil
            if (faceVerificationStep === 0) {
                setDriverData({ ...driverData, profilePhoto: photoUri });
            }

            // Avança para o próximo passo ou finaliza
            if (faceVerificationStep < faceVerificationSteps.length - 1) {
                setFaceVerificationStep(faceVerificationStep + 1);
            } else {
                // Finaliza a verificação
                setShowFaceVerification(false);
                Alert.alert(
                    'Verificação Concluída!',
                    'Sua foto de perfil foi capturada com sucesso.'
                );
            }
        }
    }

    async function takeProfilePhoto() {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar selfie');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            cameraType: ImagePicker.CameraType.front, // Câmera frontal para selfie
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setDriverData({ ...driverData, profilePhoto: result.assets[0].uri });
        }
    }

    async function chooseProfileFromGallery() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setDriverData({ ...driverData, profilePhoto: result.assets[0].uri });
        }
    }

    async function pickImage(field: string) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (field === 'vehiclePhoto') {
                setDriverData({
                    ...driverData,
                    vehicle: { ...driverData.vehicle, photo: result.assets[0].uri },
                });
            }
        }
    }

    async function addDocument() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            console.log('[DEBUG] DocumentPicker result:', result);

            // Versão mais recente do expo-document-picker usa 'canceled'
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const newDocument = {
                    id: Date.now().toString(),
                    name: asset.name,
                    uri: asset.uri,
                    type: asset.mimeType || 'unknown',
                };

                console.log('[DEBUG] Adicionando documento:', newDocument);

                setDriverData({
                    ...driverData,
                    documents: [...driverData.documents, newDocument],
                });

                Alert.alert('Sucesso', `Documento "${asset.name}" adicionado!`);
            } else if (result.canceled) {
                console.log('[DEBUG] Usuário cancelou a seleção');
            } else {
                // Fallback para versão antiga da API
                if ((result as any).type === 'success') {
                    const legacyResult = result as any;
                    const newDocument = {
                        id: Date.now().toString(),
                        name: legacyResult.name,
                        uri: legacyResult.uri,
                        type: legacyResult.mimeType || 'unknown',
                    };

                    console.log('[DEBUG] Adicionando documento (API antiga):', newDocument);

                    setDriverData({
                        ...driverData,
                        documents: [...driverData.documents, newDocument],
                    });

                    Alert.alert('Sucesso', `Documento "${legacyResult.name}" adicionado!`);
                }
            }
        } catch (error) {
            console.error('[ERROR] Erro ao selecionar documento:', error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento: ' + error.message);
        }
    }

    function removeDocument(documentId: string) {
        Alert.alert(
            'Remover Documento',
            'Deseja remover este documento?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        setDriverData({
                            ...driverData,
                            documents: driverData.documents.filter(doc => doc.id !== documentId),
                        });
                    },
                },
            ]
        );
    }

    async function pickDocument(field: string) {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            console.log('[DEBUG] pickDocument result:', result);

            // Versão mais recente do expo-document-picker
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (field === 'crlv') {
                    setDriverData({
                        ...driverData,
                        vehicle: { ...driverData.vehicle, crlv: asset.uri },
                    });
                }
            } else if ((result as any).type === 'success') {
                // Fallback para versão antiga
                const legacyResult = result as any;
                if (field === 'crlv') {
                    setDriverData({
                        ...driverData,
                        vehicle: { ...driverData.vehicle, crlv: legacyResult.uri },
                    });
                }
            }
        } catch (error) {
            console.error('[ERROR] Erro ao selecionar documento:', error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento: ' + error.message);
        }
    }

    function validateStep1(): boolean {
        if (!driverData.fullName || driverData.fullName.length < 3) {
            Alert.alert('Atenção', 'Digite seu nome completo');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(driverData.email)) {
            Alert.alert('Atenção', 'Digite um e-mail válido');
            return false;
        }

        // Verifica se email já está cadastrado
        if (emailError) {
            Alert.alert('Atenção', emailError);
            return false;
        }

        // Remove formatação para validar o telefone
        const phoneDigits = driverData.phone.replace(/\D/g, '');
        if (!phoneDigits || phoneDigits.length < 10) {
            Alert.alert('Atenção', 'Digite um telefone válido com DDD');
            return false;
        }

        // Valida CPF ou RG (apenas um é obrigatório)
        if (documentType === 'cpf') {
            const cpfDigits = driverData.cpf.replace(/\D/g, '');
            if (!cpfDigits || cpfDigits.length < 11) {
                Alert.alert('Atenção', 'Digite um CPF válido com 11 dígitos');
                return false;
            }
            if (!validateCPF(driverData.cpf)) {
                Alert.alert('Atenção', 'CPF inválido. Verifique os dígitos informados.');
                return false;
            }
        } else {
            // documentType === 'rg'
            const rgDigits = driverData.rg.replace(/\D/g, '');
            if (!rgDigits || rgDigits.length < 7) {
                Alert.alert('Atenção', 'Digite um RG válido');
                return false;
            }
        }

        if (!driverData.password || driverData.password.length < 6) {
            Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres');
            return false;
        }

        if (driverData.password !== driverData.confirmPassword) {
            Alert.alert('Atenção', 'As senhas não coincidem');
            return false;
        }

        return true;
    }

    function validateStep2(): boolean {
        if (!driverData.cnh) {
            Alert.alert('Atenção', 'Digite o número da CNH');
            return false;
        }

        if (!driverData.cnhExpiry) {
            Alert.alert('Atenção', 'Digite a validade da CNH');
            return false;
        }

        if (!driverData.profilePhoto) {
            Alert.alert('Atenção', 'Adicione uma foto de perfil (selfie)');
            return false;
        }

        if (driverData.documents.length === 0) {
            Alert.alert(
                'Atenção',
                'Envie pelo menos um documento (CNH frente/verso, Certidão de Antecedentes, Comprovante de Residência, etc.)'
            );
            return false;
        }

        return true;
    }

    function validateStep3(): boolean {
        if (!driverData.vehicle.brand || !driverData.vehicle.model) {
            Alert.alert('Atenção', 'Preencha os dados do veículo');
            return false;
        }

        if (!driverData.vehicle.licensePlate) {
            Alert.alert('Atenção', 'Digite a placa do veículo');
            return false;
        }

        // Validação opcional - foto e CRLV podem ser enviados depois
        return true;
    }

    function validateStep4(): boolean {
        if (driverData.paymentMethod === 'pix') {
            // Validação PIX
            if (!driverData.pixKey || driverData.pixKey.trim().length === 0) {
                Alert.alert('Atenção', 'Digite sua chave PIX');
                return false;
            }
        } else if (driverData.paymentMethod === 'bank') {
            // Validação Conta Bancária
            if (!driverData.bankAccount.accountHolder || driverData.bankAccount.accountHolder.trim().length === 0) {
                Alert.alert('Atenção', 'Digite o nome do titular da conta');
                return false;
            }
            if (!driverData.bankAccount.bank || driverData.bankAccount.bank.trim().length === 0) {
                Alert.alert('Atenção', 'Digite o nome do banco');
                return false;
            }
            if (!driverData.bankAccount.agency || driverData.bankAccount.agency.trim().length === 0) {
                Alert.alert('Atenção', 'Digite o número da agência');
                return false;
            }
            if (!driverData.bankAccount.accountNumber || driverData.bankAccount.accountNumber.trim().length === 0) {
                Alert.alert('Atenção', 'Digite o número da conta');
                return false;
            }
        }

        return true;
    }

    async function handleRegister() {
        if (!validateStep4()) return;

        setLoading(true);
        try {
            // Primeiro faz upload das imagens de documentos
            console.log('[Register Driver] Iniciando upload das imagens...');
            const uploadedDocs = await uploadDocuments({
                profilePhoto: driverData.profilePhoto,
                documentFront: driverData.documentFront,
                documentBack: driverData.documentBack,
            });
            console.log('[Register Driver] Upload de documentos concluído:', uploadedDocs);

            // Upload das fotos de verificação facial
            const uploadedFacePhotos = await uploadFaceVerificationPhotos(facePhotos);
            console.log('[Register Driver] Upload de fotos faciais concluído:', uploadedFacePhotos);

            // Upload da foto do veículo
            let vehiclePhotoUrl = driverData.vehicle.photo;
            if (vehiclePhotoUrl && vehiclePhotoUrl.startsWith('file://')) {
                console.log('[Register Driver] Fazendo upload da foto do veiculo...');
                vehiclePhotoUrl = await uploadImage(vehiclePhotoUrl, 'vehicles');
                console.log('[Register Driver] Foto do veiculo enviada:', vehiclePhotoUrl);
            }

            // Prepara os dados com as URLs das imagens
            const registrationData = {
                ...driverData,
                profilePhoto: uploadedDocs.profilePhoto || uploadedFacePhotos.front || null,
                documentFront: uploadedDocs.documentFront || null,
                documentBack: uploadedDocs.documentBack || null,
                faceVerification: uploadedFacePhotos,
                vehicle: {
                    ...driverData.vehicle,
                    photo: vehiclePhotoUrl,
                },
            };

            // Envia o registro
            const response = await api.post('/auth/register/driver', registrationData);
            Alert.alert(
                'Sucesso!',
                'Cadastro enviado para análise! Você receberá um e-mail em até 48 horas.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            console.error('Erro ao registrar motorista:', error);
            const errorMessage = error.response?.data?.message || 'Não foi possível completar o cadastro. Tente novamente.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    }

    function handleNextStep() {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        } else if (step === 3 && validateStep3()) {
            setStep(4);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    {[1, 2, 3, 4].map((s) => (
                        <View
                            key={s}
                            style={[styles.progressDot, s <= step && styles.progressDotActive]}
                        />
                    ))}
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* STEP 1: DADOS PESSOAIS */}
                {step === 1 && (
                    <>
                        <Text style={styles.title}>Dados Pessoais</Text>
                        <Text style={styles.subtitle}>
                            Preencha seus dados para criar sua conta de motorista
                        </Text>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={24} color="#4facfe" />
                            <Text style={styles.infoBoxText}>
                                Como motorista, você precisa fornecer documentação completa para
                                garantir a segurança de todos
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nome Completo *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite seu nome completo"
                                    value={driverData.fullName}
                                    onChangeText={(text) =>
                                        setDriverData({ ...driverData, fullName: text })
                                    }
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Documento *</Text>
                            <View style={styles.documentTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.documentTypeButton,
                                        documentType === 'cpf' && styles.documentTypeButtonActive,
                                    ]}
                                    onPress={() => {
                                        setDocumentType('cpf');
                                        setCpfError('');
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.documentTypeLabel,
                                            documentType === 'cpf' && styles.documentTypeLabelActive,
                                        ]}
                                    >
                                        CPF
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.documentTypeButton,
                                        documentType === 'rg' && styles.documentTypeButtonActive,
                                    ]}
                                    onPress={() => {
                                        setDocumentType('rg');
                                        setCpfError('');
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.documentTypeLabel,
                                            documentType === 'rg' && styles.documentTypeLabelActive,
                                        ]}
                                    >
                                        RG
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {documentType === 'cpf' ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>CPF *</Text>
                                <View style={[styles.inputContainer, cpfError ? styles.inputContainerError : null]}>
                                    <Ionicons name="card-outline" size={20} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="000.000.000-00"
                                        value={driverData.cpf}
                                        onChangeText={(text) => {
                                            const formatted = formatCPF(text);
                                            setDriverData({ ...driverData, cpf: formatted });
                                            setCpfError('');
                                        }}
                                        onBlur={handleCPFBlur}
                                        keyboardType="number-pad"
                                        maxLength={14}
                                    />
                                </View>
                                {cpfError ? <Text style={styles.errorText}>{cpfError}</Text> : null}
                            </View>
                        ) : (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>RG *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="card-outline" size={20} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00.000.000-0"
                                        value={driverData.rg}
                                        onChangeText={(text) => {
                                            const formatted = formatRG(text);
                                            setDriverData({ ...driverData, rg: formatted });
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={12}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Data de Nascimento *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="DD/MM/AAAA"
                                    value={driverData.birthDate}
                                    onChangeText={(text) => {
                                        const formatted = formatDate(text);
                                        setDriverData({ ...driverData, birthDate: formatted });
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>E-mail *</Text>
                            <View style={[styles.inputContainer, emailError ? styles.inputContainerError : null]}>
                                <Ionicons name="mail-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="seu@email.com"
                                    value={driverData.email}
                                    onChangeText={(text) => {
                                        setDriverData({ ...driverData, email: text });
                                        setEmailError('');
                                    }}
                                    onBlur={() => checkEmailExists(driverData.email)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="off"
                                />
                                {checkingEmail && (
                                    <ActivityIndicator size="small" color="#4facfe" />
                                )}
                            </View>
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Telefone *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="(00) 0 0000-0000"
                                    value={driverData.phone}
                                    onChangeText={(text) => {
                                        const formatted = formatPhone(text);
                                        setDriverData({ ...driverData, phone: formatted });
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={17}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Senha *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mínimo 6 caracteres"
                                    value={driverData.password}
                                    onChangeText={(text) =>
                                        setDriverData({ ...driverData, password: text })
                                    }
                                    secureTextEntry={!showPassword}
                                    textContentType="oneTimeCode"
                                    autoComplete="off"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirmar Senha *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite a senha novamente"
                                    value={driverData.confirmPassword}
                                    onChangeText={(text) =>
                                        setDriverData({ ...driverData, confirmPassword: text })
                                    }
                                    secureTextEntry={!showConfirmPassword}
                                    textContentType="oneTimeCode"
                                    autoComplete="off"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={
                                            showConfirmPassword ? 'eye-outline' : 'eye-off-outline'
                                        }
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* STEP 2: CNH E DOCUMENTOS */}
                {step === 2 && (
                    <>
                        <Text style={styles.title}>CNH e Documentação</Text>
                        <Text style={styles.subtitle}>
                            Documentos obrigatórios para motoristas parceiros
                        </Text>

                        <View style={styles.rowContainer}>
                            <View style={[styles.formGroup, { flex: 2 }]}>
                                <Text style={styles.label}>CNH (com EAR) *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Número da CNH"
                                        value={driverData.cnh}
                                        onChangeText={(text) =>
                                            setDriverData({ ...driverData, cnh: text })
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Categoria *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="B"
                                        value={driverData.cnhCategory}
                                        onChangeText={(text) =>
                                            setDriverData({ ...driverData, cnhCategory: text })
                                        }
                                        maxLength={2}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Validade da CNH *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="DD/MM/AAAA"
                                    value={driverData.cnhExpiry}
                                    onChangeText={(text) => {
                                        const formatted = formatDate(text);
                                        setDriverData({ ...driverData, cnhExpiry: formatted });
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Foto de Perfil (Selfie) *</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={pickProfilePhoto}
                            >
                                {driverData.profilePhoto ? (
                                    <Image
                                        source={{ uri: driverData.profilePhoto }}
                                        style={styles.photoPreview}
                                    />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="camera" size={40} color="#999" />
                                        <Text style={styles.photoPlaceholderText}>
                                            Tirar Selfie ou escolher da Galeria
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionDivider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Documentos Obrigatórios *</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={24} color="#4facfe" />
                            <Text style={styles.infoBoxText}>
                                Envie: CNH (frente e verso), Certidão de Antecedentes Criminais, Comprovante de Residência e outros documentos relevantes
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.addDocumentButton}
                            onPress={addDocument}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#4facfe" />
                            <Text style={styles.addDocumentButtonText}>
                                Adicionar Documento
                            </Text>
                        </TouchableOpacity>

                        {driverData.documents.length > 0 && (
                            <View style={styles.documentsList}>
                                <Text style={styles.documentsListTitle}>
                                    Documentos enviados ({driverData.documents.length})
                                </Text>
                                {driverData.documents.map((doc) => (
                                    <View key={doc.id} style={styles.documentItem}>
                                        <View style={styles.documentItemIcon}>
                                            <Ionicons
                                                name={
                                                    doc.type.includes('pdf')
                                                        ? 'document-text'
                                                        : 'image'
                                                }
                                                size={24}
                                                color="#4facfe"
                                            />
                                        </View>
                                        <View style={styles.documentItemInfo}>
                                            <Text style={styles.documentItemName} numberOfLines={1}>
                                                {doc.name}
                                            </Text>
                                            <Text style={styles.documentItemType}>
                                                {doc.type.includes('pdf') ? 'PDF' : 'Imagem'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeDocument(doc.id)}
                                            style={styles.documentItemRemove}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* STEP 3: VEÍCULO */}
                {step === 3 && (
                    <>
                        <Text style={styles.title}>Dados do Veículo</Text>
                        <Text style={styles.subtitle}>
                            Informações sobre o veículo que você utilizará
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Veículo *</Text>
                            <View style={styles.vehicleTypeContainer}>
                                {VEHICLE_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.vehicleTypeButton,
                                            driverData.vehicle.type === type.id &&
                                                styles.vehicleTypeButtonActive,
                                        ]}
                                        onPress={() =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, type: type.id },
                                            })
                                        }
                                    >
                                        <Ionicons
                                            name={type.icon as any}
                                            size={24}
                                            color={
                                                driverData.vehicle.type === type.id ? '#fff' : '#666'
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.vehicleTypeLabel,
                                                driverData.vehicle.type === type.id &&
                                                    styles.vehicleTypeLabelActive,
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.rowContainer}>
                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Marca *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Fiat"
                                        value={driverData.vehicle.brand}
                                        onChangeText={(text) =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, brand: text },
                                            })
                                        }
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Modelo *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Uno"
                                        value={driverData.vehicle.model}
                                        onChangeText={(text) =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, model: text },
                                            })
                                        }
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.rowContainer}>
                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Ano *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="2020"
                                        value={driverData.vehicle.year}
                                        onChangeText={(text) =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, year: text },
                                            })
                                        }
                                        keyboardType="number-pad"
                                        maxLength={4}
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Cor *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Branco"
                                        value={driverData.vehicle.color}
                                        onChangeText={(text) =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, color: text },
                                            })
                                        }
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.rowContainer}>
                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Placa *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ABC-1234"
                                        value={driverData.vehicle.licensePlate}
                                        onChangeText={(text) => {
                                            const formatted = formatPlate(text);
                                            setDriverData({
                                                ...driverData,
                                                vehicle: {
                                                    ...driverData.vehicle,
                                                    licensePlate: formatted,
                                                },
                                            });
                                        }}
                                        autoCapitalize="characters"
                                        maxLength={8}
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.label}>Renavam *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00000000000"
                                        value={driverData.vehicle.renavam}
                                        onChangeText={(text) =>
                                            setDriverData({
                                                ...driverData,
                                                vehicle: { ...driverData.vehicle, renavam: text },
                                            })
                                        }
                                        keyboardType="number-pad"
                                        maxLength={11}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Foto do Veículo *</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => pickImage('vehiclePhoto')}
                            >
                                {driverData.vehicle.photo ? (
                                    <Image
                                        source={{ uri: driverData.vehicle.photo }}
                                        style={styles.photoPreview}
                                    />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="camera" size={40} color="#999" />
                                        <Text style={styles.photoPlaceholderText}>
                                            Adicionar Foto
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>CRLV (Documento do Veículo) *</Text>
                            <TouchableOpacity
                                style={styles.documentButton}
                                onPress={() => pickDocument('crlv')}
                            >
                                <Ionicons
                                    name={
                                        driverData.vehicle.crlv ? 'checkmark-circle' : 'document'
                                    }
                                    size={24}
                                    color={driverData.vehicle.crlv ? '#00f260' : '#999'}
                                />
                                <Text style={styles.documentButtonText}>
                                    {driverData.vehicle.crlv
                                        ? 'Documento enviado'
                                        : 'Selecionar documento'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* STEP 4: DADOS FINANCEIROS */}
                {step === 4 && (
                    <>
                        <Text style={styles.title}>Dados Financeiros</Text>
                        <Text style={styles.subtitle}>
                            Escolha como deseja receber seus pagamentos
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Forma de Recebimento *</Text>
                            <View style={styles.paymentMethodContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentMethodButton,
                                        driverData.paymentMethod === 'pix' &&
                                            styles.paymentMethodButtonActive,
                                    ]}
                                    onPress={() =>
                                        setDriverData({ ...driverData, paymentMethod: 'pix' })
                                    }
                                >
                                    <Ionicons
                                        name="qr-code"
                                        size={24}
                                        color={driverData.paymentMethod === 'pix' ? '#fff' : '#4facfe'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentMethodLabel,
                                            driverData.paymentMethod === 'pix' &&
                                                styles.paymentMethodLabelActive,
                                        ]}
                                    >
                                        PIX
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.paymentMethodButton,
                                        driverData.paymentMethod === 'bank' &&
                                            styles.paymentMethodButtonActive,
                                    ]}
                                    onPress={() =>
                                        setDriverData({ ...driverData, paymentMethod: 'bank' })
                                    }
                                >
                                    <Ionicons
                                        name="card"
                                        size={24}
                                        color={driverData.paymentMethod === 'bank' ? '#fff' : '#4facfe'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentMethodLabel,
                                            driverData.paymentMethod === 'bank' &&
                                                styles.paymentMethodLabelActive,
                                        ]}
                                    >
                                        Conta Bancária
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {driverData.paymentMethod === 'pix' && (
                            <>
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={24} color="#4facfe" />
                                    <Text style={styles.infoBoxText}>
                                        Informe sua chave PIX para receber os pagamentos das corridas
                                    </Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Chave PIX *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="qr-code-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="CPF, e-mail, telefone ou chave aleatória"
                                            value={driverData.pixKey}
                                            onChangeText={(text) =>
                                                setDriverData({ ...driverData, pixKey: text })
                                            }
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.pixTypesInfo}>
                                    <Text style={styles.pixTypesTitle}>Tipos de chave aceitos:</Text>
                                    <View style={styles.pixTypeItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                                        <Text style={styles.pixTypeText}>CPF: 000.000.000-00</Text>
                                    </View>
                                    <View style={styles.pixTypeItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                                        <Text style={styles.pixTypeText}>E-mail: seu@email.com</Text>
                                    </View>
                                    <View style={styles.pixTypeItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                                        <Text style={styles.pixTypeText}>Telefone: (11) 9 1234-5678</Text>
                                    </View>
                                    <View style={styles.pixTypeItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00f260" />
                                        <Text style={styles.pixTypeText}>Chave Aleatória</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {driverData.paymentMethod === 'bank' && (
                            <>
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={24} color="#4facfe" />
                                    <Text style={styles.infoBoxText}>
                                        Os pagamentos serão depositados diretamente na sua conta bancária
                                    </Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Titular da Conta *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nome do titular"
                                            value={driverData.bankAccount.accountHolder}
                                            onChangeText={(text) =>
                                                setDriverData({
                                                    ...driverData,
                                                    bankAccount: {
                                                        ...driverData.bankAccount,
                                                        accountHolder: text,
                                                    },
                                                })
                                            }
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Banco *</Text>
                                    <TouchableOpacity
                                        style={styles.inputContainer}
                                        onPress={() => setShowBankPicker(true)}
                                    >
                                        <Ionicons name="business-outline" size={20} color="#666" />
                                        <Text
                                            style={[
                                                styles.input,
                                                !driverData.bankAccount.bank && styles.placeholderText,
                                            ]}
                                        >
                                            {driverData.bankAccount.bank || 'Selecione o banco'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Tipo de Conta *</Text>
                                    <View style={styles.accountTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.accountTypeButton,
                                        driverData.bankAccount.accountType === 'corrente' &&
                                            styles.accountTypeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setDriverData({
                                            ...driverData,
                                            bankAccount: {
                                                ...driverData.bankAccount,
                                                accountType: 'corrente',
                                            },
                                        })
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.accountTypeLabel,
                                            driverData.bankAccount.accountType === 'corrente' &&
                                                styles.accountTypeLabelActive,
                                        ]}
                                    >
                                        Corrente
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.accountTypeButton,
                                        driverData.bankAccount.accountType === 'poupanca' &&
                                            styles.accountTypeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setDriverData({
                                            ...driverData,
                                            bankAccount: {
                                                ...driverData.bankAccount,
                                                accountType: 'poupanca',
                                            },
                                        })
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.accountTypeLabel,
                                            driverData.bankAccount.accountType === 'poupanca' &&
                                                styles.accountTypeLabelActive,
                                        ]}
                                    >
                                        Poupança
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                                <View style={styles.rowContainer}>
                                    <View style={[styles.formGroup, styles.halfWidth]}>
                                        <Text style={styles.label}>Agência *</Text>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0000"
                                                value={driverData.bankAccount.agency}
                                                onChangeText={(text) =>
                                                    setDriverData({
                                                        ...driverData,
                                                        bankAccount: {
                                                            ...driverData.bankAccount,
                                                            agency: text,
                                                        },
                                                    })
                                                }
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={[styles.formGroup, styles.halfWidth]}>
                                        <Text style={styles.label}>Conta *</Text>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="00000-0"
                                                value={driverData.bankAccount.accountNumber}
                                                onChangeText={(text) =>
                                                    setDriverData({
                                                        ...driverData,
                                                        bankAccount: {
                                                            ...driverData.bankAccount,
                                                            accountNumber: text,
                                                        },
                                                    })
                                                }
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        <View style={styles.infoBox}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#00f260" />
                            <Text style={styles.infoBoxText}>
                                Seus dados bancários são criptografados e usados apenas para
                                transferências de pagamento
                            </Text>
                        </View>

                        <View style={styles.warningBox}>
                            <Ionicons name="time-outline" size={24} color="#f093fb" />
                            <Text style={styles.warningBoxText}>
                                Após enviar o cadastro, analisaremos seus documentos. Você receberá
                                um e-mail de confirmação em até 48 horas.
                            </Text>
                        </View>
                    </>
                )}

                {/* BOTÕES */}
                {step < 4 ? (
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleNextStep}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Continuar</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Enviar Cadastro</Text>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <Text style={styles.helpText}>
                    Ao criar uma conta, você concorda com nossos Termos de Uso e Política de
                    Privacidade
                </Text>
            </ScrollView>

            {/* MODAL DE SELEÇÃO DE BANCO */}
            <Modal
                visible={showBankPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBankPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Banco</Text>
                            <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={BRAZILIAN_BANKS}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.bankItem}
                                    onPress={() => {
                                        setDriverData({
                                            ...driverData,
                                            bankAccount: {
                                                ...driverData.bankAccount,
                                                bank: `${item.code} - ${item.name}`,
                                            },
                                        });
                                        setShowBankPicker(false);
                                    }}
                                >
                                    <View style={styles.bankItemIcon}>
                                        <Ionicons name="business" size={20} color="#4facfe" />
                                    </View>
                                    <View style={styles.bankItemInfo}>
                                        <Text style={styles.bankItemName}>{item.name}</Text>
                                        <Text style={styles.bankItemCode}>Código: {item.code}</Text>
                                    </View>
                                    {driverData.bankAccount.bank === `${item.code} - ${item.name}` && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.bankItemSeparator} />}
                        />
                    </View>
                </View>
            </Modal>

            {/* MODAL DE VERIFICAÇÃO FACIAL COM DETECÇÃO */}
            <Modal
                visible={showFaceVerification}
                animationType="slide"
                onRequestClose={() => {
                    Alert.alert(
                        'Cancelar verificação?',
                        'Você precisará refazer o processo de verificação facial.',
                        [
                            { text: 'Continuar', style: 'cancel' },
                            {
                                text: 'Cancelar',
                                style: 'destructive',
                                onPress: () => setShowFaceVerification(false),
                            },
                        ]
                    );
                }}
            >
                <View style={styles.faceDetectionContainer}>
                    {/* Progress indicator */}
                    <View style={styles.faceDetectionProgress}>
                        {faceVerificationSteps.map((step, index) => (
                            <View key={step.key} style={styles.faceDetectionProgressItem}>
                                <View
                                    style={[
                                        styles.faceDetectionProgressDot,
                                        index < faceVerificationStep && styles.faceDetectionProgressDotCompleted,
                                        index === faceVerificationStep && styles.faceDetectionProgressDotActive,
                                    ]}
                                >
                                    {index < faceVerificationStep ? (
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                    ) : (
                                        <Text style={styles.faceDetectionProgressNumber}>{index + 1}</Text>
                                    )}
                                </View>
                                <Text style={[
                                    styles.faceDetectionProgressLabel,
                                    index <= faceVerificationStep && styles.faceDetectionProgressLabelActive,
                                ]}>
                                    {step.title.split(' ').slice(-1)[0]}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Camera with face detection */}
                    <FaceDetectionCamera
                        onCapture={handleFaceCapture}
                        onCancel={() => {
                            Alert.alert(
                                'Cancelar verificação?',
                                'Você precisará refazer o processo de verificação facial.',
                                [
                                    { text: 'Continuar', style: 'cancel' },
                                    {
                                        text: 'Cancelar',
                                        style: 'destructive',
                                        onPress: () => setShowFaceVerification(false),
                                    },
                                ]
                            );
                        }}
                        instruction={faceVerificationSteps[faceVerificationStep]?.description}
                        requiredFacePosition={faceVerificationSteps[faceVerificationStep]?.key as 'front' | 'left' | 'right' | 'up'}
                    />

                    {/* Photos captured preview */}
                    {(facePhotos.front || facePhotos.left || facePhotos.right || facePhotos.up) && (
                        <View style={styles.capturedPhotosContainer}>
                            <Text style={styles.capturedPhotosTitle}>Fotos capturadas:</Text>
                            <View style={styles.capturedPhotosRow}>
                                {facePhotos.front && (
                                    <Image source={{ uri: facePhotos.front }} style={styles.capturedPhotoThumb} />
                                )}
                                {facePhotos.left && (
                                    <Image source={{ uri: facePhotos.left }} style={styles.capturedPhotoThumb} />
                                )}
                                {facePhotos.right && (
                                    <Image source={{ uri: facePhotos.right }} style={styles.capturedPhotoThumb} />
                                )}
                                {facePhotos.up && (
                                    <Image source={{ uri: facePhotos.up }} style={styles.capturedPhotoThumb} />
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e1e1e1',
    },
    progressDotActive: {
        backgroundColor: '#4facfe',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    rowContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    halfWidth: {
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 13,
        color: '#4facfe',
        marginLeft: 10,
        lineHeight: 18,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5f8',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
    },
    warningBoxText: {
        flex: 1,
        fontSize: 13,
        color: '#f093fb',
        marginLeft: 10,
        lineHeight: 18,
    },
    photoButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
        alignSelf: 'center',
        width: 150,
        height: 150,
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#999',
    },
    documentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    documentButtonText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    vehicleTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    vehicleTypeButton: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    vehicleTypeButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    vehicleTypeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
    },
    vehicleTypeLabelActive: {
        color: '#fff',
    },
    accountTypeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    accountTypeButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    accountTypeButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    accountTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    accountTypeLabelActive: {
        color: '#fff',
    },
    paymentMethodContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    paymentMethodButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
        gap: 8,
    },
    paymentMethodButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    paymentMethodLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    paymentMethodLabelActive: {
        color: '#fff',
    },
    pixTypesInfo: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
    },
    pixTypesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    pixTypeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    pixTypeText: {
        fontSize: 13,
        color: '#666',
    },
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e1e1e1',
    },
    dividerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginHorizontal: 15,
    },
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 2,
        borderColor: '#4facfe',
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    addDocumentButtonText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#4facfe',
        fontWeight: '600',
    },
    documentsList: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    documentsListTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    documentItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f0f8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    documentItemInfo: {
        flex: 1,
    },
    documentItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    documentItemType: {
        fontSize: 12,
        color: '#666',
    },
    documentItemRemove: {
        padding: 8,
    },
    button: {
        backgroundColor: '#4facfe',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    placeholderText: {
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    bankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingHorizontal: 20,
    },
    bankItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    bankItemInfo: {
        flex: 1,
    },
    bankItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    bankItemCode: {
        fontSize: 13,
        color: '#666',
    },
    bankItemSeparator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 75,
    },
    faceVerificationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceVerificationContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceVerificationClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    faceVerificationContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    faceVerificationProgress: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 40,
    },
    faceVerificationProgressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    faceVerificationProgressDotActive: {
        backgroundColor: '#4facfe',
    },
    faceVerificationIconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(79, 172, 254, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 3,
        borderColor: '#4facfe',
    },
    faceVerificationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    faceVerificationDescription: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    faceVerificationPreviewContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        overflow: 'hidden',
        marginBottom: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    faceVerificationPreview: {
        width: '100%',
        height: '100%',
    },
    faceVerificationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4facfe',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    faceVerificationButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    faceVerificationStep: {
        marginTop: 20,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    // Novos estilos para detecção facial
    faceDetectionContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    faceDetectionProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10,
    },
    faceDetectionProgressItem: {
        alignItems: 'center',
    },
    faceDetectionProgressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    faceDetectionProgressDotActive: {
        backgroundColor: '#4facfe',
        borderWidth: 2,
        borderColor: '#fff',
    },
    faceDetectionProgressDotCompleted: {
        backgroundColor: '#00f260',
    },
    faceDetectionProgressNumber: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    faceDetectionProgressLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        textTransform: 'capitalize',
    },
    faceDetectionProgressLabelActive: {
        color: '#fff',
    },
    capturedPhotosContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    capturedPhotosTitle: {
        color: '#fff',
        fontSize: 12,
        marginBottom: 10,
    },
    capturedPhotosRow: {
        flexDirection: 'row',
        gap: 10,
    },
    capturedPhotoThumb: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00f260',
    },
    // Estilos para seleção de tipo de documento (CPF/RG)
    documentTypeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    documentTypeButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    documentTypeButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    documentTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    documentTypeLabelActive: {
        color: '#fff',
    },
    // Estilos para erros
    inputContainerError: {
        borderColor: '#ff4444',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
});
