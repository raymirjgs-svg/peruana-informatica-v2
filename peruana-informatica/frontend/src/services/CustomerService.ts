import { API_CONFIG } from '@/config/api';

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

export class CustomerService {
    private static readonly BASE_URL = `${API_CONFIG.BASE_URL}/api/admin/customers`;

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

        const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Error fetching customers');
        return await response.json();
    }

    /**
     * Get customer by ID
     */
    static async getCustomerById(id: number) {
        const response = await fetch(`${this.BASE_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Error fetching customer');
        return await response.json();
    }

    /**
     * Toggle block/unblock customer
     */
    static async toggleBlockCustomer(id: number) {
        const response = await fetch(`${this.BASE_URL}/${id}/block`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Error toggling customer block');
        return await response.json();
    }

    /**
     * Get customer statistics
     */
    static async getCustomerStats(): Promise<CustomerStats> {
        const response = await fetch(`${this.BASE_URL}/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Error fetching stats');
        return await response.json();
    }

    /**
     * Get customer orders
     */
    static async getCustomerOrders(id: number) {
        const response = await fetch(`${this.BASE_URL}/${id}/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Error fetching orders');
        return await response.json();
    }
}
