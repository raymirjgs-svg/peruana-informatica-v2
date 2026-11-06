// ============================================
// src/models/Product.ts
// ============================================
export interface ProductImage {
  cod_galeria: number;
  imagen: string;
}

export class Product {
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
  video_url?: string | null;
  specifications?: Array<{key: string; value: string}>;

  constructor(
    id: number,
    name: string,
    description: string,
    price: number,
    stock: number,
    category: string
  ) {
    this.id = id;
    this.name = name || `producto-${id}`;
    this.slug = this.generateSlug(this.name);
    this.description = description || '';
    this.shortDescription = this.cleanDescription(this.description).substring(0, 100);
    this.keywords = this.extractKeywords(this.name);
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.image = ''; // El ProductCard maneja imágenes vacías con no-image.svg
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private generateSlug(name: string): string {
    if (!name) return `producto-${this.id}`;
    return name
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private extractKeywords(text: string): string[] {
    return text.split(' ').slice(0, 5);
  }

  private cleanDescription(description: string): string {
    // Remover etiquetas HTML
    if (!description) return '';
    return description
      .replace(/<[^>]*>/g, ' ') // Reemplazar etiquetas por espacios
      .replace(/\s+/g, ' ')     // Colapsar espacios múltiples
      .trim();
  }

  isAvailable(): boolean {
    return this.stock > 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      price: this.price,
      priceWeb: this.priceWeb,
      priceCot: this.priceCot,
      priceDis: this.priceDis,
      stock: this.stock,
      available: this.isAvailable(),
      image: this.image,
      category: this.category,
    };
  }
}
