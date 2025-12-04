import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function MyShipmentsScreen() {
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShipments();
    }, []);

    async function loadShipments() {
        try {
            const response = await api.get('/shipments');
            setShipments(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#f1c40f';
            case 'CONFIRMED': return '#2ecc71';
            case 'DELIVERED': return '#3498db';
            default: return '#95a5a6';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'CONFIRMED': return 'Confirmado';
            case 'DELIVERED': return 'Entregue';
            default: return status;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Mercadorias</Text>
            </View>

            <FlatList
                data={shipments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Nenhuma mercadoria encontrada</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.description}>{item.description}</Text>
                            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                                    {getStatusLabel(item.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsRow}>
                            <View style={styles.detailItem}>
                                <Ionicons name="scale-outline" size={16} color="#888" />
                                <Text style={styles.detailText}>{item.weightKg}kg</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={16} color="#888" />
                                <Text style={styles.detailText} numberOfLines={1}>{item.pickupAddress}</Text>
                            </View>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    listContent: { padding: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: '#888', fontSize: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    description: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 15 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { marginLeft: 6, color: '#666', fontSize: 14, maxWidth: 150 },
});
