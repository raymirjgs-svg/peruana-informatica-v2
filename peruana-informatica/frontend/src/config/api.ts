const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const API_CONFIG = {
    BASE_URL,

    API_BASE_URL: (() => {
        // Asegura que no haya trailing slash
        const cleanUrl = BASE_URL.replace(/\/+$/, '');
        // Si la URL ya termina en /api, la usamos tal cual. Si no, agregamos /api
        const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

        if (typeof window !== 'undefined') {
            console.log('🔧 API Configuration Loaded:');
            console.log('   - Original env var (NEXT_PUBLIC_API_URL):', BASE_URL);
            console.log('   - Final API URL:', finalUrl);
        }

        return finalUrl;
    })(),

    IMAGES_URL: (path?: string) => {
        if (!path) return 'https://placehold.co/100x100?text=Sin+Imagen';
        if (path.startsWith('http')) return path;

        // Construir URL de imágenes basada en el host base, no en la URL de la API
        // Si API_URL es http://api.com/api, queremos http://api.com/images
        const hostUrl = BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');

        // Si el path empieza con slash, lo quitamos para evitar dobles
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;

        return `${hostUrl}/images/products/${cleanPath}`;
    },
};
