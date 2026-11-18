import { API_CONFIG } from '@/config/api';

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
    private apiBase = API_CONFIG.API_BASE_URL + '/api/payments';

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('customerToken');
        }
        return null;
    }

    private getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    async createPreferenceForOrder(orderId: number, trackingCode?: string): Promise<PaymentPreference> {
        if (!trackingCode) {
            throw new Error('Falta el código de seguimiento del pedido');
        }

        // El codigo de seguimiento es la credencial: el id numerico del pedido
        // nunca se envia al backend de pagos.
        const response = await fetch(
            `${API_CONFIG.API_BASE_URL}/api/orders/track/${encodeURIComponent(trackingCode)}/payment-preference`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || 'Error al generar link de pago');
        }

        const payload = await response.json();
        return {
            preferenceId: payload?.data?.preference_id,
            init_point: payload?.data?.init_point,
            sandbox_init_point: payload?.data?.sandbox_init_point,
        };
    }
}

export const paymentService = new PaymentService();
