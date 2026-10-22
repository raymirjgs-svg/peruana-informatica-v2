import apiClient, { ApiError } from '../utils/api';

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
    async createPreference(data: CreatePreferenceRequest): Promise<PaymentPreference> {
        try {
            return await apiClient.request<PaymentPreference>('/api/payment/create-preference', {
                method: 'POST',
                auth: 'customer',
                body: data,
            });
        } catch (error) {
            if (error instanceof ApiError && error.message === 'Error en la solicitud') {
                throw new Error('Error al crear preferencia de pago');
            }
            throw error;
        }
    }

    async createPreferenceForOrder(orderId: number): Promise<PaymentPreference> {
        try {
            return await apiClient.request<PaymentPreference>('/api/payment/create-preference-order', {
                method: 'POST',
                auth: 'customer',
                body: { orderId },
            });
        } catch (error) {
            if (error instanceof ApiError && error.message === 'Error en la solicitud') {
                throw new Error('Error al generar link de pago');
            }
            throw error;
        }
    }
}

export const paymentService = new PaymentService();
