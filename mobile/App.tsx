import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ToastProvider } from './src/contexts/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomSplashScreen from './src/components/SplashScreen';

// Configura como as notificações são exibidas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Mantém a splash screen visível enquanto carrega
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    async function prepare() {
      try {
        // Simula carregamento de recursos (fontes, assets, etc)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Listener para notificações recebidas (app em foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[App] Notificação recebida:', notification);
    });

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[App] Usuário tocou na notificação:', response);
      const data = response.notification.request.content.data;

      // Navegação será tratada pelo AppNavigator via linking
      if (data?.type === 'message' && data?.orderId) {
        console.log('[App] Navegar para chat:', data.orderId);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Esconde a splash screen nativa
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleCustomSplashFinish = () => {
    setShowCustomSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppNavigator />
            {showCustomSplash && <CustomSplashScreen onFinish={handleCustomSplashFinish} />}
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
