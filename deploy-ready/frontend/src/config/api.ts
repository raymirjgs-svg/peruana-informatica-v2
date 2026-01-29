export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    get API_BASE_URL() {
        const trimmed = this.BASE_URL.replace(/\/+$/, '');
        return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    },
    IMAGES_URL: (path?: string) => {
        if (!path) return 'https://placehold.co/100x100?text=Sin+Imagen';
        if (path.startsWith('http')) return path;
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');
        return `${baseUrl}/images/products/${path}`;
    }
};
