// ============================================
// 1. src/services/BrandService.ts (NUEVO)
// ============================================
import { API_CONFIG } from '@/config/api';

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  show_in_carousel?: boolean;
}

export class BrandService {
  private baseUrl = API_CONFIG.BASE_URL;

  async getBrands(): Promise<Brand[]> {
    try {
      // Asegurarse de que fetch solo se ejecute en el cliente
      if (typeof window === 'undefined') return [];

      const response = await fetch(`${this.baseUrl}/api/brands`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Error fetching brands');
      const json = await response.json();
      const list = Array.isArray(json) ? json : (json.data ?? []);
      return list as Brand[];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/brands/${slug}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data as Brand;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
}

export const brandService = new BrandService();
