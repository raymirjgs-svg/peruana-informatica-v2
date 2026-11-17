import type { CatalogProduct } from '@/types/product';

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  type?: string | null;
}

export interface Product extends CatalogProduct {
  id: number;
  slug: string;
  description: string;
  stock: number;
  codigo_interno: string;
}

export interface Filters {
  minPrice: string;
  maxPrice: string;
  processor: string;
  ram: string;
  storage: string;
  subcategory: string;
  search: string; // Add search filter
}

export interface QuotationResponse {
  code: string;
  total: number | string;
}
