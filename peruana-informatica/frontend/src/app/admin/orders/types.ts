export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document?: string;
  total_amount: string;
  status: 'pending' | 'processed' | 'cancelled';
  payment_method?: string;
  payment_status: 'pending' | 'verified' | 'rejected';
  payment_proof?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  invoice_type: 'boleta' | 'factura';
  invoice_number?: string;
  invoice_file?: string;
  ruc?: string;
  business_name?: string;
  tax_address?: string;
  createdAt: string;
  items?: OrderItem[];
}
