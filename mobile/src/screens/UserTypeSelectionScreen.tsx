import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function UserTypeSelectionScreen() {
    const navigation = useNavigation<any>();

    return (
        <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="bus" size={60} color="#fff" />
                    </View>
                    <Text style={styles.title}>Vai no Pulo</Text>
                    <Text style={styles.subtitle}>Escolha como deseja continuar</Text>
                </View>

                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.userTypeCard}
                        onPress={() => navigation.navigate('ClientRegister')}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons name="person" size={50} color="#667eea" />
                        </View>
                        <Text style={styles.cardTitle}>Sou Cliente</Text>
                        <Text style={styles.cardDescription}>
                            Quero enviar mercadorias e encontrar transportadores
                        </Text>
                        <View style={styles.cardArrow}>
                            <Ionicons name="arrow-forward" size={24} color="#667eea" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.userTypeCard}
                        onPress={() => navigation.navigate('TransporterRegister')}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons name="car-sport" size={50} color="#667eea" />
                        </View>
                        <Text style={styles.cardTitle}>Sou Transportador</Text>
                        <Text style={styles.cardDescription}>
                            Quero oferecer transporte de mercadorias e ganhar dinheiro
                        </Text>
                        <View style={styles.cardArrow}>
                            <Ionicons name="arrow-forward" size={24} color="#667eea" />
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.backButtonText}>Voltar ao Login</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '300',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
    },
    userTypeCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        position: 'relative',
    },
    cardIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    cardArrow: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        gap: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
