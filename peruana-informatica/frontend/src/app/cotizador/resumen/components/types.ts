export interface QuotationItem {
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    product?: any;
}

export interface QuotationFormData {
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_company?: string;
    client_ruc?: string;
    client_address?: string;
    delivery_method: 'delivery' | 'pickup';
    delivery_address?: string;
    special_requirements?: string;
}

export interface QuotationResult {
    code: string;
    client_name: string;
    total: number | string;
    date: string;
}
