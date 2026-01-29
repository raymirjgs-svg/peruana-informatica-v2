const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Coupon {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_purchase?: number;
    max_uses?: number;
    current_uses: number;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
    description?: string;
    created_at?: string;
    // Computed for validation responses
    discount_amount?: number;
}

export interface PromoBanner {
    id: number;
    title: string;
    description?: string;
    image_url: string;
    coupon_code?: string;
    show_as_popup: boolean;
    popup_delay: number;
    priority?: number;
    is_active?: boolean;
}

class CouponService {
    // --- PUBLIC METHODS ---

    /**
     * Validate coupon code
     */
    async validateCoupon(code: string, purchaseAmount: number): Promise<{ success: boolean; data?: Coupon; message?: string }> {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    purchase_amount: purchaseAmount
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || 'Error al validar cupón'
                };
            }

            return result;
        } catch (error) {
            console.error('Error validating coupon:', error);
            return {
                success: false,
                message: 'Error de conexión al validar cupón'
            };
        }
    }

    /**
     * Apply coupon (increment usage)
     */
    async applyCoupon(code: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code.toUpperCase() }),
            });

            return await response.json();
        } catch (error) {
            console.error('Error applying coupon:', error);
            return {
                success: false,
                message: 'Error al aplicar cupón'
            };
        }
    }

    /**
     * Get active promo banners
     */
    async getActiveBanners(): Promise<{ success: boolean; data?: PromoBanner[] }> {
        try {
            const response = await fetch(`${API_BASE}/api/promo-banners/active`);

            if (!response.ok) {
                throw new Error('Failed to fetch banners');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching banners:', error);
            return { success: false };
        }
    }

    // --- ADMIN METHODS ---

    /**
     * Get all coupons (Admin)
     */
    async getAllCoupons(token: string): Promise<Coupon[]> {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch coupons');
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching coupons:', error);
            throw error;
        }
    }

    /**
     * Create new coupon
     */
    async createCoupon(data: Partial<Coupon>, token: string) {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to create coupon');
            return result;
        } catch (error) {
            console.error('Error creating coupon:', error);
            throw error;
        }
    }

    /**
     * Update coupon
     */
    async updateCoupon(id: number, data: Partial<Coupon>, token: string) {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update coupon');
            return result;
        } catch (error) {
            console.error('Error updating coupon:', error);
            throw error;
        }
    }

    /**
     * Delete coupon
     */
    async deleteCoupon(id: number, token: string) {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/admin/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to delete coupon');
            return result;
        } catch (error) {
            console.error('Error deleting coupon:', error);
            throw error;
        }
    }

    /**
     * Toggle coupon status
     */
    async toggleStatus(id: number, token: string) {
        try {
            const response = await fetch(`${API_BASE}/api/coupons/admin/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to toggle status');
            return result;
        } catch (error) {
            console.error('Error toggling status:', error);
            throw error;
        }
    }
}

export const couponService = new CouponService();
