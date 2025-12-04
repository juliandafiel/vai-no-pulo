import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import i18n, {
    loadSavedLanguage,
    saveLanguage,
    availableLanguages,
    getCurrentLanguageInfo,
    t as translate,
} from '../i18n';

interface LanguageInfo {
    code: string;
    name: string;
    flag: string;
}

interface LanguageContextData {
    language: string;
    languageInfo: LanguageInfo;
    availableLanguages: LanguageInfo[];
    isLoading: boolean;
    setLanguage: (code: string) => Promise<void>;
    t: (scope: string, options?: object) => string;
}

const LanguageContext = createContext<LanguageContextData>({} as LanguageContextData);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<string>('pt-BR');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadLanguage() {
            const savedLanguage = await loadSavedLanguage();
            setLanguageState(savedLanguage);
            setIsLoading(false);
        }
        loadLanguage();
    }, []);

    const setLanguage = useCallback(async (code: string) => {
        await saveLanguage(code);
        setLanguageState(code);
    }, []);

    const t = useCallback((scope: string, options?: object) => {
        return translate(scope, options);
    }, [language]); // Recria quando o idioma mudar

    const languageInfo = getCurrentLanguageInfo();

    return (
        <LanguageContext.Provider
            value={{
                language,
                languageInfo,
                availableLanguages,
                isLoading,
                setLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }

    return context;
}

// Hook simplificado apenas para tradução
export function useTranslation() {
    const { t, language } = useLanguage();
    return { t, language };
}
