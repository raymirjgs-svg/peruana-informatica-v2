/**
 * Centralized formatting utilities.
 * Replaces inline price/date formatting across the codebase.
 */

/**
 * Formats a price in Peruvian Soles.
 */
export function formatPrice(price: number | string): string {
    const num = Number(price);
    if (isNaN(num) || num <= 0) return 'Consultar';
    return `S/. ${num.toFixed(2)}`;
}

/**
 * Formats a date string in Spanish (Peru locale).
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Date(date).toLocaleDateString('es-PE', options || defaultOptions);
}
