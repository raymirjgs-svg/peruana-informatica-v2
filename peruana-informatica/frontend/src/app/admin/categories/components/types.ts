export interface Category {
  id: number;
  name: string;
  slug: string;
  appears_in_menu: boolean;
  seo_title?: string;
  seo_description?: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  order: number;
  description?: string;
  is_active: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CategoryFormData {
  name: string;
  slug: string;
  appears_in_menu: boolean;
  seo_title: string;
  seo_description: string;
}

export interface SubcategoryFormData {
  name: string;
  slug: string;
  category_id: number;
  order: number;
  description: string;
}
