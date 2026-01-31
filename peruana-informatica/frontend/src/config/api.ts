export const API_CONFIG = {
    // Priority: process.env > fallback to the IP provided in the previous configuration
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://200.58.98.122/api',
    
    get API_BASE_URL() {
        const trimmed = this.BASE_URL.replace(/\/+$/, '');
        // Ensure it ends with /api if not already present
        return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    },
    
    IMAGES_URL: (path?: string) => {
        if (!path) return 'https://placehold.co/100x100?text=Sin+Imagen';
        if (path.startsWith('http')) return path;
        
        // Remove /api from the end to get the root for images
        const baseUrl = this.API_BASE_URL.replace(/\/api\/?$/, '');
        return `${baseUrl}/images/products/${path}`;
    }
};
