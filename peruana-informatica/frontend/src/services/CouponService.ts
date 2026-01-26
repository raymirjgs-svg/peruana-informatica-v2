const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Coupon {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    discount_amount: number;
    description?: string;
}

export interface PromoBanner {
    id: number;
    title: string;
    description?: string;
    image_url: string;
    coupon_code?: string;
    show_as_popup: boolean;
    popup_delay: number;
}

class CouponService {
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
}

export const couponService = new CouponService();
