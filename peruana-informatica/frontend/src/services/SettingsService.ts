
export interface CompanySettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_whatsapp?: string;
    company_website?: string;
    store_address?: string;
    store_hours?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    logo_url?: string;
    show_distributor_price_in_detail?: boolean;
    // Shipping & returns
    shipping_standard_title?: string;
    shipping_standard_subtitle?: string;
    shipping_standard_badge?: string;
    shipping_express_title?: string;
    shipping_express_subtitle?: string;
    shipping_express_badge?: string;
    return_policy_lines?: string;
}

import { API_CONFIG } from '../config/api';

export class SettingsService {
    private static readonly API_BASE = API_CONFIG.API_BASE_URL;

    static async getGlobalSettings(): Promise<Record<string, string>> {
        try {
            const response = await fetch(`${this.API_BASE}/api/settings`, {
                next: { revalidate: 60 },
            } as RequestInit);
            if (!response.ok) throw new Error('Error fetching global settings');
            return await response.json();
        } catch {
            return {};
        }
    }

    static async getPublicSettings(): Promise<CompanySettings> {
        try {
            const response = await fetch(`${this.API_BASE}/api/company-settings`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error fetching public settings');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Retornar valores por defecto en caso de error para no romper la UI
            return {
                company_name: 'Peruana Informática',
                company_address: '',
                company_phone: '',
                company_email: '',
                company_whatsapp: '988552455',
                show_distributor_price_in_detail: false
            };
        }
    }
}
