import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView, SafeAreaView } from 'react-native';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateShipmentScreen() {
    const [description, setDescription] = useState('');
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const navigation = useNavigation();

    async function handleCreateShipment() {
        if (!acceptedPolicy) {
            Alert.alert('Atenção', 'É necessário aceitar a política de itens proibidos.');
            return;
        }

        try {
            await api.post('/shipments', {
                description,
                weightKg: 10,
                volumeM3: 0.5,
                pickupLat: -23.55052,
                pickupLng: -46.633308,
                pickupAddress: 'Rua A',
                photos: [],
                policyAccepted: true,
            });
            Alert.alert('Sucesso', 'Mercadoria cadastrada com sucesso!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Falha ao cadastrar.');
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Nova Mercadoria</Text>
                <Text style={styles.subtitle}>Descreva o item que deseja enviar</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Descrição</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Ex: Caixa de livros, 5kg..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View style={styles.policyCard}>
                    <View style={styles.policyHeader}>
                        <Ionicons name="shield-checkmark-outline" size={24} color="#00f260" />
                        <Text style={styles.policyTitle}>Política de Segurança</Text>
                    </View>
                    <Text style={styles.policyText}>
                        Declaro que este item não contém substâncias ilícitas, armas, ou qualquer material proibido pela legislação vigente.
                    </Text>
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Aceito os termos</Text>
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#00f260" }}
                            thumbColor={"#fff"}
                            onValueChange={setAcceptedPolicy}
                            value={acceptedPolicy}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleCreateShipment}>
                    <Text style={styles.buttonText}>Cadastrar Mercadoria</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 25 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 30 },
    formGroup: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginLeft: 4 },
    inputContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    textAreaContainer: { paddingVertical: 15, height: 120 },
    input: { fontSize: 16, color: '#333' },
    textArea: { flex: 1 },
    policyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    policyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
    policyText: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    switchLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
    button: {
        backgroundColor: '#00f260',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00f260',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
