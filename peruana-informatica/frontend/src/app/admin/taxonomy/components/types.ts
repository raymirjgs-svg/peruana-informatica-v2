export interface Brand {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

export interface TaxonomyForm {
  brandName: string;
  categoryName: string;
  subCategoryNames: string[];
}

export interface BulkTaxonomyForm extends TaxonomyForm {
  productIds: number[];
}
