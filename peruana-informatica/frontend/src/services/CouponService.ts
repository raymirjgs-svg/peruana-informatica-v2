import apiClient from '../utils/api';
import type { PaginationMeta } from '../types';

export interface CouponPage {
    data: Coupon[];
    pagination: PaginationMeta;
    summary: { active: number; totalUses: number; total: number };
}

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

interface CouponMutationResponse {
    success?: boolean;
    data?: Coupon;
    message?: string;
}

class CouponService {
    // --- PUBLIC METHODS ---

    /**
     * Validate coupon code
     */
    async validateCoupon(code: string, purchaseAmount: number): Promise<{ success: boolean; data?: Coupon; message?: string }> {
        try {
            return await apiClient.request<{ success: boolean; data?: Coupon; message?: string }>('/api/coupons/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    code: code.toUpperCase(),
                    purchase_amount: purchaseAmount
                },
            });
        } catch (error) {
            console.error('Error validating coupon:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error de conexión al validar cupón'
            };
        }
    }

    /**
     * Apply coupon (increment usage)
     */
    async applyCoupon(code: string): Promise<{ success: boolean; message?: string }> {
        try {
            return await apiClient.request<{ success: boolean; message?: string }>('/api/coupons/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: { code: code.toUpperCase() },
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error al aplicar cupón'
            };
        }
    }

    /**
     * Get active promo banners
     */
    async getActiveBanners(): Promise<{ success: boolean; data?: PromoBanner[] }> {
        try {
            return await apiClient.request<{ success: boolean; data?: PromoBanner[] }>('/api/promo-banners/active');
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
            const result = await apiClient.request<{ data?: Coupon[] }>('/api/admin/coupons', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return result.data || [];
        } catch (error) {
            console.error('Error fetching coupons:', error);
            throw error;
        }
    }

    /**
     * Get a paginated coupon page with aggregates (Admin)
     */
    async getCouponsPage(token: string, page = 1, limit = 20): Promise<CouponPage> {
        try {
            const result = await apiClient.request<{
                data?: Coupon[];
                pagination: PaginationMeta;
                summary?: { active: number; totalUses: number; total: number };
            }>(`/api/admin/coupons?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                data: result.data || [],
                pagination: result.pagination,
                summary: result.summary || { active: 0, totalUses: 0, total: 0 }
            };
        } catch (error) {
            console.error('Error fetching coupons page:', error);
            throw error;
        }
    }

    /**
     * Create new coupon
     */
    async createCoupon(data: Partial<Coupon>, token: string) {
        try {
            return await apiClient.request<CouponMutationResponse>('/api/admin/coupons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
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
            return await apiClient.request<CouponMutationResponse>(`/api/admin/coupons/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
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
            return await apiClient.request<CouponMutationResponse>(`/api/admin/coupons/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            throw error;
        }
    }

    /**
     * Toggle coupon status
     */
    async toggleStatus(id: number, is_active: boolean, token: string) {
        try {
            return await apiClient.request<CouponMutationResponse>(`/api/admin/coupons/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: { is_active }
            });
        } catch (error) {
            console.error('Error toggling status:', error);
            throw error;
        }
    }
}

export const couponService = new CouponService();
