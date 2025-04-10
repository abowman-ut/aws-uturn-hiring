// Color constants for the application
export const COLORS = {
    primary: '#4361ee',
    primaryLight: '#d3dafb',
    success: '#2ecc71',
    successLight: '#d3f9d8',
    warning: '#ffd43b',
    warningLight: '#fff3e6',
    danger: '#e63946',
    dangerLight: '#f8d7da',
    info: '#0ea5e9',
    infoLight: '#e0f2fe',
    gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
    }
};

// Chart colors
export const CHART_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.info
];

// Spacing constants
export const SPACING = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
};

// Border radius constants
export const RADIUS = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
};

// Shadow constants
export const SHADOWS = {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

/**
 * Generates CSS variables for colors that can be used in global styles
 * @returns {string} CSS string with color variables
 */
export function generateColorVariables() {
    return `
        /* Colors */
        --color-primary: ${COLORS.primary};
        --color-primary-light: ${COLORS.primaryLight};
        --color-success: ${COLORS.success};
        --color-success-light: ${COLORS.successLight};
        --color-warning: ${COLORS.warning};
        --color-warning-light: ${COLORS.warningLight};
        --color-danger: ${COLORS.danger};
        --color-danger-light: ${COLORS.dangerLight};
        --color-info: ${COLORS.info};
        --color-info-light: ${COLORS.infoLight};
        
        /* Grays */
        --color-gray-50: ${COLORS.gray[50]};
        --color-gray-100: ${COLORS.gray[100]};
        --color-gray-200: ${COLORS.gray[200]};
        --color-gray-300: ${COLORS.gray[300]};
        --color-gray-400: ${COLORS.gray[400]};
        --color-gray-500: ${COLORS.gray[500]};
        --color-gray-600: ${COLORS.gray[600]};
        --color-gray-700: ${COLORS.gray[700]};
        --color-gray-800: ${COLORS.gray[800]};
        --color-gray-900: ${COLORS.gray[900]};
        
        /* Spacing */
        --spacing-xs: ${SPACING.xs};
        --spacing-sm: ${SPACING.sm};
        --spacing-md: ${SPACING.md};
        --spacing-lg: ${SPACING.lg};
        --spacing-xl: ${SPACING.xl};
        
        /* Border Radius */
        --radius-sm: ${RADIUS.sm};
        --radius-md: ${RADIUS.md};
        --radius-lg: ${RADIUS.lg};
        --radius-xl: ${RADIUS.xl};
        
        /* Shadows */
        --shadow-sm: ${SHADOWS.sm};
        --shadow-md: ${SHADOWS.md};
        --shadow-lg: ${SHADOWS.lg};
    `;
}

/**
 * Applies color variables to the document root
 * This should be called once during app initialization
 */
export function applyColorVariables() {
    if (typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = `:root { ${generateColorVariables()} }`;
        document.head.appendChild(style);
    }
} 