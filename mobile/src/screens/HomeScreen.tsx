import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<any>();

    const MenuItem = ({ title, icon, color, onPress, description }: any) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá,</Text>
                    <Text style={styles.username}>{(user as any)?.name}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>O que você deseja fazer?</Text>

                <MenuItem
                    title="Perfil do Motorista"
                    description="Complete seu cadastro de motorista"
                    icon="person-outline"
                    color="#667eea"
                    onPress={() => navigation.navigate('DriverProfile')}
                />

                <MenuItem
                    title="Criar Trajeto"
                    description="Ofereça transporte para mercadorias"
                    icon="car-sport-outline"
                    color="#4facfe"
                    onPress={() => navigation.navigate('CreateTrip')}
                />

                <MenuItem
                    title="Enviar Mercadoria"
                    description="Encontre um motorista para seu item"
                    icon="cube-outline"
                    color="#00f260"
                    onPress={() => navigation.navigate('RegisterMerchandise')}
                />

                <MenuItem
                    title="Minhas Mercadorias"
                    description="Acompanhe seus envios"
                    icon="list-outline"
                    color="#f093fb"
                    onPress={() => navigation.navigate('MyShipments')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 25,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    greeting: { fontSize: 16, color: '#666' },
    username: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    logoutButton: { padding: 10 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 20, marginLeft: 5 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    cardDescription: { fontSize: 13, color: '#888' },
});
