import apiClient from '../utils/api';
import type { PaginationMeta } from '../types';

export interface DiscountPage {
    data: Discount[];
    pagination: PaginationMeta;
    summary: { active: number; total: number };
}

export interface Discount {
    id: number;
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    applies_to: 'all' | 'category' | 'product';
    category_id?: number;
    product_id?: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
}

interface DiscountListResponse {
    data: Discount[];
    pagination: PaginationMeta;
    summary?: { active: number; total: number };
}

class DiscountService {
    async getAllDiscounts(token: string): Promise<Discount[]> {
        const result = await apiClient.request<DiscountListResponse>('/api/admin/discounts', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return result.data;
    }

    async getDiscountsPage(token: string, page = 1, limit = 20): Promise<DiscountPage> {
        const result = await apiClient.request<DiscountListResponse>(
            `/api/admin/discounts?page=${page}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return {
            data: result.data || [],
            pagination: result.pagination,
            summary: result.summary || { active: 0, total: 0 }
        };
    }

    async createDiscount(data: Partial<Discount>, token: string) {
        return apiClient.request('/api/admin/discounts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
        });
    }

    async updateDiscount(id: number, data: Partial<Discount>, token: string) {
        return apiClient.request(`/api/admin/discounts/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
        });
    }

    async deleteDiscount(id: number, token: string) {
        return apiClient.request(`/api/admin/discounts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
    }
}

export const discountService = new DiscountService();
