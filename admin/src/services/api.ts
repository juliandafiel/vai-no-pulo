import axios from 'axios';

export const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Converte uma URL relativa do backend para URL completa
 * @param relativeUrl - URL relativa como /uploads/profiles/xxx.jpg
 * @returns URL completa como http://localhost:3000/uploads/profiles/xxx.jpg
 */
export function getFullUrl(relativeUrl: string | null | undefined): string | null {
    if (!relativeUrl) return null;

    // Se já é uma URL completa, retorna como está
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }

    // Remove a barra inicial se existir para evitar duplicação
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${API_BASE_URL}${cleanUrl}`;
}

export default api;
