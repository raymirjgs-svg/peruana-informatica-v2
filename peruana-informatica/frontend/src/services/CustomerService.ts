import apiClient from '@/utils/api';
import { getAdminAuthHeaders } from '@/lib/adminAuth';

export interface Customer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    google_id?: string;
    auth_provider: string;
    is_blocked: boolean;
    last_login?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerStats {
    total: number;
    active: number;
    blocked: number;
    newThisMonth: number;
    byProvider: {
        google: number;
        local: number;
    };
}

export interface CustomerFilters {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    authProvider?: string;
    isBlocked?: string;
}

interface CustomersResponse {
    success?: boolean;
    customers: Customer[];
    pagination: {
        totalPages: number;
        [key: string]: unknown;
    };
}

interface CustomerResponse {
    success?: boolean;
    data?: Customer;
    customer?: Customer;
    message?: string;
}

interface CustomerOrdersResponse {
    success?: boolean;
    data?: Array<Record<string, unknown>>;
    orders?: Array<Record<string, unknown>>;
}

export class CustomerService {
    /**
     * Get paginated list of customers with filters
     */
    static async getCustomers(filters?: CustomerFilters) {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.role) params.append('role', filters.role);
        if (filters?.authProvider) params.append('authProvider', filters.authProvider);
        if (filters?.isBlocked) params.append('isBlocked', filters.isBlocked);

        return await apiClient.request<CustomersResponse>(`/api/admin/customers?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeaders(),
            },
            cache: 'no-store'
        });
    }

    /**
     * Get customer by ID
     */
    static async getCustomerById(id: number) {
        return await apiClient.request<CustomerResponse>(`/api/admin/customers/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeaders(),
            },
            cache: 'no-store'
        });
    }

    /**
     * Toggle block/unblock customer
     */
    static async toggleBlockCustomer(id: number) {
        return await apiClient.request<CustomerResponse>(`/api/admin/customers/${id}/block`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeaders(),
            }
        });
    }

    /**
     * Get customer statistics
     */
    static async getCustomerStats(): Promise<CustomerStats> {
        return await apiClient.request<CustomerStats>('/api/admin/customers/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeaders(),
            },
            cache: 'no-store'
        });
    }

    /**
     * Get customer orders
     */
    static async getCustomerOrders(id: number) {
        return await apiClient.request<CustomerOrdersResponse>(`/api/admin/customers/${id}/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeaders(),
            },
            cache: 'no-store'
        });
    }
}
