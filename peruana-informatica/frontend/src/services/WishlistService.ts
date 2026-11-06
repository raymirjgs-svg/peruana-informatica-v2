import { API_CONFIG } from '../config/api';
const API_BASE = API_CONFIG.API_BASE_URL;

export interface WishlistAnalytics {
    topProducts: Array<{
        product_id: number;
        wishlist_count: number;
        product: {
            cod_producto: string;
            name: string;
            slug: string;
            price: number;
            stock: number;
            image: string;
        };
    }>;
    stats: {
        totalWishlists: number;
        uniqueProducts: number;
        recentAdditions: number;
    };
}

class WishlistService {
    private getHeaders() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    /**
     * Get wishlist analytics (Admin)
     */
    async getAnalytics(): Promise<{ success: boolean; data: WishlistAnalytics }> {
        try {
            const response = await fetch(`${API_BASE}/api/admin/wishlists/analytics`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist analytics');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching wishlist analytics:', error);
            throw error;
        }
    }

    /**
     * Get all wishlists (Admin)
     */
    async getAllWishlists(page: number = 1, limit: number = 20) {
        try {
            const response = await fetch(
                `${API_BASE}/api/admin/wishlists?page=${page}&limit=${limit}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch wishlists');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching wishlists:', error);
            throw error;
        }
    }

    /**
     * Get wishlists by product (Admin)
     */
    async getWishlistsByProduct(productId: number) {
        try {
            const response = await fetch(
                `${API_BASE}/api/admin/wishlists/product/${productId}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch product wishlists');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching product wishlists:', error);
            throw error;
        }
    }
}

export const wishlistService = new WishlistService();
