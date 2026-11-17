import type { OrderBase, OrderItem } from '@/types/order';

export type { OrderItem };

export interface Order extends OrderBase {
  customer_phone: string;
  status: 'pending' | 'processed' | 'cancelled';
  payment_status: 'pending' | 'verified' | 'rejected';
  payment_method?: string;
  payment_proof?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  invoice_type: 'boleta' | 'factura';
  ruc?: string;
  business_name?: string;
  tax_address?: string;
}
