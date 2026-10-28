// ============================================
// 🔧 API CONFIGURATION
// ============================================
// REGLA FUNDAMENTAL:
// - NEXT_PUBLIC_API_URL NUNCA incluye /api
// - Cada endpoint incluye /api en su ruta
// - Ejemplo: NEXT_PUBLIC_API_URL=http://localhost:3001
//          + endpoint=/api/products
//          = http://localhost:3001/api/products ✅

const BASE_URL = (typeof window === 'undefined')
    ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || '')
    : (process.env.NEXT_PUBLIC_API_URL || '');

export const API_CONFIG = {
    BASE_URL,

    // URL base para llamadas API (sin manipulación)
    API_BASE_URL: (() => {
        // Guarantee we strip both trailing slash AND '/api' suffix if present
        // to prevent "double api" (e.g. localhost:3001/api/api/products)
        let finalUrl = BASE_URL.replace(/\/+$/, '');
        if (finalUrl.endsWith('/api')) {
            finalUrl = finalUrl.slice(0, -4);
        }

        if (typeof window !== 'undefined') {
            console.log('🔧 API Configuration:');
            console.log('   - NEXT_PUBLIC_API_URL:', BASE_URL);
            console.log('   - Final API URL (Clean):', finalUrl);
        }

        return finalUrl;
    })(),

    // URL para imágenes (uploads)
    IMAGES_URL: (path?: string) => {
        if (!path) return 'https://placehold.co/100x100?text=Sin+Imagen';
        if (path.startsWith('http')) return path;

        const hostUrl = BASE_URL.replace(/\/+$/, '');
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;

        return `${hostUrl}/uploads/${cleanPath}`;
    },
};
