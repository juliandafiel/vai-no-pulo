import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Configura como as notificações devem ser tratadas quando o app está em foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Registra o dispositivo para receber notificações push
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    // Push notifications só funcionam em dispositivos físicos
    if (!Device.isDevice) {
        console.log('[Notifications] Push notifications requerem dispositivo físico');
        return null;
    }

    // Verifica e solicita permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[Notifications] Permissão para notificações negada');
        return null;
    }

    try {
        // Obtém o projectId do EAS configurado no app.json
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        console.log('[Notifications] projectId:', projectId);

        const pushTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });

        token = pushTokenData.data;
        console.log('[Notifications] Push token obtido:', token);
    } catch (error: any) {
        console.error('[Notifications] Erro ao obter push token:', error?.message || error);
    }

    // Configura canal de notificação para Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4facfe',
        });

        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Mensagens',
            description: 'Notificações de novas mensagens',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4facfe',
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('orders', {
            name: 'Pedidos',
            description: 'Notificações de novos pedidos',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00f260',
            sound: 'default',
        });
    }

    return token;
}

// Salva o push token no backend
export async function savePushTokenToBackend(token: string): Promise<void> {
    try {
        await api.put('/users/push-token', { pushToken: token });
        console.log('[Notifications] Push token salvo no backend');
    } catch (error) {
        console.error('[Notifications] Erro ao salvar push token:', error);
    }
}

// Remove o push token do backend (logout)
export async function removePushTokenFromBackend(): Promise<void> {
    try {
        await api.put('/users/push-token', { pushToken: null });
        console.log('[Notifications] Push token removido do backend');
    } catch (error) {
        console.error('[Notifications] Erro ao remover push token:', error);
    }
}

// Listener para notificações recebidas (app em foreground)
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

// Listener para quando o usuário toca na notificação
export function addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

// Envia uma notificação local (para testes)
export async function sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: null, // Envia imediatamente
    });
}

// Limpa todas as notificações
export async function clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
}

// Obtém o badge count
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

// Define o badge count
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}
