import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api, { getFullImageUrl } from '../services/api';
import NotificationBadge from '../components/NotificationBadge';

interface OtherUser {
    id: string;
    name: string;
    profilePhoto?: string;
}

interface LastMessage {
    content: string;
    createdAt: string;
    isFromMe: boolean;
}

interface Conversation {
    conversationId?: string;
    orderId: string;
    driverId?: string;
    otherUser: OtherUser;
    tripOrigin: string;
    tripDestination: string;
    lastMessage: LastMessage | null;
    status: string;
}

export default function MessagesScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    async function loadConversations() {
        try {
            const response = await api.get('/messages/conversations');
            const conversationsData = response.data || [];

            // Remove duplicatas baseado no conversationId ou combinação orderId+driverId
            const uniqueConversations = conversationsData.filter(
                (conv: Conversation, index: number, self: Conversation[]) => {
                    const key = conv.conversationId || `${conv.orderId}-${conv.driverId || 'no-driver'}`;
                    return index === self.findIndex((c) => {
                        const cKey = c.conversationId || `${c.orderId}-${c.driverId || 'no-driver'}`;
                        return cKey === key;
                    });
                }
            );

            setConversations(uniqueConversations);
        } catch (error: any) {
            // 404 significa que o endpoint ainda nao foi implementado ou nao ha mensagens
            // 401 eh tratado pelo interceptor de autorizacao
            if (error?.response?.status !== 404 && error?.response?.status !== 401) {
                console.log('Erro ao carregar mensagens:', error?.message || error);
            }
            setConversations([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function onRefresh() {
        setRefreshing(true);
        loadConversations();
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            return date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
            });
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'PENDING':
                return '#ffc107';
            case 'ACCEPTED':
                return '#4facfe';
            case 'IN_PROGRESS':
                return '#28a745';
            default:
                return '#666';
        }
    }

    function getStatusText(status: string) {
        switch (status) {
            case 'PENDING':
                return 'Pendente';
            case 'ACCEPTED':
                return 'Aceito';
            case 'IN_PROGRESS':
                return 'Em andamento';
            default:
                return status;
        }
    }

    function openChat(conversation: Conversation) {
        navigation.navigate('Chat' as never, {
            orderId: conversation.orderId,
            otherUser: conversation.otherUser,
            tripOrigin: conversation.tripOrigin,
            tripDestination: conversation.tripDestination,
            driverId: conversation.driverId,
            orderStatus: conversation.status, // Passa o status para verificar bloqueio
        } as never);
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
                <Text style={styles.loadingText}>Carregando mensagens...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <NotificationBadge />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {conversations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {/* Ilustracao personalizada */}
                        <View style={styles.illustrationContainer}>
                            {/* Linha pontilhada decorativa */}
                            <View style={styles.dashedCircle}>
                                <View style={styles.dashedCircleInner} />
                            </View>

                            {/* Icone de localizacao esquerda */}
                            <View style={styles.locationIconLeft}>
                                <Ionicons name="location" size={20} color="#8E99A4" />
                            </View>

                            {/* Icone de localizacao direita */}
                            <View style={styles.locationIconRight}>
                                <Ionicons name="location" size={16} color="#8E99A4" />
                            </View>

                            {/* Duas pessoas com bolhas de chat */}
                            <View style={styles.peopleContainer}>
                                {/* Pessoa 1 - com bolha de chat */}
                                <View style={styles.personWithChat}>
                                    <View style={styles.chatBubbleLeft}>
                                        <Ionicons name="chatbubble" size={28} color="#4facfe" />
                                        <View style={styles.chatBubbleDots}>
                                            <View style={styles.chatDot} />
                                            <View style={styles.chatDot} />
                                            <View style={styles.chatDot} />
                                        </View>
                                    </View>
                                    <View style={[styles.personAvatar, { backgroundColor: '#4facfe' }]}>
                                        <Ionicons name="person" size={32} color="#fff" />
                                    </View>
                                </View>

                                {/* Conexao entre pessoas */}
                                <View style={styles.connectionLine}>
                                    <View style={styles.connectionDot} />
                                    <View style={styles.connectionDash} />
                                    <View style={styles.connectionDot} />
                                </View>

                                {/* Pessoa 2 - com bolha de chat */}
                                <View style={styles.personWithChat}>
                                    <View style={styles.chatBubbleRight}>
                                        <Ionicons name="chatbubble" size={28} color="#00f260" />
                                        <View style={styles.chatBubbleDots}>
                                            <View style={[styles.chatDot, { backgroundColor: '#00f260' }]} />
                                            <View style={[styles.chatDot, { backgroundColor: '#00f260' }]} />
                                            <View style={[styles.chatDot, { backgroundColor: '#00f260' }]} />
                                        </View>
                                    </View>
                                    <View style={[styles.personAvatar, { backgroundColor: '#00f260' }]}>
                                        <Ionicons name="person" size={32} color="#fff" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.emptyTitle}>Suas conversas aparecerao aqui.</Text>
                        <Text style={styles.emptyText}>
                            Converse com motoristas e clientes sobre suas entregas e acompanhe tudo em um so lugar.
                        </Text>
                    </View>
                ) : (
                    conversations.map((conversation) => (
                        <TouchableOpacity
                            key={conversation.conversationId || `${conversation.orderId}-${conversation.driverId || 'default'}`}
                            style={styles.conversationCard}
                            onPress={() => openChat(conversation)}
                        >
                            <View style={styles.avatarContainer}>
                                {conversation.otherUser?.profilePhoto ? (
                                    <Image
                                        source={{ uri: getFullImageUrl(conversation.otherUser.profilePhoto) || undefined }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={24} color="#666" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.conversationContent}>
                                <View style={styles.conversationHeader}>
                                    <Text style={styles.participantName} numberOfLines={1}>
                                        {conversation.otherUser?.name || 'Usuario'}
                                    </Text>
                                    {conversation.lastMessage && (
                                        <Text style={styles.messageDate}>
                                            {formatDate(conversation.lastMessage.createdAt)}
                                        </Text>
                                    )}
                                </View>

                                <Text style={styles.tripInfo} numberOfLines={1}>
                                    {conversation.tripOrigin} → {conversation.tripDestination}
                                </Text>

                                {conversation.lastMessage ? (
                                    <Text style={styles.lastMessage} numberOfLines={1}>
                                        {conversation.lastMessage.isFromMe ? 'Você: ' : ''}
                                        {conversation.lastMessage.content}
                                    </Text>
                                ) : (
                                    <Text style={styles.noMessages}>Nenhuma mensagem ainda</Text>
                                )}

                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(conversation.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(conversation.status)}</Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 15,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    illustrationContainer: {
        width: 260,
        height: 200,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dashedCircle: {
        position: 'absolute',
        width: 220,
        height: 180,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: '#3a3f47',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashedCircleInner: {
        width: 180,
        height: 140,
        borderRadius: 90,
        backgroundColor: 'transparent',
    },
    locationIconLeft: {
        position: 'absolute',
        left: 15,
        top: 40,
        opacity: 0.6,
    },
    locationIconRight: {
        position: 'absolute',
        right: 20,
        bottom: 50,
        opacity: 0.6,
    },
    peopleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
    },
    personWithChat: {
        alignItems: 'center',
    },
    personAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    chatBubbleLeft: {
        position: 'relative',
        marginBottom: 8,
        marginRight: 20,
    },
    chatBubbleRight: {
        position: 'relative',
        marginBottom: 8,
        marginLeft: 20,
    },
    chatBubbleDots: {
        position: 'absolute',
        top: 8,
        left: 7,
        flexDirection: 'row',
        gap: 2,
    },
    chatDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4facfe',
    },
    connectionLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 35,
    },
    connectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4a5568',
    },
    connectionDash: {
        width: 20,
        height: 2,
        backgroundColor: '#4a5568',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 30,
        lineHeight: 22,
    },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
    },
    avatarPlaceholder: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    conversationContent: {
        flex: 1,
        marginLeft: 15,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    messageDate: {
        fontSize: 12,
        color: '#999',
    },
    tripInfo: {
        fontSize: 12,
        color: '#4facfe',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    noMessages: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
});
