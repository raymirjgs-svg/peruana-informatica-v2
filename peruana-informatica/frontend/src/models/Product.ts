export interface ProductImage {
  cod_galeria: number;
  imagen: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  image: string;
  images?: ProductImage[];
  price: number;
  priceWeb?: number;
  priceCot?: number;
  priceDis?: number;
  stock: number;
  category: string;
  codigo_interno?: string;
  rating?: { average: number; count: number };
  createdAt: Date;
  updatedAt: Date;
  is_featured?: boolean;
  is_new?: boolean;
  is_clearance?: boolean;
  brand?: string;
}
