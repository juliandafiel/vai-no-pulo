/**
 * ToastContext - Gerenciador global de toasts
 *
 * Uso:
 *   // No componente
 *   const { showToast } = useToast();
 *
 *   // Mostrar toast
 *   showToast('Operacao realizada!', 'success');
 *   showToast('Erro ao salvar', 'error');
 *   showToast('Atencao!', 'warning');
 *   showToast('Informacao', 'info');
 *
 *   // Com acao
 *   showToast('Item removido', 'info', {
 *       action: { label: 'Desfazer', onPress: () => {} }
 *   });
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastOptions {
    duration?: number;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastContextData {
    showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
        duration: 3000,
    });

    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
        options?: ToastOptions
    ) => {
        setToast({
            visible: true,
            message,
            type,
            duration: options?.duration || 3000,
            action: options?.action,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onHide={hideToast}
                action={toast.action}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastContext;
