export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  type?: string | null;
}

export interface Product {
  id: number;
  cod_producto: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string | null;
  price: number | string;
  stock: number;
  codigo_interno: string;
  component_type?: string;
  subCategories?: SubCategory[];
  // Add component_specs as optional to prevent errors
  component_specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    screen_size?: string;
  };
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
