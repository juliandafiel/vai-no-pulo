/**
 * Theme - Design System do App "Vai no Pulo"
 *
 * Uso: import theme from '../theme';
 *      style={{ color: theme.colors.primary }}
 */

export const colors = {
    // Primarias
    primary: '#4facfe',
    primaryDark: '#3d8fd9',
    primaryLight: '#e8f4fe',

    // Secundarias
    secondary: '#667eea',
    secondaryDark: '#5567d4',
    secondaryLight: '#f0f4ff',

    // Semanticas
    success: '#00f260',
    successDark: '#00c04b',
    successLight: '#e8f8f5',

    warning: '#f39c12',
    warningDark: '#d68910',
    warningLight: '#fef3e2',

    error: '#e74c3c',
    errorDark: '#c0392b',
    errorLight: '#ffebee',

    // Neutras
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#ffffff',

    background: '#f8f9fa',
    surface: '#ffffff',

    border: '#e1e1e1',
    borderLight: '#f0f0f0',
    borderFocus: '#4facfe',

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',
    overlayLight: 'rgba(0,0,0,0.3)',

    // Redes sociais
    whatsapp: '#25D366',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
};

export const borderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
};

export const typography = {
    // Headings
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: colors.text,
        lineHeight: 34,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: colors.text,
        lineHeight: 30,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: colors.text,
        lineHeight: 26,
    },
    h4: {
        fontSize: 17,
        fontWeight: '600' as const,
        color: colors.text,
        lineHeight: 22,
    },

    // Body
    body: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 22,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },

    // Caption
    caption: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 16,
    },

    // Labels
    label: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: colors.text,
    },

    // Buttons
    button: {
        fontSize: 16,
        fontWeight: 'bold' as const,
    },
    buttonSmall: {
        fontSize: 14,
        fontWeight: '600' as const,
    },
};

export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
    },
    primary: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    success: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
};

// Tamanhos de touch target (acessibilidade)
export const touchTargets = {
    min: 44, // Minimo recomendado iOS/Android
    sm: 36,
    md: 44,
    lg: 56,
};

// Componentes pre-definidos
export const components = {
    // Container padrao de tela
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Input padrao
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        height: 56,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 15,
        color: colors.text,
    },

    inputFocused: {
        borderColor: colors.primary,
        borderWidth: 2,
    },

    inputError: {
        borderColor: colors.error,
        borderWidth: 2,
    },

    // Botao primario
    buttonPrimary: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.md,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        flexDirection: 'row' as const,
        ...shadows.primary,
    },

    buttonPrimaryText: {
        color: colors.textInverse,
        fontSize: 16,
        fontWeight: 'bold' as const,
    },

    buttonDisabled: {
        backgroundColor: colors.border,
        ...shadows.none,
    },

    // Botao secundario (outline)
    buttonSecondary: {
        backgroundColor: 'transparent',
        height: 56,
        borderRadius: borderRadius.md,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        flexDirection: 'row' as const,
        borderWidth: 2,
        borderColor: colors.primary,
    },

    buttonSecondaryText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold' as const,
    },

    // Card
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
    },

    // Section (agrupamento de conteudo)
    section: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },

    // Header de secao
    sectionHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },

    // Badge
    badge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight,
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: colors.primary,
    },

    // Tab bar flutuante
    tabBar: {
        position: 'absolute' as const,
        bottom: spacing.xl,
        left: spacing.xl,
        right: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        height: 65,
        ...shadows.lg,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
    },
};

// Status colors (para badges de status)
export const statusColors = {
    pending: {
        background: colors.warningLight,
        text: colors.warning,
        border: colors.warning,
    },
    approved: {
        background: colors.successLight,
        text: colors.successDark,
        border: colors.success,
    },
    rejected: {
        background: colors.errorLight,
        text: colors.error,
        border: colors.error,
    },
    inProgress: {
        background: colors.primaryLight,
        text: colors.primary,
        border: colors.primary,
    },
    completed: {
        background: colors.successLight,
        text: colors.success,
        border: colors.success,
    },
    cancelled: {
        background: colors.errorLight,
        text: colors.error,
        border: colors.error,
    },
};

const theme = {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    touchTargets,
    components,
    statusColors,
};

export default theme;
