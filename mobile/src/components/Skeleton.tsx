/**
 * Skeleton - Componentes de loading placeholder
 *
 * Uso basico:
 *   <Skeleton width={100} height={20} />
 *
 * Skeletons pre-definidos:
 *   <SkeletonText lines={3} />
 *   <SkeletonAvatar size={50} />
 *   <SkeletonCard />
 *   <TripsListSkeleton />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';

// ============================================================
// SKELETON BASE
// ============================================================

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = theme.borderRadius.sm,
    style,
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width: typeof width === 'number' ? width : width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
}

// ============================================================
// SKELETONS PRE-DEFINIDOS
// ============================================================

interface SkeletonTextProps {
    lines?: number;
    width?: number | string;
    spacing?: number;
}

export function SkeletonText({
    lines = 1,
    width = '100%',
    spacing = 8,
}: SkeletonTextProps) {
    return (
        <View>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 && lines > 1 ? '60%' : width}
                    height={16}
                    style={{ marginBottom: i < lines - 1 ? spacing : 0 }}
                />
            ))}
        </View>
    );
}

interface SkeletonAvatarProps {
    size?: number;
}

export function SkeletonAvatar({ size = 50 }: SkeletonAvatarProps) {
    return (
        <Skeleton
            width={size}
            height={size}
            borderRadius={size / 2}
        />
    );
}

export function SkeletonButton({ width = '100%' }: { width?: number | string }) {
    return (
        <Skeleton
            width={width}
            height={56}
            borderRadius={theme.borderRadius.md}
        />
    );
}

// ============================================================
// SKELETONS DE CARDS
// ============================================================

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            {/* Header com avatar */}
            <View style={styles.cardHeader}>
                <SkeletonAvatar size={44} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={70} height={24} borderRadius={12} />
            </View>

            {/* Rota */}
            <View style={styles.cardRoute}>
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
                    <Skeleton width="80%" height={14} style={{ marginLeft: 10 }} />
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: theme.colors.success }]} />
                    <Skeleton width="70%" height={14} style={{ marginLeft: 10 }} />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <Skeleton width={80} height={24} />
                <Skeleton width={100} height={36} borderRadius={18} />
            </View>
        </View>
    );
}

export function SkeletonTripCard() {
    return (
        <View style={styles.card}>
            {/* Status badge */}
            <View style={styles.tripHeader}>
                <Skeleton width={90} height={26} borderRadius={13} />
                <Skeleton width={70} height={14} />
            </View>

            {/* User info */}
            <View style={styles.cardHeader}>
                <SkeletonAvatar size={44} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width={140} height={16} />
                    <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
                </View>
            </View>

            {/* Route */}
            <View style={styles.cardRoute}>
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
                    <Skeleton width="75%" height={14} style={{ marginLeft: 10 }} />
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: theme.colors.success }]} />
                    <Skeleton width="65%" height={14} style={{ marginLeft: 10 }} />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <Skeleton width={90} height={28} />
                <Skeleton width={110} height={40} borderRadius={20} />
            </View>
        </View>
    );
}

// ============================================================
// SKELETONS DE LISTAS
// ============================================================

interface ListSkeletonProps {
    count?: number;
}

export function TripsListSkeleton({ count = 3 }: ListSkeletonProps) {
    return (
        <View style={styles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonTripCard key={i} />
            ))}
        </View>
    );
}

export function CardListSkeleton({ count = 3 }: ListSkeletonProps) {
    return (
        <View style={styles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}

// ============================================================
// SKELETONS DE TELA
// ============================================================

export function ProfileSkeleton() {
    return (
        <View style={styles.profileContainer}>
            {/* Foto de perfil */}
            <View style={styles.profilePhoto}>
                <SkeletonAvatar size={120} />
                <Skeleton width={180} height={14} style={{ marginTop: 12 }} />
                <Skeleton width={100} height={28} borderRadius={14} style={{ marginTop: 8 }} />
            </View>

            {/* Secao */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Skeleton width={24} height={24} borderRadius={12} />
                    <Skeleton width={140} height={18} style={{ marginLeft: 10 }} />
                </View>
                <View style={styles.formGroup}>
                    <Skeleton width={60} height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={50} borderRadius={12} />
                </View>
                <View style={styles.formGroup}>
                    <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={50} borderRadius={12} />
                </View>
            </View>
        </View>
    );
}

export function SearchSkeleton() {
    return (
        <View style={styles.searchContainer}>
            {/* Header */}
            <Skeleton width={200} height={28} style={{ marginBottom: 8 }} />
            <Skeleton width={250} height={14} style={{ marginBottom: 24 }} />

            {/* Campos de busca */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Skeleton width={14} height={14} borderRadius={7} />
                    <Skeleton width={120} height={18} style={{ marginLeft: 10 }} />
                </View>
                <Skeleton width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
                <View style={styles.rowInputs}>
                    <Skeleton width="65%" height={50} borderRadius={12} />
                    <Skeleton width="30%" height={50} borderRadius={12} />
                </View>
            </View>

            {/* Botao */}
            <SkeletonButton />
        </View>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#e1e1e1',
        overflow: 'hidden',
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        flex: 1,
        width: 200,
    },

    // Card
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    cardRoute: {
        marginBottom: theme.spacing.lg,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeLine: {
        width: 2,
        height: 15,
        backgroundColor: '#ddd',
        marginLeft: 4,
        marginVertical: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },

    // Trip card
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },

    // List
    list: {
        paddingHorizontal: theme.spacing.lg,
    },

    // Profile
    profileContainer: {
        padding: theme.spacing.xl,
    },
    profilePhoto: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },

    // Search
    searchContainer: {
        padding: theme.spacing.xl,
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default Skeleton;
