import * as FileSystem from 'expo-file-system/legacy';
import api from './api';

export interface UploadResult {
    success: boolean;
    url: string;
}

/**
 * Faz upload de uma imagem para o servidor
 * @param uri - URI local da imagem (file://...)
 * @param folder - Pasta onde salvar (profiles, documents)
 * @returns URL da imagem no servidor
 */
export async function uploadImage(uri: string, folder: string = 'general'): Promise<string> {
    try {
        console.log('[Upload] Iniciando upload de:', uri);

        // Lê o arquivo como base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Determina o tipo da imagem pela extensão
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        // Formata o base64 com o prefixo correto
        const base64Data = `data:${mimeType};base64,${base64}`;

        console.log('[Upload] Base64 gerado, tamanho:', base64.length);

        // Envia para o servidor
        const response = await api.post('/upload/base64', {
            data: base64Data,
            folder,
        });

        if (response.data.success) {
            console.log('[Upload] Sucesso:', response.data.url);
            return response.data.url;
        }

        throw new Error('Falha no upload');
    } catch (error) {
        console.error('[Upload] Erro ao fazer upload:', error);
        throw error;
    }
}

/**
 * Faz upload de múltiplas imagens
 * @param images - Objeto com URIs das imagens
 * @returns Objeto com URLs das imagens no servidor
 */
export async function uploadDocuments(images: {
    profilePhoto?: string | null;
    documentFront?: string | null;
    documentBack?: string | null;
}): Promise<{
    profilePhoto?: string;
    documentFront?: string;
    documentBack?: string;
}> {
    const results: {
        profilePhoto?: string;
        documentFront?: string;
        documentBack?: string;
    } = {};

    try {
        // Upload da foto de perfil
        if (images.profilePhoto) {
            console.log('[Upload] Enviando foto de perfil...');
            results.profilePhoto = await uploadImage(images.profilePhoto, 'profiles');
            console.log('[Upload] Foto de perfil enviada:', results.profilePhoto);
        }

        // Upload da frente do documento
        if (images.documentFront) {
            console.log('[Upload] Enviando frente do documento...');
            results.documentFront = await uploadImage(images.documentFront, 'documents');
            console.log('[Upload] Frente do documento enviada:', results.documentFront);
        }

        // Upload do verso do documento
        if (images.documentBack) {
            console.log('[Upload] Enviando verso do documento...');
            results.documentBack = await uploadImage(images.documentBack, 'documents');
            console.log('[Upload] Verso do documento enviado:', results.documentBack);
        }

        return results;
    } catch (error) {
        console.error('[Upload] Erro ao fazer upload dos documentos:', error);
        throw error;
    }
}

/**
 * Faz upload das fotos de verificação facial do motorista
 */
export async function uploadFaceVerificationPhotos(photos: {
    front?: string | null;
    left?: string | null;
    right?: string | null;
    up?: string | null;
}): Promise<{
    front?: string;
    left?: string;
    right?: string;
    up?: string;
}> {
    const results: {
        front?: string;
        left?: string;
        right?: string;
        up?: string;
    } = {};

    try {
        if (photos.front) {
            results.front = await uploadImage(photos.front, 'face-verification');
        }
        if (photos.left) {
            results.left = await uploadImage(photos.left, 'face-verification');
        }
        if (photos.right) {
            results.right = await uploadImage(photos.right, 'face-verification');
        }
        if (photos.up) {
            results.up = await uploadImage(photos.up, 'face-verification');
        }

        return results;
    } catch (error) {
        console.error('[Upload] Erro ao fazer upload das fotos de verificação:', error);
        throw error;
    }
}
