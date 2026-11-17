/**
 * Centralized image URL resolution utility.
 * Replaces all local `getImageUrl()` functions across the codebase.
 *
 * Reglas:
 *  1. URL absoluta (http/https) -> se devuelve tal cual (NUNCA se le antepone el prefijo).
 *  2. Ruta que ya contiene /images/ o /uploads/ -> se le antepone solo el host.
 *  3. Nombre de archivo -> {host}/images/products/{nombre codificado}.
 *  4. Vacio -> placeholder.
 */

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const IMAGE_PLACEHOLDER = '/no-image.svg';

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Hosts internos que nunca son accesibles desde el navegador del visitante
 * (datos guardados por el ERP o por el panel en desarrollo).
 */
const INTERNAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/i;

/**
 * Si la URL apunta a un host interno, se convierte en ruta relativa para
 * que el helper la resuelva contra el host publico.
 */
const stripInternalHost = (value: string): string | null => {
    try {
        const url = new URL(value);
        if (!INTERNAL_HOST.test(url.host)) return null;
        return `${url.pathname}${url.search}`;
    } catch {
        return null;
    }
};

/**
 * Si la ruta ya trae la carpeta de imagenes (/images/... o /uploads/...),
 * se extrae el nombre final para no duplicar el prefijo.
 */
const splitKnownImagePath = (path: string): { prefix: string; file: string } | null => {
    const match = path.match(/^(.*?)(\/images\/products\/|\/images\/|\/uploads\/)(.+)$/i);
    if (!match) return null;
    return { prefix: match[2] ?? '', file: match[3] ?? '' };
};

/**
 * Resolves a product image path to a full URL.
 * Handles: null/undefined, full URLs (http), relative paths and already-prefixed paths.
 */
export function getProductImageUrl(imagePath?: string | null, placeholder?: string): string {
    const fallback = placeholder || IMAGE_PLACEHOLDER;
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return fallback;
    }

    const value = imagePath.trim();

    // 1. URL absoluta: se respeta tal cual (el ERP guarda URLs completas).
    //    Salvo que apunte a un host interno (localhost / IP privada): esos se
    //    reescriben contra el host publico.
    if (ABSOLUTE_URL.test(value)) {
        const relative = stripInternalHost(value);
        if (!relative) return value;
        return getProductImageUrl(relative, fallback);
    }

    const base = getBaseUrl().replace(/\/+$/, '');

    // 2. Ruta con subcarpeta conocida: solo se antepone el host.
    const known = splitKnownImagePath(value);
    if (known) {
        const prefix = known.prefix.startsWith('/') ? known.prefix : `/${known.prefix}`;
        return `${base}${prefix}${encodeURIComponent(known.file)}`;
    }

    // 3. Nombre de archivo simple.
    return `${base}/images/products/${encodeURIComponent(value)}`;
}

/**
 * Resolves a generic backend image path (e.g., carousel, uploads).
 * For paths starting with '/', prepends the API base URL.
 */
export function getBackendImageUrl(imagePath?: string): string {
    if (!imagePath) return '';
    if (ABSOLUTE_URL.test(imagePath)) {
        const relative = stripInternalHost(imagePath);
        if (!relative) return imagePath;
        return getBackendImageUrl(relative);
    }
    const base = getBaseUrl().replace(/\/+$/, '');
    if (imagePath.startsWith('/')) return `${base}${imagePath}`;
    return `${base}/${imagePath}`;
}

/**
 * Normaliza el nombre de archivo para comparar contra el disco (evita doble encode).
 */
export function getProductImageFilename(imagePath?: string | null): string {
    if (!imagePath) return '';
    const value = imagePath.trim();
    const known = splitKnownImagePath(value);
    const file = known ? known.file : value;
    try {
        return decodeURIComponent(file);
    } catch {
        return file;
    }
}
