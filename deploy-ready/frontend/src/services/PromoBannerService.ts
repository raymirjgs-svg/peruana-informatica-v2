import { PromoBanner } from './CouponService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class PromoBannerService {
    async getAllBanners(token: string): Promise<PromoBanner[]> {
        const response = await fetch(`${API_BASE}/api/admin/promo-banners`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch banners');
        const result = await response.json();
        return result.data || [];
    }

    async createBanner(data: Partial<PromoBanner>, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/promo-banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create banner');
        }
        return await response.json();
    }

    async updateBanner(id: number, data: Partial<PromoBanner>, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/promo-banners/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update banner');
        }
        return await response.json();
    }

    async deleteBanner(id: number, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/promo-banners/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete banner');
        return await response.json();
    }

    async toggleStatus(id: number, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/promo-banners/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to toggle status');
        return await response.json();
    }
}

export const promoBannerService = new PromoBannerService();
