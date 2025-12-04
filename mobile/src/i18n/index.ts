import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ptBR from './locales/pt-BR';
import en from './locales/en';
import es from './locales/es';

// Cria instância do i18n
const i18n = new I18n({
    'pt-BR': ptBR,
    'pt': ptBR, // Fallback para português genérico
    'en': en,
    'en-US': en,
    'es': es,
    'es-ES': es,
});

// Configurações
i18n.defaultLocale = 'pt-BR';
i18n.locale = 'pt-BR'; // Português Brasil como padrão
i18n.enableFallback = true;

// Idiomas disponíveis
export const availableLanguages = [
    { code: 'pt-BR', name: 'Portugues (Brasil)', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Espanol', flag: '🇪🇸' },
];

// Chave para salvar o idioma no AsyncStorage
const LANGUAGE_KEY = '@app_language';

// Função para carregar o idioma salvo
export async function loadSavedLanguage(): Promise<string> {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
            i18n.locale = savedLanguage;
            return savedLanguage;
        }
        // Se não tem idioma salvo, usa o idioma do dispositivo ou pt-BR como fallback
        // expo-localization v17+ retorna getLocales() como array
        const locales = Localization.getLocales();
        const deviceLocale = locales && locales.length > 0 ? locales[0].languageTag : 'pt-BR';
        const supportedLocale = availableLanguages.find(
            lang => deviceLocale?.startsWith(lang.code.split('-')[0])
        );
        const locale = supportedLocale?.code || 'pt-BR';
        i18n.locale = locale;
        return locale;
    } catch (error) {
        console.log('Error loading language:', error);
        return 'pt-BR';
    }
}

// Função para salvar o idioma
export async function saveLanguage(languageCode: string): Promise<void> {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
        i18n.locale = languageCode;
    } catch (error) {
        console.log('Error saving language:', error);
    }
}

// Função para obter o idioma atual
export function getCurrentLanguage(): string {
    return i18n.locale;
}

// Função para obter informações do idioma atual
export function getCurrentLanguageInfo() {
    return availableLanguages.find(lang => lang.code === i18n.locale) || availableLanguages[0];
}

// Função de tradução com tipagem
export function t(scope: string, options?: object): string {
    return i18n.t(scope, options);
}

export default i18n;
