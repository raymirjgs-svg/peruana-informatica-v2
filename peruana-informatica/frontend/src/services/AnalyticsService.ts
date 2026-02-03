import { API_CONFIG } from '../config/api';
const API_BASE = API_CONFIG.API_BASE_URL;

export interface KPIs {
    totalRevenue: string;
    totalOrders: number;
    avgOrderValue: string;
    monthRevenue: string;
    monthOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    newCustomersMonth: number;
}

export interface SalesDataPoint {
    date: string;
    orders: number;
    revenue: string;
}

export interface TopProduct {
    product_id: number;
    total_sold: string;
    total_revenue: string;
    product: {
        name: string;
        slug: string;
        image: string;
        price: number;
        stock: number;
    };
}

class AnalyticsService {
    /**
     * Get key performance indicators
     */
    async getKPIs(token?: string): Promise<{ success: boolean; data: KPIs }> {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/kpis`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch KPIs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            throw error;
        }
    }

    /**
     * Get sales overview (time series)
     */
    async getSalesOverview(period: string = '30d', token?: string): Promise<{ success: boolean; data: SalesDataPoint[] }> {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/sales-overview?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch sales overview');
            return await response.json();
        } catch (error) {
            console.error('Error fetching sales overview:', error);
            throw error;
        }
    }

    /**
     * Get top selling products
     */
    async getTopProducts(limit: number = 10, token?: string): Promise<{ success: boolean; data: TopProduct[] }> {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/top-products?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch top products');
            return await response.json();
        } catch (error) {
            console.error('Error fetching top products:', error);
            throw error;
        }
    }

    /**
     * Get sales by payment method
     */
    async getSalesByPaymentMethod(token?: string) {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/payment-methods`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch payment methods');
            return await response.json();
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            throw error;
        }
    }

    /**
     * Get recent orders
     */
    async getRecentOrders(limit: number = 10, token?: string) {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/recent-orders?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch recent orders');
            return await response.json();
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            throw error;
        }
    }

    /**
     * Get conversion metrics
     */
    async getConversionMetrics(token?: string) {
        try {
            const response = await fetch(`${API_BASE}/admin/analytics/conversion`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch conversion metrics');
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversion metrics:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
