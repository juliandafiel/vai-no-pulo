import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import theme from '../theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateTripWizard from '../screens/CreateTrip';
import OnboardingScreen from '../screens/OnboardingScreen';
import CreateShipmentScreen from '../screens/CreateShipmentScreen';
import MyShipmentsScreen from '../screens/MyShipmentsScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import DriverRoutesScreen from '../screens/DriverRoutesScreen';
import RegisterTypeScreen from '../screens/RegisterTypeScreen';
import CustomerRegisterScreen from '../screens/CustomerRegisterScreen';
import DriverRegisterScreen from '../screens/DriverRegisterScreen';
import TripsScreen from '../screens/TripsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/Profile';
import PedidosScreen from '../screens/PedidosScreen';
import SearchTripScreen from '../screens/SearchTripScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import RegisterMerchandiseScreen from '../screens/RegisterMerchandiseScreen';
import ConfirmShipmentScreen from '../screens/ConfirmShipmentScreen';
import ChatScreen from '../screens/ChatScreen';
import ObjectsScreen from '../screens/ObjectsScreen';
import AddObjectScreen from '../screens/AddObjectScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Configuracao de animacoes de transicao
const screenOptions = {
    ...TransitionPresets.SlideFromRightIOS,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
};

const modalOptions = {
    ...TransitionPresets.ModalSlideFromBottomIOS,
    gestureEnabled: true,
};

function TripsStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="TripsMain"
                component={TripsScreen}
                options={{ headerShown: false }}
            />
            {/* Telas do motorista */}
            <Stack.Screen
                name="DriverRoutes"
                component={DriverRoutesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateTrip"
                component={CreateTripWizard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MyShipments"
                component={MyShipmentsScreen}
                options={{ title: 'Minhas Mercadorias' }}
            />
            {/* Telas do cliente - Fluxo de envio de mercadoria */}
            <Stack.Screen
                name="SearchTrip"
                component={SearchTripScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SearchResults"
                component={SearchResultsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RegisterMerchandise"
                component={RegisterMerchandiseScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AddObject"
                component={AddObjectScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ConfirmShipment"
                component={ConfirmShipmentScreen}
                options={{ headerShown: false }}
            />
            {/* Tela legada */}
            <Stack.Screen
                name="CreateShipment"
                component={CreateShipmentScreen}
                options={{ title: 'Enviar Mercadoria' }}
            />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DriverProfile"
                component={DriverProfileScreen}
                options={{ title: 'Perfil Completo do Motorista' }}
            />
        </Stack.Navigator>
    );
}

function TrajetoStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="TrajetoMain"
                component={DriverRoutesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateTrip"
                component={CreateTripWizard}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function ObjectsStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="ObjectsMain"
                component={ObjectsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AddObject"
                component={AddObjectScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function MainTabs() {
    const { user } = useAuth();
    const isDriver = user?.userType === 'driver';
    const isCustomer = user?.userType === 'customer';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Viagens') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Trajeto') {
                        iconName = focused ? 'navigate' : 'navigate-outline';
                    } else if (route.name === 'Objetos') {
                        iconName = focused ? 'cube' : 'cube-outline';
                    } else if (route.name === 'Pedidos') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    } else if (route.name === 'Mensagens') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4facfe',
                tabBarInactiveTintColor: '#999',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Viagens" component={TripsStack} />
            {isDriver && <Tab.Screen name="Trajeto" component={TrajetoStack} />}
            {isCustomer && <Tab.Screen name="Objetos" component={ObjectsStack} />}
            <Tab.Screen name="Pedidos" component={PedidosScreen} />
            <Tab.Screen name="Mensagens" component={MessagesScreen} />
            <Tab.Screen name="Perfil" component={ProfileStack} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { signed, loading } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

    // Verifica se usuario ja completou onboarding
    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const completed = await AsyncStorage.getItem('@onboarding_complete');
            setShowOnboarding(completed !== 'true');
        } catch (error) {
            setShowOnboarding(false);
        }
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    // Loading state
    if (loading || showOnboarding === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    // Mostra onboarding para novos usuarios
    if (showOnboarding && !signed) {
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions}>
                {signed ? (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Chat"
                            component={ChatScreen}
                            options={{
                                headerShown: false,
                                ...modalOptions,
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="RegisterType"
                            component={RegisterTypeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CustomerRegister"
                            component={CustomerRegisterScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="DriverRegister"
                            component={DriverRegisterScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    tabBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        height: 65,
        ...theme.shadows.lg,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});
