export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
}

export interface OrderBase {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_document?: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  invoice_type: string;
  invoice_number?: string;
  invoice_file?: string;
  createdAt: string;
  items?: OrderItem[];
}
