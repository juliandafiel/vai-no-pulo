/**
 * CreateTripWizard - Wizard de criacao de trajeto em 3 etapas
 *
 * ANTES: Formulario longo com scroll infinito
 * AGORA: 3 etapas claras com indicador de progresso
 *
 * Etapas:
 * 1. Trajeto - Origem e destino
 * 2. Data e Hora - Quando vai viajar
 * 3. Capacidade - Peso disponivel e confirmacao
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Animated,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StepIndicator from './components/StepIndicator';
import Step1Route from './steps/Step1Route';
import Step2DateTime from './steps/Step2DateTime';
import Step3Capacity from './steps/Step3Capacity';
import theme from '../../theme';
import { AddressResult } from '../../components/AddressAutocomplete';

const { width } = Dimensions.get('window');

const STEPS = [
    { id: 1, title: 'Trajeto' },
    { id: 2, title: 'Data/Hora' },
    { id: 3, title: 'Capacidade' },
];

interface TripData {
    origin: AddressResult | null;
    destination: AddressResult | null;
    date: Date;
    time: string;
    capacity: number;
    availableWeight: number;
}

export default function CreateTripWizard() {
    const navigation = useNavigation<any>();
    const [currentStep, setCurrentStep] = useState(1);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;

    const [tripData, setTripData] = useState<TripData>({
        origin: null,
        destination: null,
        date: new Date(),
        time: '08:00',
        capacity: 100,
        availableWeight: 100,
    });

    const animateToStep = useCallback((fromStep: number, toStep: number) => {
        const direction = toStep > fromStep ? -1 : 1;

        // Anima saida
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: direction * width,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: toStep,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start(() => {
            setCurrentStep(toStep);
            slideAnim.setValue(-direction * width);

            // Anima entrada
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 15,
            }).start();
        });
    }, [slideAnim, progressAnim]);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= STEPS.length && step !== currentStep) {
            animateToStep(currentStep, step);
        }
    }, [currentStep, animateToStep]);

    const handleNext = useCallback(() => {
        if (currentStep < STEPS.length) {
            goToStep(currentStep + 1);
        }
    }, [currentStep, goToStep]);

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    }, [currentStep, goToStep, navigation]);

    const updateTripData = useCallback((data: Partial<TripData>) => {
        setTripData((prev) => ({ ...prev, ...data }));
    }, []);

    const renderStep = useCallback(() => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1Route
                        data={tripData}
                        onUpdate={updateTripData}
                        onNext={handleNext}
                    />
                );
            case 2:
                return (
                    <Step2DateTime
                        data={tripData}
                        onUpdate={updateTripData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                    <Step3Capacity
                        data={tripData}
                        onUpdate={updateTripData}
                        onBack={handleBack}
                    />
                );
            default:
                return null;
        }
    }, [currentStep, tripData, updateTripData, handleNext, handleBack]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Indicador de progresso */}
            <StepIndicator
                steps={STEPS}
                currentStep={currentStep}
                animatedProgress={progressAnim}
            />

            {/* Conteudo animado */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                {renderStep()}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
    },
});
