import { API_CONFIG } from '@/config/api';
import { getAuthToken } from '@/lib/authTokens';

export interface CreatePreferenceRequest {
    address: string;
    phone?: string;
    document?: string;
}

export interface PaymentPreference {
    preferenceId: string;
    init_point: string;
    sandbox_init_point: string;
}

class PaymentService {
    private apiBase = API_CONFIG.API_BASE_URL + '/api/payment';

    private getToken(): string | null {
        return getAuthToken('customer');
    }

    private getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    async createPreference(data: CreatePreferenceRequest): Promise<PaymentPreference> {
        const response = await fetch(`${this.apiBase}/create-preference`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear preferencia de pago');
        }

        return await response.json();
    }

    async createPreferenceForOrder(orderId: number): Promise<PaymentPreference> {
        const response = await fetch(`${this.apiBase}/create-preference-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Send token if available, but optional if endpoint is public/generic
                ...((this.getToken()) ? { 'Authorization': `Bearer ${this.getToken()}` } : {})
            },
            body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al generar link de pago');
        }
        return await response.json();
    }
}

export const paymentService = new PaymentService();
