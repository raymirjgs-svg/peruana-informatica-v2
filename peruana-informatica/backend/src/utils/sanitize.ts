/**
 * Centralized sanitization utilities.
 */

/**
 * Sanitizes a slug by removing all characters except alphanumeric and hyphens.
 */
export function sanitizeSlug(slug: string): string {
    return slug.replace(/[^a-zA-Z0-9-]/g, '');
}
