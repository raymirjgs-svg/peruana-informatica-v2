export interface ProductSpecs {
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  screen_size?: string;
}

export interface ProductCategoryRef {
  id?: number;
  name: string;
  slug?: string;
  type?: string | null;
}

export interface ProductBrandRef {
  name: string;
}

export interface ProductImageRef {
  cod_galeria?: number;
  imagen: string;
}

export interface CatalogProduct {
  id?: number;
  cod_producto: number | string;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string | null;
  price: number | string;
  priceWeb?: number;
  priceCot?: number;
  priceDis?: number;
  price_web?: number | string;
  price_cot?: number | string;
  price_dis?: number | string;
  stock?: number;
  codigo_interno?: string;
  component_type?: string;
  component_specs?: ProductSpecs;
  subCategories?: ProductCategoryRef[];
  socket_type?: string;
  ram_type?: string;
  form_factor?: string;
  has_integrated_graphics?: boolean;
  tdp_watts?: number;
  images?: ProductImageRef[];
  is_featured?: boolean;
  is_new?: boolean;
  is_clearance?: boolean;
  productBrand?: ProductBrandRef;
  productCategory?: ProductBrandRef;
}
