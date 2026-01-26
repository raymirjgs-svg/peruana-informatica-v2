const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
            const response = await fetch(`${API_BASE}/api/admin/wishlists/analytics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
    async getAllWishlists(page: number = 1, limit: number = 20, token?: string) {
        try {
            const response = await fetch(
                `${API_BASE}/api/admin/wishlists?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
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
    async getWishlistsByProduct(productId: number, token?: string) {
        try {
            const response = await fetch(
                `${API_BASE}/api/admin/wishlists/product/${productId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
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
