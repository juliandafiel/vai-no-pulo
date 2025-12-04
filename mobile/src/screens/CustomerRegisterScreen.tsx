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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { uploadDocuments } from '../services/upload';
import FaceDetectionCamera from '../components/FaceDetectionCamera';

interface CustomerData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    birthDate: string;

    // Verificação
    emailCode: string;

    // Documentos
    documentType: 'RG' | 'CNH' | '';
    documentNumber: string;
    documentFront: string | null;
    documentBack: string | null;

    // Opcionais
    profilePhoto: string | null;
    favoriteAddresses: {
        home?: string;
        work?: string;
    };

    // Aceite de políticas
    acceptedPolicies: boolean;
}

export default function CustomerRegisterScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Dados pessoais, 2: Verificação, 3: Opcionais
    const [showFaceVerification, setShowFaceVerification] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Função para formatar número de cartão
    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        if (cleaned.length <= 12) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)}`;
    };

    // Função para formatar validade do cartão
    const formatCardExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    };

    const [customerData, setCustomerData] = useState<CustomerData>({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        emailCode: '',
        documentType: '',
        documentNumber: '',
        documentFront: null,
        documentBack: null,
        profilePhoto: null,
        favoriteAddresses: {},
        acceptedPolicies: false,
    });

    // Função para verificar se o email já está cadastrado
    async function checkEmailExists(email: string) {
        if (!email || !email.trim()) {
            setEmailError(null);
            return;
        }

        // Valida formato do email primeiro
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Digite um e-mail válido');
            return;
        }

        setCheckingEmail(true);
        try {
            const response = await api.post('/auth/check-email', { email: email.trim() });
            if (response.data.exists) {
                setEmailError('Este e-mail já está cadastrado');
            } else {
                setEmailError(null);
            }
        } catch (error) {
            console.error('Erro ao verificar email:', error);
            setEmailError(null); // Em caso de erro, não bloqueia
        } finally {
            setCheckingEmail(false);
        }
    }

    async function pickImage(imageType: 'profile' | 'documentFront' | 'documentBack') {
        // Para foto de perfil, oferece verificação facial
        if (imageType === 'profile') {
            Alert.alert(
                'Foto de Perfil',
                'Como deseja adicionar sua foto?',
                [
                    {
                        text: 'Verificação Facial',
                        onPress: () => setShowFaceVerification(true),
                    },
                    {
                        text: 'Galeria',
                        onPress: () => chooseFromGallery(imageType),
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                ]
            );
        } else {
            // Para documentos, mantém opção de câmera e galeria
            Alert.alert(
                'Escolha uma opção',
                'Como deseja adicionar a foto?',
                [
                    {
                        text: 'Tirar Foto',
                        onPress: () => takePhoto(imageType),
                    },
                    {
                        text: 'Galeria',
                        onPress: () => chooseFromGallery(imageType),
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                ]
            );
        }
    }

    function handleFaceCapture(uri: string) {
        setCustomerData({ ...customerData, profilePhoto: uri });
        setShowFaceVerification(false);
        Alert.alert('Sucesso!', 'Sua foto de perfil foi capturada com verificação facial.');
    }

    async function takePhoto(imageType: 'profile' | 'documentFront' | 'documentBack') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: imageType === 'profile',
            aspect: imageType === 'profile' ? [1, 1] : [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (imageType === 'profile') {
                setCustomerData({ ...customerData, profilePhoto: result.assets[0].uri });
            } else if (imageType === 'documentFront') {
                setCustomerData({ ...customerData, documentFront: result.assets[0].uri });
            } else {
                setCustomerData({ ...customerData, documentBack: result.assets[0].uri });
            }
        }
    }

    async function chooseFromGallery(imageType: 'profile' | 'documentFront' | 'documentBack') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: imageType === 'profile',
            aspect: imageType === 'profile' ? [1, 1] : [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (imageType === 'profile') {
                setCustomerData({ ...customerData, profilePhoto: result.assets[0].uri });
            } else if (imageType === 'documentFront') {
                setCustomerData({ ...customerData, documentFront: result.assets[0].uri });
            } else {
                setCustomerData({ ...customerData, documentBack: result.assets[0].uri });
            }
        }
    }

    function validateStep1(): boolean {
        if (!customerData.fullName || customerData.fullName.length < 3) {
            Alert.alert('Atenção', 'Digite seu nome completo');
            return false;
        }

        // Valida que pelo menos um método de contato foi fornecido
        const hasEmail = customerData.email && customerData.email.trim().length > 0;
        const hasPhone = customerData.phone && customerData.phone.replace(/\D/g, '').length >= 10;

        if (!hasEmail && !hasPhone) {
            Alert.alert('Atenção', 'Digite pelo menos um método de contato: e-mail ou telefone');
            return false;
        }

        // Valida e-mail se foi fornecido
        if (hasEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerData.email)) {
                Alert.alert('Atenção', 'Digite um e-mail válido');
                return false;
            }

            // Verifica se há erro de email já cadastrado
            if (emailError) {
                Alert.alert('Atenção', emailError);
                return false;
            }
        }

        // Valida telefone se foi fornecido
        if (hasPhone) {
            const phoneDigits = customerData.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                Alert.alert('Atenção', 'Digite um telefone válido com DDD');
                return false;
            }
        }

        if (!customerData.password || customerData.password.length < 6) {
            Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres');
            return false;
        }

        if (customerData.password !== customerData.confirmPassword) {
            Alert.alert('Atenção', 'As senhas não coincidem');
            return false;
        }

        if (!customerData.acceptedPolicies) {
            Alert.alert('Atenção', 'Você precisa aceitar os Termos de Uso e Política de Privacidade');
            return false;
        }

        return true;
    }

    async function sendVerificationCodes() {
        setLoading(true);
        try {
            // Envia apenas os métodos de contato fornecidos
            const payload: { email?: string; phone?: string } = {};
            if (customerData.email && customerData.email.trim().length > 0) {
                payload.email = customerData.email.trim();
            }
            if (customerData.phone && customerData.phone.replace(/\D/g, '').length >= 10) {
                payload.phone = customerData.phone; // Envia com formatação, o backend normaliza
            }

            console.log('[DEBUG] Enviando verificação com payload:', payload);

            const response = await api.post('/auth/send-verification', payload);

            const sentMethods = response.data?.sentMethods || [];
            const methodsText = sentMethods.join(' e ');

            Alert.alert('Sucesso', `Código de verificação enviado via ${methodsText}!`);
            setStep(2);
        } catch (error: any) {
            console.error('Erro ao enviar código:', error);
            const errorMessage = error.response?.data?.message || 'Não foi possível enviar o código. Verifique sua conexão.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function verifyEmailCode() {
        if (!customerData.emailCode || customerData.emailCode.length !== 6) {
            Alert.alert('Atenção', 'Digite o código de 6 dígitos recebido');
            return false;
        }

        setLoading(true);
        try {
            // Usa email ou phone como identificador (o que foi usado para enviar)
            // Normaliza da mesma forma que no envio
            let emailOrPhone = '';
            if (customerData.email && customerData.email.trim().length > 0) {
                emailOrPhone = customerData.email.trim();
            } else if (customerData.phone && customerData.phone.replace(/\D/g, '').length >= 10) {
                emailOrPhone = customerData.phone;
            }

            console.log('[DEBUG] Verificando código com:', { emailOrPhone, code: customerData.emailCode });

            await api.post('/auth/verify-code', {
                emailOrPhone: emailOrPhone,
                code: customerData.emailCode,
            });
            return true;
        } catch (error: any) {
            console.error('Erro ao verificar código:', error);
            const errorMessage = error.response?.data?.message || 'Código inválido ou expirado';
            Alert.alert('Erro', errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function validateStep2(): Promise<boolean> {
        return await verifyEmailCode();
    }

    function validateStep3(): boolean {
        if (!customerData.documentType) {
            Alert.alert('Atenção', 'Selecione o tipo de documento (RG ou CNH)');
            return false;
        }

        if (!customerData.documentNumber || customerData.documentNumber.trim().length === 0) {
            Alert.alert('Atenção', `Digite o número do ${customerData.documentType}`);
            return false;
        }

        if (!customerData.documentFront) {
            Alert.alert('Atenção', 'Tire uma foto da frente do documento');
            return false;
        }

        if (!customerData.documentBack) {
            Alert.alert('Atenção', 'Tire uma foto do verso do documento');
            return false;
        }

        return true;
    }

    async function handleRegister() {
        if (!validateStep3()) {
            return;
        }

        setLoading(true);
        try {
            // Primeiro faz upload das imagens
            console.log('[Register] Iniciando upload das imagens...');
            const uploadedUrls = await uploadDocuments({
                profilePhoto: customerData.profilePhoto,
                documentFront: customerData.documentFront,
                documentBack: customerData.documentBack,
            });
            console.log('[Register] Upload concluído:', uploadedUrls);

            // Prepara os dados com as URLs das imagens
            const registrationData = {
                ...customerData,
                profilePhoto: uploadedUrls.profilePhoto || null,
                documentFront: uploadedUrls.documentFront || null,
                documentBack: uploadedUrls.documentBack || null,
            };

            // Envia o registro
            const response = await api.post('/auth/register/customer', registrationData);
            Alert.alert(
                'Sucesso!',
                'Cadastro realizado com sucesso! Seu perfil será analisado em até 48 horas.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            console.error('Erro ao registrar:', error);
            const errorMessage = error.response?.data?.message || 'Não foi possível completar o cadastro. Tente novamente.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleNextStep() {
        if (step === 1 && validateStep1()) {
            await sendVerificationCodes();
        } else if (step === 2) {
            const isValid = await validateStep2();
            if (isValid) {
                setStep(3);
            }
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((s) => (
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
                            Preencha seus dados para criar sua conta
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nome Completo *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite seu nome completo"
                                    value={customerData.fullName}
                                    onChangeText={(text) =>
                                        setCustomerData({ ...customerData, fullName: text })
                                    }
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>E-mail (pelo menos um: e-mail ou telefone) *</Text>
                            <View style={[
                                styles.inputContainer,
                                emailError && styles.inputContainerError
                            ]}>
                                <Ionicons name="mail-outline" size={20} color={emailError ? "#dc3545" : "#666"} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="seu@email.com"
                                    value={customerData.email}
                                    onChangeText={(text) => {
                                        setCustomerData({ ...customerData, email: text });
                                        if (emailError) setEmailError(null);
                                    }}
                                    onBlur={() => checkEmailExists(customerData.email)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {checkingEmail && (
                                    <ActivityIndicator size="small" color="#4facfe" />
                                )}
                            </View>
                            {emailError && (
                                <Text style={styles.errorText}>{emailError}</Text>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Telefone (pelo menos um: e-mail ou telefone) *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="(00) 0 0000-0000"
                                    value={customerData.phone}
                                    onChangeText={(text) => {
                                        const formatted = formatPhone(text);
                                        setCustomerData({ ...customerData, phone: formatted });
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={17}
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Data de Nascimento</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="DD/MM/AAAA"
                                    value={customerData.birthDate}
                                    onChangeText={(text) => {
                                        const formatted = formatDate(text);
                                        setCustomerData({ ...customerData, birthDate: formatted });
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={10}
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
                                    value={customerData.password}
                                    onChangeText={(text) =>
                                        setCustomerData({ ...customerData, password: text })
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
                                    value={customerData.confirmPassword}
                                    onChangeText={(text) =>
                                        setCustomerData({ ...customerData, confirmPassword: text })
                                    }
                                    secureTextEntry={!showConfirmPassword}
                                    textContentType="oneTimeCode"
                                    autoComplete="off"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.policyCheckbox}
                            onPress={() =>
                                setCustomerData({
                                    ...customerData,
                                    acceptedPolicies: !customerData.acceptedPolicies,
                                })
                            }
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    customerData.acceptedPolicies && styles.checkboxChecked,
                                ]}
                            >
                                {customerData.acceptedPolicies && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </View>
                            <Text style={styles.policyText}>
                                Li e aceito os{' '}
                                <Text style={styles.policyLink}>Termos de Uso</Text> e a{' '}
                                <Text style={styles.policyLink}>Política de Privacidade</Text>
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={24} color="#4facfe" />
                            <Text style={styles.infoBoxText}>
                                Seu perfil será analisado e aprovado pela nossa equipe em até 48 horas
                            </Text>
                        </View>
                    </>
                )}

                {/* STEP 2: VERIFICAÇÃO */}
                {step === 2 && (
                    <>
                        <Text style={styles.title}>Verificação</Text>
                        <Text style={styles.subtitle}>
                            Digite o código de 6 dígitos recebido
                        </Text>

                        <View style={styles.verificationInfo}>
                            <Ionicons name="shield-checkmark" size={48} color="#00f260" />
                            <Text style={styles.verificationInfoText}>
                                Enviamos um código de verificação para:
                            </Text>
                            <Text style={styles.verificationContact}>
                                {customerData.email || customerData.phone}
                            </Text>
                            <Text style={styles.verificationNote}>
                                {customerData.email && 'Verifique também sua caixa de spam'}
                                {customerData.phone && !customerData.email && 'Verifique suas mensagens SMS'}
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Código de Verificação *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite o código de 6 dígitos"
                                    value={customerData.emailCode}
                                    onChangeText={(text) =>
                                        setCustomerData({ ...customerData, emailCode: text.replace(/\D/g, '') })
                                    }
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={sendVerificationCodes}
                            disabled={loading}
                        >
                            <Ionicons name="refresh" size={16} color="#4facfe" />
                            <Text style={styles.resendButtonText}>Reenviar código</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* STEP 3: DOCUMENTOS E DADOS ADICIONAIS */}
                {step === 3 && (
                    <>
                        <Text style={styles.title}>Finalize seu Perfil</Text>
                        <Text style={styles.subtitle}>Complete seu cadastro com documentos e dados adicionais</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Foto de Perfil (Opcional)</Text>
                            <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('profile')}>
                                {customerData.profilePhoto ? (
                                    <Image
                                        source={{ uri: customerData.profilePhoto }}
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

                        {/* DOCUMENTOS */}
                        <View style={styles.sectionDivider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Documento de Identificação *</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Documento *</Text>
                            <View style={styles.documentTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.documentTypeButton,
                                        customerData.documentType === 'RG' && styles.documentTypeButtonActive,
                                    ]}
                                    onPress={() => setCustomerData({ ...customerData, documentType: 'RG' })}
                                >
                                    <Ionicons
                                        name="card-outline"
                                        size={24}
                                        color={customerData.documentType === 'RG' ? '#4facfe' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.documentTypeLabel,
                                            customerData.documentType === 'RG' && styles.documentTypeLabelActive,
                                        ]}
                                    >
                                        RG
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.documentTypeButton,
                                        customerData.documentType === 'CNH' && styles.documentTypeButtonActive,
                                    ]}
                                    onPress={() => setCustomerData({ ...customerData, documentType: 'CNH' })}
                                >
                                    <Ionicons
                                        name="car-outline"
                                        size={24}
                                        color={customerData.documentType === 'CNH' ? '#4facfe' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.documentTypeLabel,
                                            customerData.documentType === 'CNH' && styles.documentTypeLabelActive,
                                        ]}
                                    >
                                        CNH
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {customerData.documentType && (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>
                                        Número do {customerData.documentType} *
                                    </Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="document-text-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={`Digite o número do ${customerData.documentType}`}
                                            value={customerData.documentNumber}
                                            onChangeText={(text) =>
                                                setCustomerData({ ...customerData, documentNumber: text })
                                            }
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Foto - Frente do Documento *</Text>
                                    <TouchableOpacity
                                        style={styles.documentPhotoButton}
                                        onPress={() => pickImage('documentFront')}
                                    >
                                        {customerData.documentFront ? (
                                            <Image
                                                source={{ uri: customerData.documentFront }}
                                                style={styles.documentPhotoPreview}
                                            />
                                        ) : (
                                            <View style={styles.documentPhotoPlaceholder}>
                                                <Ionicons name="camera" size={32} color="#999" />
                                                <Text style={styles.documentPhotoText}>
                                                    Tirar foto da frente
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Foto - Verso do Documento *</Text>
                                    <TouchableOpacity
                                        style={styles.documentPhotoButton}
                                        onPress={() => pickImage('documentBack')}
                                    >
                                        {customerData.documentBack ? (
                                            <Image
                                                source={{ uri: customerData.documentBack }}
                                                style={styles.documentPhotoPreview}
                                            />
                                        ) : (
                                            <View style={styles.documentPhotoPlaceholder}>
                                                <Ionicons name="camera" size={32} color="#999" />
                                                <Text style={styles.documentPhotoText}>
                                                    Tirar foto do verso
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={24} color="#4facfe" />
                                    <Text style={styles.infoBoxText}>
                                        Certifique-se que o documento está legível e todos os dados estão
                                        visíveis
                                    </Text>
                                </View>
                            </>
                        )}

                        <View style={styles.sectionDivider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Endereços (Opcional)</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Endereço: Casa (Opcional)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="home-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Rua, número, bairro"
                                    value={customerData.favoriteAddresses.home}
                                    onChangeText={(text) =>
                                        setCustomerData({
                                            ...customerData,
                                            favoriteAddresses: {
                                                ...customerData.favoriteAddresses,
                                                home: text,
                                            },
                                        })
                                    }
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Endereço: Trabalho (Opcional)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="briefcase-outline" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Rua, número, bairro"
                                    value={customerData.favoriteAddresses.work}
                                    onChangeText={(text) =>
                                        setCustomerData({
                                            ...customerData,
                                            favoriteAddresses: {
                                                ...customerData.favoriteAddresses,
                                                work: text,
                                            },
                                        })
                                    }
                                />
                            </View>
                        </View>

                        <View style={styles.permissionsBox}>
                            <Text style={styles.permissionsTitle}>Permissões Necessárias</Text>
                            <View style={styles.permissionItem}>
                                <Ionicons name="location" size={20} color="#4facfe" />
                                <Text style={styles.permissionText}>
                                    Localização em tempo real
                                </Text>
                            </View>
                            <View style={styles.permissionItem}>
                                <Ionicons name="notifications" size={20} color="#4facfe" />
                                <Text style={styles.permissionText}>Notificações</Text>
                            </View>
                            <View style={styles.permissionItem}>
                                <Ionicons name="navigate" size={20} color="#4facfe" />
                                <Text style={styles.permissionText}>Acesso ao GPS</Text>
                            </View>
                            <Text style={styles.permissionsNote}>
                                Você poderá gerenciar essas permissões nas configurações
                            </Text>
                        </View>
                    </>
                )}

                {/* BOTÕES */}
                {step < 3 ? (
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
                                <Text style={styles.buttonText}>Criar Conta</Text>
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

            {/* Modal de Verificação Facial */}
            <Modal
                visible={showFaceVerification}
                animationType="slide"
                onRequestClose={() => setShowFaceVerification(false)}
            >
                <FaceDetectionCamera
                    onCapture={handleFaceCapture}
                    onCancel={() => setShowFaceVerification(false)}
                    instruction="Posicione seu rosto na moldura para capturar sua foto de perfil"
                    requiredFacePosition="front"
                />
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
        marginBottom: 25,
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
    inputContainerError: {
        borderColor: '#dc3545',
        borderWidth: 2,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
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
    verificationInfo: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 25,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    verificationInfoText: {
        fontSize: 15,
        color: '#666',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
    },
    verificationContact: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 5,
    },
    verificationNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
        fontStyle: 'italic',
    },
    resendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        gap: 8,
    },
    resendButtonText: {
        fontSize: 15,
        color: '#4facfe',
        fontWeight: '600',
    },
    paymentMethodsContainer: {
        marginBottom: 20,
    },
    paymentMethodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    paymentMethodButtonActive: {
        borderColor: '#4facfe',
        backgroundColor: '#f0f8ff',
    },
    paymentMethodLabel: {
        fontSize: 15,
        color: '#666',
        marginLeft: 12,
        fontWeight: '500',
    },
    paymentMethodLabelActive: {
        color: '#4facfe',
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f8f5',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 13,
        color: '#00f260',
        marginLeft: 10,
        fontWeight: '500',
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
    permissionsBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    permissionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    permissionText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
    permissionsNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
        fontStyle: 'italic',
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
    policyCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    policyText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    policyLink: {
        color: '#4facfe',
        fontWeight: '600',
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
    documentTypeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    documentTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        gap: 10,
    },
    documentTypeButtonActive: {
        borderColor: '#4facfe',
        backgroundColor: '#f0f8ff',
    },
    documentTypeLabel: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    documentTypeLabelActive: {
        color: '#4facfe',
        fontWeight: '600',
    },
    documentPhotoButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
        height: 180,
    },
    documentPhotoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    documentPhotoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentPhotoText: {
        marginTop: 10,
        fontSize: 14,
        color: '#999',
    },
});
