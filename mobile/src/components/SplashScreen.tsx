import React, { useEffect } from 'react';
import {
    View,
    StyleSheet,
    ImageBackground,
} from 'react-native';

// Assets
const backgroundImage = require('../../assets/fundo1.jpg');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        // Aguarda 2 segundos e finaliza
        const timer = setTimeout(() => {
            onFinish();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={backgroundImage}
                style={styles.backgroundImage}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    backgroundImage: {
        flex: 1,
    },
});
