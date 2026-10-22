import apiClient from '../utils/api';

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
            return await apiClient.request<{ success: boolean; data: KPIs }>('/api/admin/analytics/kpis', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            return await apiClient.request<{ success: boolean; data: SalesDataPoint[] }>(`/api/admin/analytics/sales-overview?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            return await apiClient.request<{ success: boolean; data: TopProduct[] }>(`/api/admin/analytics/top-products?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            return await apiClient.request<{ success: boolean; data: Array<Record<string, unknown>> }>('/api/admin/analytics/payment-methods', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            return await apiClient.request<{ success: boolean; data: Array<Record<string, unknown>> }>(`/api/admin/analytics/recent-orders?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            return await apiClient.request<{ success: boolean; data: Record<string, unknown> }>('/api/admin/analytics/conversion', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching conversion metrics:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
