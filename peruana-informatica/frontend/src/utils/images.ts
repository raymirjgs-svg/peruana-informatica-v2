/**
 * Centralized image URL resolution utility.
 * Replaces all local `getImageUrl()` functions across the codebase.
 */

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Resolves a product image path to a full URL.
 * Handles: null/undefined, full URLs (http), and relative paths.
 */
export function getProductImageUrl(imagePath?: string | null, placeholder?: string): string {
    if (!imagePath || imagePath.trim() === '') {
        return placeholder || '/no-image.svg';
    }
    if (imagePath.startsWith('http')) return imagePath;
    return `${getBaseUrl()}/images/products/${imagePath}`;
}

/**
 * Resolves a generic backend image path (e.g., carousel, uploads).
 * For paths starting with '/', prepends the API base URL.
 */
export function getBackendImageUrl(imagePath?: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${getBaseUrl()}${imagePath}`;
    return `${getBaseUrl()}/${imagePath}`;
}
