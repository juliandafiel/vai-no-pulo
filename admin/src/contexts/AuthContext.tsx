import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextData {
    signed: boolean;
    user: User | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        }
        setLoading(false);
    }, []);

    async function signIn(email: string, pass: string) {
        const response = await api.post('/auth/login', {
            email,
            password: pass,
        });

        const { access_token, user } = response.data;

        setUser(user);
        api.defaults.headers.Authorization = `Bearer ${access_token}`;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', access_token);
    }

    function signOut() {
        localStorage.clear();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
