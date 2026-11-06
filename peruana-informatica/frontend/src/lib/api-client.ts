// ============================================
// 🌐 API CLIENT CENTRALIZADO
// ============================================
// Cliente único para TODAS las llamadas a la API
// Garantiza consistencia y evita duplicación de código

import { API_CONFIG } from '@/config/api';

interface ApiFetchOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Cliente API centralizado
 * @param endpoint - Debe empezar con /api/ (ej: /api/products)
 * @param options - Opciones de fetch
 */
export async function apiFetch<T = any>(
    endpoint: string,
    options?: ApiFetchOptions
): Promise<T> {
    // Validación crítica: endpoint DEBE empezar con /api/
    if (!endpoint.startsWith('/api/')) {
        console.error('❌ API endpoint incorrecto:', endpoint);
        throw new Error(
            `Endpoint debe empezar con /api/. Recibido: ${endpoint}\n` +
            `Ejemplo correcto: /api/products`
        );
    }

    const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;

    if (typeof window !== 'undefined') {
        console.log('📡 API Call:', url);
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                url,
                body: errorText
            });

            throw new Error(
                `API Error: ${response.status} ${response.statusText}\n` +
                `URL: ${url}\n` +
                `Response: ${errorText.substring(0, 200)}`
            );
        }

        return response.json();
    } catch (error) {
        console.error('❌ API Fetch Error:', error);
        throw error;
    }
}

/**
 * GET request helper
 */
export function apiGet<T = any>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * PUT request helper
 */
export function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * DELETE request helper
 */
export function apiDelete<T = any>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: 'DELETE' });
}
