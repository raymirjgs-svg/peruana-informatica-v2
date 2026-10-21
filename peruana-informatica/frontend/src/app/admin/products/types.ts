export type Brand = { id: number; name: string; slug: string } | null;
export type Category = { id: number; name: string; slug: string } | null;

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  is_active?: boolean;
  productBrand?: Brand;
  productCategory?: Category;
  images?: { cod_galeria: number; imagen: string }[];
  is_featured?: boolean;
  is_new?: boolean;
  is_clearance?: boolean;
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  totalPages: number;
};

export type ProductForm = {
  codigo_interno: string;
  erp_name: string;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category_id?: number | undefined;
  brand_id?: number | undefined;
  image: string;
  keywords: string;
  seo_title: string;
  seo_description: string;
  subcategory_ids: number[];
};

export type EditForm = {
  name: string;
  description: string;
  price: number;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_clearance: boolean;
};