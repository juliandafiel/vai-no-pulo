import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api, { getFullImageUrl } from '../services/api';
import NotificationBadge from '../components/NotificationBadge';

interface Order {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS';
    createdAt: string;
    // Dados do percurso
    tripId: string;
    tripOrigin: string;
    tripDestination: string;
    tripDate: string;
    // Dados da mercadoria
    description: string;
    weight: number;
    estimatedPrice: number;
    // Dados do cliente (para motorista)
    customer?: {
        id: string;
        name: string;
        phone: string;
        profilePhoto?: string;
    };
    // Dados do motorista (para cliente)
    driver?: {
        id: string;
        name: string;
        phone: string;
        profilePhoto?: string;
    };
    // Notas/observacoes
    notes?: string;
    // Campos de cancelamento
    cancellationReason?: string;
    cancelledBy?: 'customer' | 'driver';
    cancelledAt?: string;
    // Campos de rejeição
    rejectionReason?: string;
    rejectedAt?: string;
}

export default function PedidosScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('ALL');

    const isDriver = user?.userType === 'driver';

    // Filtra os pedidos baseado no filtro ativo
    const filteredOrders = orders.filter(order => {
        switch (activeFilter) {
            case 'PENDING':
                return order.status === 'PENDING';
            case 'ACCEPTED':
                return order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS';
            case 'COMPLETED':
                return order.status === 'COMPLETED';
            case 'CANCELLED':
                return order.status === 'CANCELLED' || order.status === 'REJECTED';
            default:
                return true;
        }
    });

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

    async function loadOrders() {
        try {
            const response = await api.get('/orders/my-orders');
            const ordersData = response.data || [];

            // Remove duplicatas baseado no ID do pedido
            const uniqueOrders = ordersData.filter(
                (order: Order, index: number, self: Order[]) =>
                    index === self.findIndex((o) => o.id === order.id)
            );

            setOrders(uniqueOrders);
        } catch (error: any) {
            // Se endpoint nao existir, mostra lista vazia
            if (error?.response?.status !== 404) {
                console.error('Erro ao carregar pedidos:', error);
            }
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function onRefresh() {
        setRefreshing(true);
        loadOrders();
    }

    async function handleAcceptOrder(orderId: string, order: Order) {
        Alert.alert(
            'Aceitar Pedido',
            'Deseja aceitar este pedido? O cliente sera notificado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aceitar',
                    onPress: async () => {
                        setProcessingId(orderId);
                        try {
                            const response = await api.put(`/orders/${orderId}/accept`);
                            console.log('[PedidosScreen] Pedido aceito:', response.data);
                            setShowDetailModal(false);

                            // Mostra mensagem apropriada
                            const message = response.data?.message || 'Pedido aceito com sucesso!';
                            Alert.alert('Sucesso', message);

                            // Recarrega a lista para atualizar o estado
                            loadOrders();
                            // Navega para o chat com o cliente (com pequeno delay para garantir que o banco atualizou)
                            setTimeout(() => {
                                navigation.navigate('Chat', {
                                    orderId: orderId,
                                    otherUser: order.customer,
                                    tripOrigin: order.tripOrigin,
                                    tripDestination: order.tripDestination,
                                    driverId: user?.id, // Motorista é quem aceitou
                                    orderStatus: 'ACCEPTED', // Status após aceitar
                                });
                            }, 300);
                        } catch (error: any) {
                            const errorMsg = error?.response?.data?.message || 'Nao foi possivel aceitar o pedido.';
                            Alert.alert('Erro', errorMsg);
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    }

    function openRejectModal(order: Order) {
        setSelectedOrder(order);
        setRejectReason('');
        setShowRejectModal(true);
    }

    async function handleRejectOrder() {
        if (!selectedOrder) return;

        setProcessingId(selectedOrder.id);
        setShowRejectModal(false);

        try {
            await api.put(`/orders/${selectedOrder.id}/reject`, {
                reason: rejectReason || 'Pedido recusado pelo motorista',
            });
            Alert.alert('Pedido Recusado', 'O cliente foi notificado.');
            loadOrders();
        } catch (error) {
            Alert.alert('Erro', 'Nao foi possivel recusar o pedido.');
        } finally {
            setProcessingId(null);
            setSelectedOrder(null);
        }
    }

    function openCancelModal(order: Order) {
        setSelectedOrder(order);
        setCancelReason('');
        setShowCancelModal(true);
    }

    async function handleCancelOrder() {
        if (!selectedOrder) return;

        setProcessingId(selectedOrder.id);
        setShowCancelModal(false);

        try {
            await api.put(`/orders/${selectedOrder.id}/cancel`, {
                reason: cancelReason || 'Cancelado pelo cliente',
            });
            Alert.alert('Pedido Cancelado', 'O motorista foi notificado sobre o cancelamento.');
            loadOrders();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Nao foi possivel cancelar o pedido.';
            Alert.alert('Erro', errorMsg);
        } finally {
            setProcessingId(null);
            setSelectedOrder(null);
        }
    }

    async function handleReopenOrder(orderId: string) {
        Alert.alert(
            'Reabrir Pedido',
            'Deseja reabrir este pedido? Ele voltara a ficar disponivel para motoristas.',
            [
                { text: 'Nao', style: 'cancel' },
                {
                    text: 'Sim, Reabrir',
                    onPress: async () => {
                        setProcessingId(orderId);
                        try {
                            await api.put(`/orders/${orderId}/reopen`);
                            Alert.alert('Pedido Reaberto', 'Seu pedido esta novamente disponivel para motoristas.');
                            loadOrders();
                        } catch (error: any) {
                            const errorMsg = error?.response?.data?.message || 'Nao foi possivel reabrir o pedido.';
                            Alert.alert('Erro', errorMsg);
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    }

    function handleOpenChat(order: Order) {
        const otherUser = isDriver ? order.customer : order.driver;

        // Para motoristas abrindo chat com cliente
        if (isDriver && order.customer) {
            navigation.navigate('Chat', {
                orderId: order.id,
                otherUser: {
                    id: order.customer.id,
                    name: order.customer.name,
                    profilePhoto: order.customer.profilePhoto,
                },
                tripOrigin: order.tripOrigin,
                tripDestination: order.tripDestination,
                driverId: user?.id, // Motorista é ele mesmo
                orderStatus: order.status, // Passa o status para verificar bloqueio
            });
        }
        // Para clientes abrindo chat com motorista
        else if (!isDriver && order.driver) {
            navigation.navigate('Chat', {
                orderId: order.id,
                otherUser: {
                    id: order.driver.id,
                    name: order.driver.name,
                    profilePhoto: order.driver.profilePhoto,
                },
                tripOrigin: order.tripOrigin,
                tripDestination: order.tripDestination,
                driverId: order.driver.id, // Conversa com este motorista específico
                orderStatus: order.status, // Passa o status para verificar bloqueio
            });
        }
    }

    function openDetailModal(order: Order) {
        setSelectedOrder(order);
        setShowDetailModal(true);
    }

    function getStatusConfig(status: string) {
        switch (status) {
            case 'PENDING':
                return { color: '#FFA500', label: 'Pendente', icon: 'time-outline' };
            case 'ACCEPTED':
                return { color: '#4facfe', label: 'Aceito', icon: 'checkmark-circle-outline' };
            case 'REJECTED':
                return { color: '#ff4444', label: 'Recusado', icon: 'close-circle-outline' };
            case 'CANCELLED':
                return { color: '#999', label: 'Cancelado', icon: 'ban-outline' };
            case 'COMPLETED':
                return { color: '#00f260', label: 'Concluido', icon: 'checkmark-done-outline' };
            default:
                return { color: '#666', label: status, icon: 'help-outline' };
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
                <Text style={styles.loadingText}>Carregando pedidos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Pedidos</Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>
                            {orders.filter(o => o.status === 'PENDING').length}
                        </Text>
                    </View>
                </View>
                <NotificationBadge />
            </View>

            {/* Filtros */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'ALL' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('ALL')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
                            Todos ({orders.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'PENDING' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('PENDING')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'PENDING' && styles.filterTextActive]}>
                            Pendentes ({orders.filter(o => o.status === 'PENDING').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'ACCEPTED' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('ACCEPTED')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'ACCEPTED' && styles.filterTextActive]}>
                            Aceitos ({orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PROGRESS').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'COMPLETED' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('COMPLETED')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'COMPLETED' && styles.filterTextActive]}>
                            Concluidos ({orders.filter(o => o.status === 'COMPLETED').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'CANCELLED' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('CANCELLED')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'CANCELLED' && styles.filterTextActive]}>
                            Cancelados ({orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'ALL' ? 'Nenhum pedido' : 'Nenhum pedido encontrado'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeFilter === 'ALL'
                                ? (isDriver
                                    ? 'Quando clientes solicitarem envios em seus percursos, os pedidos aparecerao aqui'
                                    : 'Seus pedidos de envio aparecerao aqui')
                                : 'Nao ha pedidos com este status'}
                        </Text>
                    </View>
                ) : (
                    filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const otherUser = isDriver ? order.customer : order.driver;
                        const isProcessing = processingId === order.id;

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderCard}
                                onPress={() => openDetailModal(order)}
                                disabled={isProcessing}
                            >
                                {isProcessing && (
                                    <View style={styles.processingOverlay}>
                                        <ActivityIndicator color="#fff" />
                                    </View>
                                )}

                                {/* Header do card */}
                                <View style={styles.orderHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                                        <Ionicons name={statusConfig.icon as any} size={14} color="#fff" />
                                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                                    </View>
                                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                                </View>

                                {/* Informacoes do usuario */}
                                <View style={styles.userInfo}>
                                    {otherUser?.profilePhoto ? (
                                        <Image source={{ uri: getFullImageUrl(otherUser.profilePhoto) || undefined }} style={styles.userPhoto} />
                                    ) : (
                                        <View style={styles.userPhotoPlaceholder}>
                                            <Ionicons name="person" size={20} color="#999" />
                                        </View>
                                    )}
                                    <View style={styles.userDetails}>
                                        <Text style={styles.userName}>{otherUser?.name || 'Usuario'}</Text>
                                        <Text style={styles.userRole}>
                                            {isDriver ? 'Cliente' : 'Motorista'}
                                        </Text>
                                    </View>
                                    {order.status === 'ACCEPTED' && (
                                        <TouchableOpacity
                                            style={styles.chatButton}
                                            onPress={() => handleOpenChat(order)}
                                        >
                                            <Ionicons name="chatbubble-ellipses" size={20} color="#4facfe" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Rota */}
                                <View style={styles.routeInfo}>
                                    <View style={styles.routePoint}>
                                        <View style={styles.originDot} />
                                        <Text style={styles.routeText} numberOfLines={1}>
                                            {order.tripOrigin}
                                        </Text>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={styles.destinationDot} />
                                        <Text style={styles.routeText} numberOfLines={1}>
                                            {order.tripDestination}
                                        </Text>
                                    </View>
                                </View>

                                {/* Detalhes da mercadoria */}
                                <View style={styles.cargoInfo}>
                                    <View style={styles.cargoItem}>
                                        <Ionicons name="cube-outline" size={16} color="#666" />
                                        <Text style={styles.cargoText}>{order.description}</Text>
                                    </View>
                                    <View style={styles.cargoItem}>
                                        <Ionicons name="scale-outline" size={16} color="#666" />
                                        <Text style={styles.cargoText}>{order.weight} kg</Text>
                                    </View>
                                </View>

                                {/* Motivo de cancelamento (para motorista ver) */}
                                {order.status === 'CANCELLED' && order.cancellationReason && (
                                    <View style={styles.cancellationInfo}>
                                        <View style={styles.cancellationHeader}>
                                            <Ionicons name="information-circle" size={16} color="#ff4444" />
                                            <Text style={styles.cancellationLabel}>
                                                Cancelado pelo {order.cancelledBy === 'customer' ? 'cliente' : 'motorista'}
                                            </Text>
                                        </View>
                                        <Text style={styles.cancellationReason}>
                                            "{order.cancellationReason}"
                                        </Text>
                                    </View>
                                )}

                                {/* Motivo de rejeição (para cliente ver) */}
                                {order.status === 'REJECTED' && order.rejectionReason && (
                                    <View style={styles.cancellationInfo}>
                                        <View style={styles.cancellationHeader}>
                                            <Ionicons name="information-circle" size={16} color="#ff4444" />
                                            <Text style={styles.cancellationLabel}>
                                                Recusado pelo motorista
                                            </Text>
                                        </View>
                                        <Text style={styles.cancellationReason}>
                                            "{order.rejectionReason}"
                                        </Text>
                                    </View>
                                )}

                                {/* Preco e acoes */}
                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderPrice}>
                                        R$ {order.estimatedPrice?.toFixed(2) || '0.00'}
                                    </Text>

                                    {/* Acoes para motorista em pedidos pendentes */}
                                    {isDriver && order.status === 'PENDING' && (
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={styles.messageButton}
                                                onPress={() => handleOpenChat(order)}
                                            >
                                                <Ionicons name="chatbubble-ellipses" size={18} color="#4facfe" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.rejectButton}
                                                onPress={() => openRejectModal(order)}
                                            >
                                                <Ionicons name="close" size={18} color="#ff4444" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.acceptButton}
                                                onPress={() => handleAcceptOrder(order.id, order)}
                                            >
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                                <Text style={styles.acceptButtonText}>Aceitar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Acao para cliente cancelar pedido (pendente, aceito ou em progresso) */}
                                    {!isDriver && ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(order.status) && (
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => openCancelModal(order)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Acao para cliente reabrir pedido cancelado/rejeitado */}
                                    {!isDriver && ['CANCELLED', 'REJECTED'].includes(order.status) && (
                                        <TouchableOpacity
                                            style={styles.reopenButton}
                                            onPress={() => handleReopenOrder(order.id)}
                                        >
                                            <Ionicons name="refresh" size={16} color="#4facfe" />
                                            <Text style={styles.reopenButtonText}>Reabrir</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Modal de Detalhes */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusConfig(selectedOrder.status).color }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {getStatusConfig(selectedOrder.status).label}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Percurso</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedOrder.tripOrigin} → {selectedOrder.tripDestination}
                                    </Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Data do Percurso</Text>
                                    <Text style={styles.detailValue}>{selectedOrder.tripDate}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Mercadoria</Text>
                                    <Text style={styles.detailValue}>{selectedOrder.description}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Peso</Text>
                                    <Text style={styles.detailValue}>{selectedOrder.weight} kg</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Valor Estimado</Text>
                                    <Text style={[styles.detailValue, styles.priceValue]}>
                                        R$ {selectedOrder.estimatedPrice?.toFixed(2)}
                                    </Text>
                                </View>

                                {selectedOrder.notes && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Observacoes</Text>
                                        <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                                    </View>
                                )}

                                {/* Motivo de cancelamento no modal de detalhes */}
                                {selectedOrder.status === 'CANCELLED' && selectedOrder.cancellationReason && (
                                    <View style={styles.detailSectionCancel}>
                                        <Text style={styles.detailLabelCancel}>
                                            Cancelado pelo {selectedOrder.cancelledBy === 'customer' ? 'Cliente' : 'Motorista'}
                                        </Text>
                                        <Text style={styles.detailValueCancel}>
                                            "{selectedOrder.cancellationReason}"
                                        </Text>
                                    </View>
                                )}

                                {/* Motivo de rejeição no modal de detalhes */}
                                {selectedOrder.status === 'REJECTED' && selectedOrder.rejectionReason && (
                                    <View style={styles.detailSectionCancel}>
                                        <Text style={styles.detailLabelCancel}>
                                            Recusado pelo Motorista
                                        </Text>
                                        <Text style={styles.detailValueCancel}>
                                            "{selectedOrder.rejectionReason}"
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal de Rejeicao */}
            <Modal
                visible={showRejectModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowRejectModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.rejectModalContent}>
                            <Text style={styles.rejectModalTitle}>Recusar Pedido</Text>
                            <Text style={styles.rejectModalSubtitle}>
                                Informe o motivo da recusa (opcional)
                            </Text>
                            <TextInput
                                style={styles.rejectInput}
                                placeholder="Ex: Capacidade insuficiente, data indisponivel..."
                                value={rejectReason}
                                onChangeText={setRejectReason}
                                multiline
                                numberOfLines={3}
                            />
                            <View style={styles.rejectModalButtons}>
                                <TouchableOpacity
                                    style={styles.rejectModalCancelBtn}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowRejectModal(false);
                                    }}
                                >
                                    <Text style={styles.rejectModalCancelText}>Voltar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.rejectModalConfirmBtn}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        handleRejectOrder();
                                    }}
                                >
                                    <Text style={styles.rejectModalConfirmText}>Recusar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Modal de Cancelamento (Cliente) */}
            <Modal
                visible={showCancelModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCancelModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.cancelModalContent}>
                            <View style={styles.cancelModalIcon}>
                                <Ionicons name="alert-circle" size={48} color="#ff4444" />
                            </View>
                            <Text style={styles.cancelModalTitle}>Cancelar Pedido</Text>
                            <Text style={styles.cancelModalSubtitle}>
                                Por favor, informe o motivo do cancelamento para que o motorista possa entender.
                            </Text>
                            <TextInput
                                style={styles.cancelInput}
                                placeholder="Ex: Mudei de ideia, encontrei outra opcao, problema pessoal..."
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <View style={styles.cancelModalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelModalBackBtn}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowCancelModal(false);
                                    }}
                                >
                                    <Text style={styles.cancelModalBackText}>Voltar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelModalConfirmBtn}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        handleCancelOrder();
                                    }}
                                >
                                    <Text style={styles.cancelModalConfirmText}>Confirmar Cancelamento</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerBadge: {
        backgroundColor: '#ff4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 10,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    filterButtonActive: {
        backgroundColor: '#4facfe',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    content: {
        padding: 15,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userPhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userPhotoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    userRole: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f4fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeInfo: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4facfe',
        marginRight: 10,
    },
    destinationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00f260',
        marginRight: 10,
    },
    routeLine: {
        width: 2,
        height: 15,
        backgroundColor: '#ddd',
        marginLeft: 4,
        marginVertical: 2,
    },
    routeText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    cargoInfo: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    cargoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    cargoText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    cancellationInfo: {
        backgroundColor: '#fff5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#ff4444',
    },
    cancellationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    cancellationLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ff4444',
        marginLeft: 6,
    },
    cancellationReason: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    orderPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00f260',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f4fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rejectButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffe8e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00f260',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 6,
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    cancelButtonText: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: '500',
    },
    reopenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#e8f4fe',
        borderWidth: 1,
        borderColor: '#4facfe',
    },
    reopenButtonText: {
        color: '#4facfe',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
    },
    detailSectionCancel: {
        marginBottom: 20,
        backgroundColor: '#fff5f5',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#ff4444',
    },
    detailLabelCancel: {
        fontSize: 12,
        color: '#ff4444',
        marginBottom: 6,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValueCancel: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00f260',
    },
    // Reject modal
    rejectModalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 16,
        padding: 20,
    },
    rejectModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    rejectModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    rejectInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    rejectModalButtons: {
        flexDirection: 'row',
        marginTop: 20,
    },
    rejectModalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    rejectModalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    rejectModalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#ff4444',
    },
    rejectModalConfirmText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    // Cancel modal (Cliente)
    cancelModalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 16,
        padding: 24,
    },
    cancelModalIcon: {
        alignItems: 'center',
        marginBottom: 16,
    },
    cancelModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    cancelModalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    cancelInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    cancelModalButtons: {
        marginTop: 20,
    },
    cancelModalBackBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginBottom: 10,
    },
    cancelModalBackText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    cancelModalConfirmBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#ff4444',
    },
    cancelModalConfirmText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
