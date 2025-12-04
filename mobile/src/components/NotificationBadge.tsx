import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

interface NotificationBadgeProps {
    color?: string;
}

export default function NotificationBadge({ color = '#333' }: NotificationBadgeProps) {
    const navigation = useNavigation();
    const [pendingCount, setPendingCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadCounts();
        const interval = setInterval(loadCounts, 30000); // Atualiza a cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    // Recarrega contagem quando a tela ganha foco (ex: volta da tela de Pedidos)
    useFocusEffect(
        useCallback(() => {
            loadCounts();
        }, [])
    );

    async function loadCounts() {
        try {
            const [pendingRes, unreadRes] = await Promise.all([
                api.get('/orders/pending-count').catch(() => ({ data: 0 })),
                api.get('/messages/unread-count').catch(() => ({ data: 0 })),
            ]);
            setPendingCount(typeof pendingRes.data === 'number' ? pendingRes.data : 0);
            setUnreadCount(typeof unreadRes.data === 'number' ? unreadRes.data : 0);
        } catch (error) {
            // Silenciosamente ignora erros
        }
    }

    const totalCount = pendingCount + unreadCount;

    async function handlePress() {
        // Marca notificações como lidas
        try {
            await api.put('/orders/mark-as-read').catch(() => {});
        } catch (error) {
            // Ignora erro silenciosamente
        }

        // Zera o contador localmente para feedback imediato
        setPendingCount(0);

        // Navega para Pedidos
        navigation.navigate('Pedidos' as never);
    }

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container}>
            <Ionicons name="notifications-outline" size={24} color={color} />
            {totalCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {totalCount > 99 ? '99+' : totalCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: 5,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ff4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
