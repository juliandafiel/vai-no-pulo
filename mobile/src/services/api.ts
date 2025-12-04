import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Determina a URL base da API baseado na plataforma:
 * - Android Emulator: 10.0.2.2 (localhost do host)
 * - iOS Simulator: localhost
 * - Dispositivo físico: IP da máquina na rede local
 */
function getApiBaseUrl(): string {
    // IP da sua máquina na rede local
    // Descoberto via 'ipconfig' no Windows (Wi-Fi adapter)
    const LOCAL_MACHINE_IP = '192.168.3.110';

    // Verifica se está rodando no Expo Go em dispositivo físico
    const isExpoGo = Constants.appOwnership === 'expo';
    const isDevice = !__DEV__ || (Constants.platform?.ios?.simulator === false && Constants.platform?.android?.isEmulator === false);

    if (Platform.OS === 'android') {
        // Android Emulator usa 10.0.2.2 para acessar localhost do host
        // Dispositivo físico Android precisa do IP real
        if (isDevice || isExpoGo) {
            return `http://${LOCAL_MACHINE_IP}:3000`;
        }
        return 'http://10.0.2.2:3000';
    }

    if (Platform.OS === 'ios') {
        // iOS Simulator pode usar localhost
        // Dispositivo físico iOS precisa do IP real
        if (isDevice || isExpoGo) {
            return `http://${LOCAL_MACHINE_IP}:3000`;
        }
        return 'http://localhost:3000';
    }

    // Web ou outras plataformas
    return 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

console.log(`[API] Platform: ${Platform.OS}, Base URL: ${API_BASE_URL}`);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

/**
 * Converte uma URL relativa do backend para URL completa
 * @param relativeUrl - URL relativa como /uploads/profiles/xxx.jpg
 * @returns URL completa como http://192.168.2.162:3000/uploads/profiles/xxx.jpg
 */
export function getFullImageUrl(relativeUrl: string | null | undefined): string | null {
    if (!relativeUrl) return null;

    // Se já é uma URL completa ou base64, retorna como está
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:') || relativeUrl.startsWith('file://')) {
        return relativeUrl;
    }

    // Remove a barra inicial se existir para evitar duplicação
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${API_BASE_URL}${cleanUrl}`;
}

// Callback para quando o token expirar
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
    onUnauthorizedCallback = callback;
}

// Interceptor de requisição - adiciona token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('Erro ao obter token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Flag para evitar loops durante logout
let isLoggingOut = false;

export function setLoggingOut(value: boolean) {
    isLoggingOut = value;
}

// Interceptor de resposta - trata erros
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestUrl = error.config?.url || '';

        // Se o erro for 401 (não autorizado) e NÃO for na tela de login, faz logout automático
        // Endpoints de auth não devem disparar logout (401 lá significa credenciais inválidas)
        // Também ignora se já estamos no processo de logout
        const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
        const isPushTokenEndpoint = requestUrl.includes('/users/push-token');

        if (error.response?.status === 401 && !isAuthEndpoint && !isLoggingOut && !isPushTokenEndpoint) {
            console.log('Token expirado ou invalido. Fazendo logout...');

            // Limpa o storage
            await AsyncStorage.multiRemove(['token', 'user']);

            // Chama o callback para atualizar o estado do AuthContext
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }

        // Log apenas para debug em desenvolvimento
        if (__DEV__ && error.response) {
            const { status, config } = error.response;
            // Não loga erros esperados (404 para recursos inexistentes)
            if (status !== 404) {
                console.log(`API Error: ${status} - ${config?.url}`);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
