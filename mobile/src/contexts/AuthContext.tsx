import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api, { setOnUnauthorizedCallback, setLoggingOut } from '../services/api';
import {
    registerForPushNotificationsAsync,
    savePushTokenToBackend,
    removePushTokenFromBackend,
} from '../services/notifications';

interface User {
    id: string;
    name: string;
    email: string;
    userType: 'customer' | 'driver';
    birthDate?: string;
    profilePhoto?: string;
    phone?: string;
}

interface AuthContextData {
    signed: boolean;
    user: User | null;
    loading: boolean;
    signIn(email: string, password: string): Promise<void>;
    signInWithGoogle(): Promise<void>;
    signOut(): void;
    updateUser(data: Partial<User>): Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Função para fazer logout quando o token expirar
    const handleUnauthorized = useCallback(() => {
        setUser(null);
        Alert.alert(
            'Sessao Expirada',
            'Sua sessao expirou. Faca login novamente.',
            [{ text: 'OK' }]
        );
    }, []);

    useEffect(() => {
        // Registra o callback para quando o token expirar
        setOnUnauthorizedCallback(handleUnauthorized);

        async function loadStorageData() {
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                api.defaults.headers.Authorization = `Bearer ${storedToken}`;

                // Registra para push notifications se já estiver logado
                registerForPushNotificationsAsync().then(pushToken => {
                    if (pushToken) {
                        savePushTokenToBackend(pushToken);
                    }
                });
            }
            setLoading(false);
        }

        loadStorageData();
    }, [handleUnauthorized]);

    async function signIn(email: string, password: string) {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user: userData, token } = response.data;

            setUser(userData);
            api.defaults.headers.Authorization = `Bearer ${token}`;

            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', token);

            // Registra para push notifications e salva o token
            registerForPushNotificationsAsync().then(pushToken => {
                if (pushToken) {
                    savePushTokenToBackend(pushToken);
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async function signInWithGoogle() {
        try {
            // Implementação do login com Google aqui
            console.log('Login com Google não implementado ainda');
        } catch (error) {
            throw error;
        }
    }

    async function signOut() {
        // Marca que estamos em processo de logout para evitar loops
        setLoggingOut(true);

        // Remove o push token do backend antes de fazer logout
        try {
            await removePushTokenFromBackend();
        } catch (error) {
            console.log('[Auth] Erro ao remover push token:', error);
        }

        await AsyncStorage.clear();
        setUser(null);

        // Reseta a flag após o logout
        setLoggingOut(false);
    }

    async function updateUser(data: Partial<User>) {
        try {
            const response = await api.put('/users/profile', data);
            const updatedUser = { ...user, ...response.data } as User;
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            throw error;
        }
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signInWithGoogle, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}
