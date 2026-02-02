const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const API_CONFIG = {
    BASE_URL,

    API_BASE_URL: (() => {
        const trimmed = BASE_URL.replace(/\/+$/, '');
        return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })(),

    IMAGES_URL: (path?: string) => {
        if (!path) return 'https://placehold.co/100x100?text=Sin+Imagen';
        if (path.startsWith('http')) return path;

        const baseUrl = BASE_URL.replace(/\/api\/?$/, '');
        return `${baseUrl}/images/products/${path}`;
    },
};
