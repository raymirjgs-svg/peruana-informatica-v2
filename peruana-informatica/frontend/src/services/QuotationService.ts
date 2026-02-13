// src/services/QuotationService.ts
import { Product } from '@/models/Product';

export interface QuotationItem {
  product_id: number;
  quantity: number;
}

export interface QuotationRequest {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  items: QuotationItem[];
  valid_until: string; // Fecha en formato ISO
}

export interface QuotationResponse {
  message: string;
  code: string;
  total: number;
}

export interface QuotationDetail {
  id: number;
  code: string;
  subtotal: number;
  igv: number;
  total: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    product: Product;
  }>;
}

export class QuotationService {
  private API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async createQuotation(quotationData: QuotationRequest): Promise<QuotationResponse> {
    const response = await fetch(`${this.API_BASE}/api/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });

    if (!response.ok) {
      throw new Error(`Error creating quotation: ${response.statusText}`);
    }

    return await response.json();
  }

  async getQuotationByCode(code: string): Promise<QuotationDetail> {
    const response = await fetch(`${this.API_BASE}/api/quotations/${code}`);

    if (!response.ok) {
      throw new Error(`Error fetching quotation: ${response.statusText}`);
    }

    return await response.json();
  }

  async validateQuotation(code: string): Promise<{ isValid: boolean; message: string }> {
    const response = await fetch(`${this.API_BASE}/api/quotations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Error validating quotation: ${response.statusText}`);
    }

    return await response.json();
  }
}