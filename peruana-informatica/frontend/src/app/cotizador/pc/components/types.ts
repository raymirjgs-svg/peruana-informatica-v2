import type { CatalogProduct } from '@/types/product';

export type Product = CatalogProduct & { cod_producto: number; stock: number };

export interface QuotationItem {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  product: Product;
}

export interface BuildStep {
  type: string;
  name: string;
  icon: string;
}

export interface PCBuild {
  motherboard?: Product;
  cpu?: Product;
  ram?: Product;
  storage?: Product;
  gpu?: Product;
  case?: Product;
  psu?: Product;
}
