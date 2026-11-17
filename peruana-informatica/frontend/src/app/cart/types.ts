export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'yape' | 'plin' | 'mercadopago';

export type InvoiceType = 'boleta' | 'factura';

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string;
}

export interface InvoiceData {
  ruc: string;
  business_name: string;
  tax_address: string;
}

export interface CardData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}
