import { getAuthToken } from '@/lib/authTokens';
import apiClient, { ApiError } from '../utils/api';
import type { Product } from '@/models/Product';

export interface CartItem {
    id?: number;
    product: Product;
    quantity: number;
}

export interface Cart {
    id: number;
    user_id: number;
    status: string;
}

class CartService {
    private getToken(): string | null {
        return getAuthToken('customer');
    }

    // Get Cart
    async getCart(): Promise<{ cart: Cart; items: CartItem[] }> {
        if (!this.getToken()) throw new Error('No auth token');

        try {
            return await apiClient.request<{ cart: Cart; items: CartItem[] }>('/api/cart', {
                auth: 'customer'
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                console.warn('Unauthorized cart fetch - Token likely expired');
                throw new Error('Unauthorized');
            }
            throw error;
        }
    }

    // Sync Cart
    async syncCart(localItems: { id: number; quantity: number }[]): Promise<{ cart: Cart; items: CartItem[] }> {
        if (!this.getToken()) throw new Error('No auth token');

        try {
            return await apiClient.request<{ cart: Cart; items: CartItem[] }>('/api/cart/sync', {
                method: 'POST',
                auth: 'customer',
                body: { items: localItems }
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                console.warn('Unauthorized cart sync - Token likely expired');
                throw new Error('Unauthorized');
            }
            throw error;
        }
    }

    // Update Item
    // Update Item
    async updateItem(productId: number, quantity: number) {
        if (!this.getToken()) return null; // Skip if no token

        try {
            return await apiClient.request<unknown>('/api/cart/item', {
                method: 'POST',
                auth: 'customer',
                body: { productId, quantity }
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                console.warn('Unauthorized cart update - Token likely expired');
                return null;
            }
            throw error;
        }
    }

    // Remove Item
    async removeItem(productId: number) {
        return await apiClient.request<unknown>(`/api/cart/item/${productId}`, {
            method: 'DELETE',
            auth: 'customer'
        });
    }
}

export const cartService = new CartService();
