
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
}

export class SettingsService {
    private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    private static readonly API_BASE = `${SettingsService.BASE_URL}/api`;

    static async getPublicSettings(): Promise<CompanySettings> {
        try {
            const response = await fetch(`${this.API_BASE}/company-settings`, {
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
