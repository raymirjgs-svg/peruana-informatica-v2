import { API_CONFIG } from '@/config/api';

export interface CartItem {
    id: number;
    product: any;
    quantity: number;
}

export interface Cart {
    id: number;
    user_id: number;
    status: string;
}

class CartService {
    private apiBase = API_CONFIG.API_BASE_URL + '/cart';

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('customerToken');
        }
        return null;
    }

    private getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Get Cart
    async getCart(): Promise<{ cart: Cart; items: CartItem[] }> {
        if (!this.getToken()) throw new Error('No auth token');

        const response = await fetch(this.apiBase, {
            headers: this.getHeaders()
        });

        if (response.status === 401) {
            console.warn('Unauthorized cart fetch - Token likely expired');
            throw new Error('Unauthorized');
        }

        if (!response.ok) throw new Error('Error getting cart');
        return await response.json();
    }

    // Sync Cart
    async syncCart(localItems: { id: number; quantity: number }[]): Promise<{ cart: Cart; items: CartItem[] }> {
        if (!this.getToken()) throw new Error('No auth token');

        const response = await fetch(`${this.apiBase}/sync`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ items: localItems })
        });

        if (response.status === 401) {
            console.warn('Unauthorized cart sync - Token likely expired');
            throw new Error('Unauthorized');
        }

        if (!response.ok) throw new Error('Error syncing cart');
        return await response.json();
    }

    // Update Item
    // Update Item
    async updateItem(productId: number, quantity: number) {
        if (!this.getToken()) return null; // Skip if no token

        const response = await fetch(`${this.apiBase}/item`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ productId, quantity })
        });

        if (response.status === 401) {
            console.warn('Unauthorized cart update - Token likely expired');
            return null;
        }

        if (!response.ok) throw new Error('Error updating item');
        return await response.json();
    }

    // Remove Item
    async removeItem(productId: number) {
        const response = await fetch(`${this.apiBase}/item/${productId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        if (!response.ok) throw new Error('Error removing item');
        return await response.json();
    }
}

export const cartService = new CartService();
