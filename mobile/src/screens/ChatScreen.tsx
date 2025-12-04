import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api, { getFullImageUrl } from '../services/api';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        profilePhoto?: string;
    };
}

interface RouteParams {
    orderId: string;
    otherUser: {
        id: string;
        name: string;
        profilePhoto?: string;
    };
    tripOrigin: string;
    tripDestination: string;
    driverId?: string; // ID do motorista para conversas específicas
    orderStatus?: string; // Status do pedido (para verificar se o chat está bloqueado)
}

// Status que bloqueiam o chat
const BLOCKED_STATUSES = ['CANCELLED', 'REJECTED', 'COMPLETED'];

function getBlockedMessage(status: string): string {
    switch (status) {
        case 'CANCELLED':
            return 'Este pedido foi cancelado. O chat esta bloqueado.';
        case 'REJECTED':
            return 'Este pedido foi recusado. O chat esta bloqueado.';
        case 'COMPLETED':
            return 'Este pedido foi concluido. O chat esta bloqueado.';
        default:
            return 'O chat esta bloqueado para este pedido.';
    }
}

export default function ChatScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);

    const { orderId, otherUser, tripOrigin, tripDestination, driverId, orderStatus: initialOrderStatus } = route.params as RouteParams;

    // Determina o driverId: se eu sou motorista, uso meu ID; senão, uso o ID do outro usuário (motorista)
    const isDriver = user?.userType === 'driver';
    const conversationDriverId = isDriver ? user?.id : (driverId || otherUser?.id);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [orderStatus, setOrderStatus] = useState<string>(initialOrderStatus || 'PENDING');

    // Verifica se o chat está bloqueado
    const isChatBlocked = BLOCKED_STATUSES.includes(orderStatus);

    useEffect(() => {
        loadMessages();
        // Polling para novas mensagens a cada 5 segundos
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [orderId]);

    async function loadMessages() {
        try {
            console.log('[ChatScreen] Carregando mensagens para orderId:', orderId, 'driverId:', conversationDriverId);
            console.log('[ChatScreen] Usuário logado:', user?.id, user?.name, 'isDriver:', isDriver);

            // Passa o driverId como query param para buscar a conversa correta
            const url = conversationDriverId
                ? `/messages/order/${orderId}?driverId=${conversationDriverId}`
                : `/messages/order/${orderId}`;
            const response = await api.get(url);
            setMessages(response.data || []);

            // Busca o status atual do pedido para verificar se o chat está bloqueado
            try {
                const orderResponse = await api.get(`/orders/${orderId}`);
                if (orderResponse.data?.status) {
                    setOrderStatus(orderResponse.data.status);
                }
            } catch (orderError) {
                // Ignora erro ao buscar status do pedido
                console.log('[ChatScreen] Não foi possível buscar status do pedido');
            }
        } catch (error: any) {
            // 404 eh esperado quando nao ha mensagens ou endpoint nao existe
            // 401 eh tratado pelo interceptor
            if (error?.response?.status !== 404 && error?.response?.status !== 401) {
                console.log('Erro ao carregar mensagens:', error?.message);
            }
            if (error?.response?.status === 403) {
                console.log('[ChatScreen] Erro 403 - Acesso negado ao chat');
                console.log('[ChatScreen] orderId:', orderId);
                console.log('[ChatScreen] userId:', user?.id);
            }
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage() {
        if (!newMessage.trim() || sending || isChatBlocked) return;

        setSending(true);
        try {
            console.log('[ChatScreen] Enviando mensagem para orderId:', orderId, 'driverId:', conversationDriverId);

            // Envia o driverId para criar/usar a conversa correta
            const response = await api.post('/messages', {
                orderId,
                driverId: conversationDriverId, // ID do motorista na conversa
                content: newMessage.trim(),
            });
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error: any) {
            console.error('Erro ao enviar mensagem:', error);
            if (error?.response?.status === 403) {
                console.log('[ChatScreen] Erro 403 ao enviar - Acesso negado');
            }
            // Verifica se é erro de chat bloqueado (status 400)
            if (error?.response?.status === 400) {
                const errorMessage = error?.response?.data?.message || 'O chat esta bloqueado para este pedido.';
                Alert.alert('Chat Bloqueado', errorMessage);
                // Atualiza o status do pedido para refletir o bloqueio
                loadMessages();
            }
        } finally {
            setSending(false);
        }
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        }
    }

    function shouldShowDateSeparator(currentMsg: Message, prevMsg?: Message) {
        if (!prevMsg) return true;
        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const prevDate = new Date(prevMsg.createdAt).toDateString();
        return currentDate !== prevDate;
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4facfe" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    activeOpacity={0.6}
                >
                    <View style={styles.backButtonInner}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </View>
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    {otherUser?.profilePhoto ? (
                        <Image
                            source={{ uri: getFullImageUrl(otherUser.profilePhoto) || undefined }}
                            style={styles.headerAvatar}
                        />
                    ) : (
                        <View style={styles.headerAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#666" />
                        </View>
                    )}
                    <View style={styles.headerText}>
                        <Text style={styles.headerName} numberOfLines={1}>{otherUser?.name || 'Usuario'}</Text>
                        <Text style={styles.headerTrip} numberOfLines={1}>
                            {tripOrigin || 'Origem'} → {tripDestination || 'Destino'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>
                                Envie uma mensagem para iniciar a conversa
                            </Text>
                        </View>
                    ) : (
                        messages.map((message, index) => {
                            const isMe = message.sender.id === user?.id;
                            const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);

                            return (
                                <React.Fragment key={message.id}>
                                    {showDateSeparator && (
                                        <View style={styles.dateSeparator}>
                                            <Text style={styles.dateSeparatorText}>
                                                {formatDate(message.createdAt)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        isMe ? styles.myMessage : styles.theirMessage
                                    ]}>
                                        <Text style={[
                                            styles.messageText,
                                            isMe ? styles.myMessageText : styles.theirMessageText
                                        ]}>
                                            {message.content}
                                        </Text>
                                        <Text style={[
                                            styles.messageTime,
                                            isMe ? styles.myMessageTime : styles.theirMessageTime
                                        ]}>
                                            {formatTime(message.createdAt)}
                                        </Text>
                                    </View>
                                </React.Fragment>
                            );
                        })
                    )}
                </ScrollView>

                {/* Input ou mensagem de bloqueio */}
                {isChatBlocked ? (
                    <View style={styles.blockedContainer}>
                        <Ionicons name="lock-closed" size={18} color="#666" style={styles.blockedIcon} />
                        <Text style={styles.blockedText}>{getBlockedMessage(orderStatus)}</Text>
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite sua mensagem..."
                            placeholderTextColor="#999"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!newMessage.trim() || sending) && styles.sendButtonDisabled
                            ]}
                            onPress={sendMessage}
                            disabled={!newMessage.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: 10,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    headerTrip: {
        fontSize: 12,
        color: '#4facfe',
        marginTop: 2,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 15,
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 15,
    },
    dateSeparatorText: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#4facfe',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirMessageTime: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: '#333',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4facfe',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    blockedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    blockedIcon: {
        marginRight: 8,
    },
    blockedText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        flex: 1,
    },
});
