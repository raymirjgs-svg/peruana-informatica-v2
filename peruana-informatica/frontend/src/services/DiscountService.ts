import { API_CONFIG } from '../config/api';
import type { PaginationMeta } from '../types';
const API_BASE = API_CONFIG.API_BASE_URL;

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

class DiscountService {
    async getAllDiscounts(token: string): Promise<Discount[]> {
        const response = await fetch(`${API_BASE}/api/admin/discounts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch discounts');
        const data = await response.json();
        return data.data;
    }

    async getDiscountsPage(token: string, page = 1, limit = 20): Promise<DiscountPage> {
        const response = await fetch(`${API_BASE}/api/admin/discounts?page=${page}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch discounts');
        const result = await response.json();
        return {
            data: result.data || [],
            pagination: result.pagination,
            summary: result.summary || { active: 0, total: 0 }
        };
    }

    async createDiscount(data: Partial<Discount>, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/discounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create discount');
        return await response.json();
    }

    async updateDiscount(id: number, data: Partial<Discount>, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/discounts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update discount');
        return await response.json();
    }

    async deleteDiscount(id: number, token: string) {
        const response = await fetch(`${API_BASE}/api/admin/discounts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete discount');
        return await response.json();
    }
}

export const discountService = new DiscountService();
