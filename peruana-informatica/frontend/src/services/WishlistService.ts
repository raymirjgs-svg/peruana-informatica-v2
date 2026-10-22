import apiClient from '../utils/api';

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
    /**
     * Get wishlist analytics (Admin)
     */
    async getAnalytics(token?: string): Promise<{ success: boolean; data: WishlistAnalytics }> {
        try {
            return await apiClient.request<{ success: boolean; data: WishlistAnalytics }>('/api/admin/wishlists/analytics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching wishlist analytics:', error);
            throw error;
        }
    }

    /**
     * Get all wishlists (Admin)
     */
    async getAllWishlists(page: number = 1, limit: number = 20, token?: string) {
        try {
            return await apiClient.request<{
                success?: boolean;
                data?: Array<Record<string, unknown>>;
                pagination?: Record<string, unknown>;
            }>(
                `/api/admin/wishlists?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error fetching wishlists:', error);
            throw error;
        }
    }

    /**
     * Get wishlists by product (Admin)
     */
    async getWishlistsByProduct(productId: number, token?: string) {
        try {
            return await apiClient.request<{
                success?: boolean;
                data?: Array<Record<string, unknown>>;
            }>(
                `/api/admin/wishlists/product/${productId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error fetching product wishlists:', error);
            throw error;
        }
    }
}

export const wishlistService = new WishlistService();
