export interface CompanySettings {
  id: number;
  company_name: string;
  company_ruc: string;
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

export interface CompanySettingsForm {
  company_name: string;
  company_ruc: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_whatsapp: string;
  company_website: string;
  store_address: string;
  store_hours: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  logo_url: string;
  show_distributor_price_in_detail: boolean;
}
