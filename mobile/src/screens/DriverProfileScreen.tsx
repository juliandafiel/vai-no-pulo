import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

// Mask functions
const maskCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskDate = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
};

const maskPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
};

const maskCEP = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
};

interface DriverProfile {
    // Dados pessoais
    fullName: string;
    cpf: string;
    rg: string;
    birthDate: string;
    phone: string;
    email: string;
    address: {
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };

    // Documentação
    cnh: string;
    cnhCategory: string;
    cnhExpiry: string;
    profilePhoto: string | null;
    criminalRecordCertificate: string | null;
    proofOfResidence: string | null;

    // Dados do veículo
    vehicle: {
        brand: string;
        model: string;
        year: string;
        color: string;
        licensePlate: string;
        renavam: string;
        type: string;
        photo: string | null;
        crlv: string | null;
    };

    // Seguros
    vehicleInspection: string | null;
    insurance: string | null;

    // Dados financeiros
    paymentMethod: 'bank' | 'pix' | 'cash' | 'other';
    bankAccount: {
        bank: string;
        accountType: string;
        accountNumber: string;
        agency: string;
        accountHolder: string;
    };
    pixKey: string;
    otherPaymentInfo: string;
}

const VEHICLE_TYPES = [
    { id: 'car', label: 'Carro', icon: 'car-outline' },
    { id: 'van', label: 'Van', icon: 'bus-outline' },
    { id: 'truck', label: 'Caminhão', icon: 'cube-outline' },
    { id: 'motorcycle', label: 'Moto', icon: 'bicycle-outline' },
];

const CNH_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

const ACCOUNT_TYPES = [
    { id: 'corrente', label: 'Corrente' },
    { id: 'poupanca', label: 'Poupança' },
];

const PAYMENT_METHODS = [
    { id: 'bank', label: 'Conta Bancária', icon: 'business-outline' },
    { id: 'pix', label: 'PIX', icon: 'flash-outline' },
    { id: 'cash', label: 'Dinheiro', icon: 'cash-outline' },
    { id: 'other', label: 'Outro', icon: 'ellipsis-horizontal-outline' },
];

