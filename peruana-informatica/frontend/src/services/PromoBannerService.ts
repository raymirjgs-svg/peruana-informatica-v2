import { PromoBanner } from './CouponService';
import type { PaginationMeta } from '../types';
import apiClient from '../utils/api';

export interface PromoBannerPage {
    data: PromoBanner[];
    pagination: PaginationMeta;
}

interface PromoBannerMutationResponse {
    success?: boolean;
    data?: PromoBanner;
    message?: string;
}

class PromoBannerService {
    async getAllBanners(token: string): Promise<PromoBanner[]> {
        const result = await apiClient.request<{ data?: PromoBanner[] }>('/api/admin/promo-banners', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return result.data || [];
    }

    async getBannersPage(token: string, page = 1, limit = 20): Promise<PromoBannerPage> {
        const result = await apiClient.request<{
            data?: PromoBanner[];
            pagination: PaginationMeta;
        }>(`/api/admin/promo-banners?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return {
            data: result.data || [],
            pagination: result.pagination
        };
    }

    async createBanner(data: Partial<PromoBanner>, token: string) {
        return await apiClient.request<PromoBannerMutationResponse>('/api/admin/promo-banners', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: data
        });
    }

    async updateBanner(id: number, data: Partial<PromoBanner>, token: string) {
        return await apiClient.request<PromoBannerMutationResponse>(`/api/admin/promo-banners/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: data
        });
    }

    async deleteBanner(id: number, token: string) {
        return await apiClient.request<PromoBannerMutationResponse>(`/api/admin/promo-banners/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    async toggleStatus(id: number, token: string) {
        return await apiClient.request<PromoBannerMutationResponse>(`/api/admin/promo-banners/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
}

export const promoBannerService = new PromoBannerService();
