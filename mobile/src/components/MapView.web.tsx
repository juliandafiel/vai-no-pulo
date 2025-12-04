import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock components for react-native-maps on web
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

interface MapViewProps {
    style?: any;
    children?: React.ReactNode;
    provider?: any;
    initialRegion?: any;
    region?: any;
    onPress?: (e: any) => void;
    onRegionChange?: (region: any) => void;
    onRegionChangeComplete?: (region: any) => void;
    showsUserLocation?: boolean;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    rotateEnabled?: boolean;
    pitchEnabled?: boolean;
    [key: string]: any;
}

const MapView = React.forwardRef<any, MapViewProps>(({ style, children, ...props }, ref) => {
    return (
        <View style={[styles.container, style]} ref={ref as any}>
            <View style={styles.placeholder}>
                <Text style={styles.text}>Mapa nao disponivel na web</Text>
                <Text style={styles.subtext}>Use o app no celular para ver o mapa</Text>
            </View>
            {children}
        </View>
    );
});

MapView.displayName = 'MapView';

export const Marker: React.FC<any> = ({ children }) => {
    return <>{children}</>;
};

export const Polyline: React.FC<any> = () => {
    return null;
};

export const Polygon: React.FC<any> = () => {
    return null;
};

export const Circle: React.FC<any> = () => {
    return null;
};

export const Callout: React.FC<any> = ({ children }) => {
    return <>{children}</>;
};

export const Overlay: React.FC<any> = () => {
    return null;
};

export const Heatmap: React.FC<any> = () => {
    return null;
};

export const Geojson: React.FC<any> = () => {
    return null;
};

export type MapPressEvent = {
    nativeEvent: {
        coordinate: {
            latitude: number;
            longitude: number;
        };
    };
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    subtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
});

export default MapView;