export default function DriverProfileScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vehicleChangeStatus, setVehicleChangeStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [vehicleChangeRejectionReason, setVehicleChangeRejectionReason] = useState<string | null>(null);
    const [submittingVehicleChange, setSubmittingVehicleChange] = useState(false);
    const [currentVehicleId, setCurrentVehicleId] = useState<string | null>(null);

    const [profile, setProfile] = useState<DriverProfile>({
        fullName: '',
        cpf: '',
        rg: '',
        birthDate: '',
        phone: '',
        email: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
        },
        cnh: '',
        cnhCategory: 'B',
        cnhExpiry: '',
        profilePhoto: null,
        criminalRecordCertificate: null,
        proofOfResidence: null,
        vehicle: {
            brand: '',
            model: '',
            year: '',
            color: '',
            licensePlate: '',
            renavam: '',
            type: 'car',
            photo: null,
            crlv: null,
        },
        vehicleInspection: null,
        insurance: null,
        paymentMethod: 'bank',
        bankAccount: {
            bank: '',
            accountType: 'corrente',
            accountNumber: '',
            agency: '',
            accountHolder: '',
        },
        pixKey: '',
        otherPaymentInfo: '',
    });

    const [showCNHCategoryModal, setShowCNHCategoryModal] = useState(false);

    useEffect(() => {
        loadProfile();
        loadVehicleChangeStatus();
    }, []);

    async function loadProfile() {
        setLoading(true);
        try {
            const response = await api.get('/auth/profile');
            if (response.data) {
                // Mapeia os dados do backend para o formato esperado
                const userData = response.data;
                setProfile({
                    ...profile,
                    fullName: userData.name || '',
                    cpf: userData.cpf || '',
                    rg: userData.rg || '',
                    birthDate: userData.birthDate || '',
                    phone: userData.phone || '',
                    email: userData.email || '',
                    cnh: userData.cnh || '',
                    cnhCategory: userData.cnhCategory || '',
                    cnhExpiry: userData.cnhExpiry || '',
                    profilePhoto: userData.profilePhoto || null,
                });
            }

            // Carregar dados do veículo
            try {
                const vehiclesResponse = await api.get('/vehicles/my-vehicles');
                if (vehiclesResponse.data && vehiclesResponse.data.length > 0) {
                    const vehicle = vehiclesResponse.data[0]; // Pega o primeiro veículo
                    setCurrentVehicleId(vehicle.id);
                    setProfile(prev => ({
                        ...prev,
                        vehicle: {
                            brand: vehicle.brand || '',
                            model: vehicle.model || '',
                            year: vehicle.year || '',
                            color: vehicle.color || '',
                            licensePlate: vehicle.plate || '',
                            renavam: '',
                            type: 'car',
                            photo: vehicle.vehiclePhoto || null,
                            crlv: vehicle.documents?.crlv || null,
                        },
                    }));
                }
            } catch (vehicleError) {
                console.error('Erro ao carregar veículo:', vehicleError);
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadVehicleChangeStatus() {
        try {
            const response = await api.get('/vehicle-change-requests/my-requests');
            if (response.data && response.data.length > 0) {
                // Procura por solicitação pendente
                const pendingRequest = response.data.find((r: any) => r.status === 'PENDING');
                if (pendingRequest) {
                    setVehicleChangeStatus('pending');
                    return;
                }

                // Se não há pendente, verifica a mais recente
                const latestRequest = response.data[0];
                if (latestRequest.status === 'REJECTED') {
                    setVehicleChangeStatus('rejected');
                    setVehicleChangeRejectionReason(latestRequest.rejectionReason);
                } else if (latestRequest.status === 'APPROVED') {
                    setVehicleChangeStatus('approved');
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status de alteração:', error);
        }
    }

    async function pickImage(field: string) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (field === 'profilePhoto') {
                setProfile({ ...profile, profilePhoto: result.assets[0].uri });
            } else if (field === 'vehiclePhoto') {
                setProfile({
                    ...profile,
                    vehicle: { ...profile.vehicle, photo: result.assets[0].uri },
                });
            }
        }
    }

    async function pickDocument(field: string) {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                const updates: any = { ...profile };

                switch (field) {
                    case 'criminalRecord':
                        updates.criminalRecordCertificate = result.uri;
                        break;
                    case 'proofOfResidence':
                        updates.proofOfResidence = result.uri;
                        break;
                    case 'crlv':
                        updates.vehicle.crlv = result.uri;
                        break;
                    case 'inspection':
                        updates.vehicleInspection = result.uri;
                        break;
                    case 'insurance':
                        updates.insurance = result.uri;
                        break;
                }

                setProfile(updates);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar o documento');
        }
    }

    async function searchCEP(cep: string) {
        const cleanCEP = cep.replace(/\D/g, '');
        if (cleanCEP.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setProfile({
                    ...profile,
                    address: {
                        ...profile.address,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        zipCode: cep,
                    },
                });
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }

    function validateProfile(): boolean {
        if (!profile.fullName || !profile.cpf || !profile.rg) {
            Alert.alert('Atenção', 'Preencha todos os dados pessoais obrigatórios');
            return false;
        }

        if (!profile.cnh || !profile.cnhExpiry || !profile.cnhCategory) {
            Alert.alert('Atenção', 'Preencha os dados da CNH');
            return false;
        }

        if (!profile.profilePhoto) {
            Alert.alert('Atenção', 'Adicione uma foto de perfil');
            return false;
        }

        if (!profile.vehicle.brand || !profile.vehicle.licensePlate) {
            Alert.alert('Atenção', 'Preencha os dados do veículo');
            return false;
        }

        // Validação dos dados financeiros baseado no método de pagamento
        if (profile.paymentMethod === 'bank') {
            if (!profile.bankAccount.bank || !profile.bankAccount.accountNumber || !profile.bankAccount.agency) {
                Alert.alert('Atenção', 'Preencha os dados bancários');
                return false;
            }
        } else if (profile.paymentMethod === 'pix') {
            if (!profile.pixKey) {
                Alert.alert('Atenção', 'Preencha a chave PIX');
                return false;
            }
        } else if (profile.paymentMethod === 'other') {
            if (!profile.otherPaymentInfo) {
                Alert.alert('Atenção', 'Descreva como deseja receber o pagamento');
                return false;
            }
        }

        return true;
    }

    async function handleSave() {
        if (!validateProfile()) return;

        setSaving(true);
        try {
            await api.put('/drivers/profile', profile);
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSubmitVehicleChange() {
        if (!currentVehicleId) {
            Alert.alert('Erro', 'Nenhum veículo cadastrado encontrado.');
            return;
        }

        if (vehicleChangeStatus === 'pending') {
            Alert.alert('Atenção', 'Você já possui uma solicitação de alteração em análise.');
            return;
        }

        Alert.alert(
            'Solicitar Alteração de Veículo',
            'Ao confirmar, os dados atuais do veículo serão enviados para análise do administrador. Deseja continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setSubmittingVehicleChange(true);
                        try {
                            await api.post('/vehicle-change-requests', {
                                vehicleId: currentVehicleId,
                                newPlate: profile.vehicle.licensePlate,
                                newModel: profile.vehicle.model,
                                newBrand: profile.vehicle.brand,
                                newYear: profile.vehicle.year,
                                newColor: profile.vehicle.color,
                                newVehiclePhoto: profile.vehicle.photo,
                                newDocuments: profile.vehicle.crlv ? { crlv: profile.vehicle.crlv } : null,
                            });

                            setVehicleChangeStatus('pending');
                            Alert.alert(
                                'Solicitação Enviada!',
                                'Sua solicitação de alteração foi enviada para análise. Você receberá um email quando for processada.'
                            );
                        } catch (error: any) {
                            const message = error.response?.data?.message || 'Não foi possível enviar a solicitação. Tente novamente.';
                            Alert.alert('Erro', message);
                        } finally {
                            setSubmittingVehicleChange(false);
                        }
                    },
                },
            ]
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Perfil do Motorista</Text>
                <Text style={styles.subtitle}>
                    Complete todos os dados para garantir sua segurança e a dos passageiros
                </Text>

                {/* DADOS PESSOAIS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={24} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nome Completo *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Digite seu nome completo"
                                value={profile.fullName}
                                onChangeText={(text) => setProfile({ ...profile, fullName: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>CPF *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="000.000.000-00"
                                    value={profile.cpf}
                                    onChangeText={(text) => setProfile({ ...profile, cpf: maskCPF(text) })}
                                    keyboardType="number-pad"
                                    maxLength={14}
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>RG *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="00.000.000-0"
                                    value={profile.rg}
                                    onChangeText={(text) => setProfile({ ...profile, rg: text })}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Data de Nascimento *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="DD/MM/AAAA"
                                    value={profile.birthDate}
                                    onChangeText={(text) => setProfile({ ...profile, birthDate: maskDate(text) })}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Telefone *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="(00) 00000-0000"
                                    value={profile.phone}
                                    onChangeText={(text) => setProfile({ ...profile, phone: maskPhone(text) })}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>E-mail *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="seu@email.com"
                                value={profile.email}
                                onChangeText={(text) => setProfile({ ...profile, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </View>

                {/* ENDEREÇO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="home" size={24} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Endereço</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>CEP *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="00000-000"
                                value={profile.address.zipCode}
                                onChangeText={(text) => {
                                    const maskedValue = maskCEP(text);
                                    setProfile({
                                        ...profile,
                                        address: { ...profile.address, zipCode: maskedValue },
                                    });
                                    if (maskedValue.replace(/\D/g, '').length === 8) {
                                        searchCEP(maskedValue);
                                    }
                                }}
                                keyboardType="number-pad"
                                maxLength={9}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Rua *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nome da rua"
                                value={profile.address.street}
                                onChangeText={(text) =>
                                    setProfile({
                                        ...profile,
                                        address: { ...profile.address, street: text },
                                    })
                                }
                            />
                        </View>
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Número *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123"
                                    value={profile.address.number}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            address: { ...profile.address, number: text },
                                        })
                                    }
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Complemento</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Apto, bloco..."
                                    value={profile.address.complement}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            address: { ...profile.address, complement: text },
                                        })
                                    }
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Bairro *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nome do bairro"
                                value={profile.address.neighborhood}
                                onChangeText={(text) =>
                                    setProfile({
                                        ...profile,
                                        address: { ...profile.address, neighborhood: text },
                                    })
                                }
                            />
                        </View>
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.formGroup, { flex: 2 }]}>
                            <Text style={styles.label}>Cidade *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Cidade"
                                    value={profile.address.city}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            address: { ...profile.address, city: text },
                                        })
                                    }
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Estado *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="UF"
                                    value={profile.address.state}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            address: { ...profile.address, state: text },
                                        })
                                    }
                                    maxLength={2}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* DOCUMENTAÇÃO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={24} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Documentação</Text>
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.formGroup, { flex: 2 }]}>
                            <Text style={styles.label}>CNH (com EAR) *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Número da CNH"
                                    value={profile.cnh}
                                    onChangeText={(text) => setProfile({ ...profile, cnh: text })}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Categoria *</Text>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setShowCNHCategoryModal(true)}
                            >
                                <Text style={[
                                    styles.selectButtonText,
                                    !profile.cnhCategory && styles.selectButtonPlaceholder
                                ]}>
                                    {profile.cnhCategory || 'Selecione'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Validade da CNH *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="DD/MM/AAAA"
                                value={profile.cnhExpiry}
                                onChangeText={(text) => setProfile({ ...profile, cnhExpiry: maskDate(text) })}
                                keyboardType="number-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Foto de Perfil (Selfie) *</Text>
                        <TouchableOpacity
                            style={styles.photoButton}
                            onPress={() => pickImage('profilePhoto')}
                        >
                            {profile.profilePhoto ? (
                                <Image
                                    source={{ uri: profile.profilePhoto }}
                                    style={styles.photoPreview}
                                />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={40} color="#999" />
                                    <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Comprovante de Residência *</Text>
                        <TouchableOpacity
                            style={styles.documentButton}
                            onPress={() => pickDocument('proofOfResidence')}
                        >
                            <Ionicons
                                name={profile.proofOfResidence ? 'checkmark-circle' : 'document'}
                                size={24}
                                color={profile.proofOfResidence ? '#00f260' : '#999'}
                            />
                            <Text style={styles.documentButtonText}>
                                {profile.proofOfResidence
                                    ? 'Documento enviado'
                                    : 'Selecionar documento'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* DADOS DO VEÍCULO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="car" size={24} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Dados do Veículo</Text>
                    </View>

                    {/* Status de Alteração */}
                    {vehicleChangeStatus === 'pending' && (
                        <View style={styles.changeStatusBanner}>
                            <Ionicons name="time" size={20} color="#f59e0b" />
                            <Text style={styles.changeStatusText}>Alteração em análise</Text>
                        </View>
                    )}

                    {vehicleChangeStatus === 'rejected' && vehicleChangeRejectionReason && (
                        <View style={styles.rejectionBanner}>
                            <View style={styles.rejectionHeader}>
                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                                <Text style={styles.rejectionTitle}>Alteração não aprovada</Text>
                            </View>
                            <Text style={styles.rejectionReason}>{vehicleChangeRejectionReason}</Text>
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipo de Veículo *</Text>
                        <View style={styles.vehicleTypeContainer}>
                            {VEHICLE_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.vehicleTypeButton,
                                        profile.vehicle.type === type.id &&
                                            styles.vehicleTypeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, type: type.id },
                                        })
                                    }
                                >
                                    <Ionicons
                                        name={type.icon as any}
                                        size={24}
                                        color={profile.vehicle.type === type.id ? '#fff' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.vehicleTypeLabel,
                                            profile.vehicle.type === type.id &&
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
                                    value={profile.vehicle.brand}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, brand: text },
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
                                    value={profile.vehicle.model}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, model: text },
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
                                    value={profile.vehicle.year}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, year: text },
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
                                    value={profile.vehicle.color}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, color: text },
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
                                    value={profile.vehicle.licensePlate}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, licensePlate: text },
                                        })
                                    }
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
                                    value={profile.vehicle.renavam}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            vehicle: { ...profile.vehicle, renavam: text },
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
                            {profile.vehicle.photo ? (
                                <Image
                                    source={{ uri: profile.vehicle.photo }}
                                    style={styles.photoPreview}
                                />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={40} color="#999" />
                                    <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
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
                                name={profile.vehicle.crlv ? 'checkmark-circle' : 'document'}
                                size={24}
                                color={profile.vehicle.crlv ? '#00f260' : '#999'}
                            />
                            <Text style={styles.documentButtonText}>
                                {profile.vehicle.crlv ? 'Documento enviado' : 'Selecionar documento'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Botão Solicitar Alteração de Veículo */}
                    {currentVehicleId && (
                        <TouchableOpacity
                            style={[
                                styles.vehicleChangeButton,
                                vehicleChangeStatus === 'pending' && styles.vehicleChangeButtonDisabled,
                            ]}
                            onPress={handleSubmitVehicleChange}
                            disabled={vehicleChangeStatus === 'pending' || submittingVehicleChange}
                        >
                            {submittingVehicleChange ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={vehicleChangeStatus === 'pending' ? 'time' : 'create'}
                                        size={20}
                                        color="#fff"
                                    />
                                    <Text style={styles.vehicleChangeButtonText}>
                                        {vehicleChangeStatus === 'pending'
                                            ? 'Alteração em Análise'
                                            : 'Solicitar Alteração de Veículo'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* DADOS FINANCEIROS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet" size={24} color="#4facfe" />
                        <Text style={styles.sectionTitle}>Dados Financeiros</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Como deseja receber? *</Text>
                        <View style={styles.paymentMethodContainer}>
                            {PAYMENT_METHODS.map((method) => (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.paymentMethodButton,
                                        profile.paymentMethod === method.id &&
                                            styles.paymentMethodButtonActive,
                                    ]}
                                    onPress={() =>
                                        setProfile({
                                            ...profile,
                                            paymentMethod: method.id as 'bank' | 'pix' | 'cash' | 'other',
                                        })
                                    }
                                >
                                    <Ionicons
                                        name={method.icon as any}
                                        size={24}
                                        color={profile.paymentMethod === method.id ? '#fff' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentMethodLabel,
                                            profile.paymentMethod === method.id &&
                                                styles.paymentMethodLabelActive,
                                        ]}
                                    >
                                        {method.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Campos específicos para Conta Bancária */}
                    {profile.paymentMethod === 'bank' && (
                        <>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Titular da Conta *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nome do titular"
                                        value={profile.bankAccount.accountHolder}
                                        onChangeText={(text) =>
                                            setProfile({
                                                ...profile,
                                                bankAccount: { ...profile.bankAccount, accountHolder: text },
                                            })
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Banco *</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Banco do Brasil"
                                        value={profile.bankAccount.bank}
                                        onChangeText={(text) =>
                                            setProfile({
                                                ...profile,
                                                bankAccount: { ...profile.bankAccount, bank: text },
                                            })
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Tipo de Conta *</Text>
                                <View style={styles.accountTypeContainer}>
                                    {ACCOUNT_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.accountTypeButton,
                                                profile.bankAccount.accountType === type.id &&
                                                    styles.accountTypeButtonActive,
                                            ]}
                                            onPress={() =>
                                                setProfile({
                                                    ...profile,
                                                    bankAccount: {
                                                        ...profile.bankAccount,
                                                        accountType: type.id,
                                                    },
                                                })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.accountTypeLabel,
                                                    profile.bankAccount.accountType === type.id &&
                                                        styles.accountTypeLabelActive,
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
                                    <Text style={styles.label}>Agência *</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0000"
                                            value={profile.bankAccount.agency}
                                            onChangeText={(text) =>
                                                setProfile({
                                                    ...profile,
                                                    bankAccount: { ...profile.bankAccount, agency: text },
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
                                            value={profile.bankAccount.accountNumber}
                                            onChangeText={(text) =>
                                                setProfile({
                                                    ...profile,
                                                    bankAccount: {
                                                        ...profile.bankAccount,
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

                    {/* Campo específico para PIX */}
                    {profile.paymentMethod === 'pix' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Chave PIX *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                                    value={profile.pixKey}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            pixKey: text,
                                        })
                                    }
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    )}

                    {/* Mensagem para Dinheiro */}
                    {profile.paymentMethod === 'cash' && (
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={24} color="#4facfe" />
                            <Text style={styles.infoBoxText}>
                                Você receberá o pagamento diretamente do cliente em dinheiro ao final de cada viagem.
                            </Text>
                        </View>
                    )}

                    {/* Campo específico para Outro */}
                    {profile.paymentMethod === 'other' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Descreva como deseja receber *</Text>
                            <View style={[styles.inputContainer, { height: 100 }]}>
                                <TextInput
                                    style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                                    placeholder="Descreva a forma de pagamento desejada..."
                                    value={profile.otherPaymentInfo}
                                    onChangeText={(text) =>
                                        setProfile({
                                            ...profile,
                                            otherPaymentInfo: text,
                                        })
                                    }
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* BOTÃO SALVAR */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.saveButtonText}>Salvar Perfil</Text>
                            <Ionicons name="checkmark" size={24} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.helpText}>
                    * Campos obrigatórios{'\n'}
                    Todos os dados são necessários para garantir a segurança do serviço
                </Text>
            </ScrollView>

            {/* Modal de seleção de categoria CNH */}
            <Modal
                visible={showCNHCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCNHCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
                            <TouchableOpacity onPress={() => setShowCNHCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CNH_CATEGORIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        profile.cnhCategory === item && styles.modalItemActive,
                                    ]}
                                    onPress={() => {
                                        setProfile({ ...profile, cnhCategory: item });
                                        setShowCNHCategoryModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            profile.cnhCategory === item && styles.modalItemTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {profile.cnhCategory === item && (
                                        <Ionicons name="checkmark" size={20} color="#4facfe" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
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
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    input: {
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
    photoButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    photoPlaceholder: {
        height: 200,
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
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#f8f9fa',
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
    saveButton: {
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
    saveButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    helpText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 20,
        lineHeight: 18,
    },
    changeStatusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        gap: 10,
    },
    changeStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
    },
    rejectionBanner: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    rejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    rejectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#dc2626',
    },
    rejectionReason: {
        fontSize: 13,
        color: '#991b1b',
        lineHeight: 18,
    },
    vehicleChangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        gap: 10,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    vehicleChangeButtonDisabled: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
    },
    vehicleChangeButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    selectButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    selectButtonText: {
        fontSize: 15,
        color: '#333',
    },
    selectButtonPlaceholder: {
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    modalItemActive: {
        backgroundColor: '#f0f7ff',
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalItemTextActive: {
        fontWeight: '600',
        color: '#4facfe',
    },
    paymentMethodContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    paymentMethodButton: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e1e1e1',
    },
    paymentMethodButtonActive: {
        backgroundColor: '#4facfe',
        borderColor: '#4facfe',
    },
    paymentMethodLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
    },
    paymentMethodLabelActive: {
        color: '#fff',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f7ff',
        padding: 15,
        borderRadius: 12,
        gap: 10,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});
