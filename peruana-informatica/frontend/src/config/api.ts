// ============================================
// 🔧 API CONFIGURATION
// ============================================
// REGLA FUNDAMENTAL:
// - NEXT_PUBLIC_API_URL NUNCA incluye /api
// - Cada endpoint incluye /api en su ruta
// - Ejemplo: NEXT_PUBLIC_API_URL=http://localhost:3001
//          + endpoint=/api/products
//          = http://localhost:3001/api/products ✅

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const API_CONFIG = {
    BASE_URL,

    // URL base para llamadas API (sin manipulación)
    API_BASE_URL: (() => {
        const finalUrl = BASE_URL.replace(/\/+$/, ''); // Solo eliminar trailing slash

        if (typeof window !== 'undefined') {
            console.log('🔧 API Configuration:');
            console.log('   - NEXT_PUBLIC_API_URL:', BASE_URL);
            console.log('   - Final API URL:', finalUrl);
            console.log('   - Example endpoint: ' + finalUrl + '/api/products');
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
