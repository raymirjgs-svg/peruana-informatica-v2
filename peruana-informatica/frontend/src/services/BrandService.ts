// ============================================
// 1. src/services/BrandService.ts (NUEVO)
// ============================================
import apiClient from '@/utils/api';

export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export class BrandService {
  async getBrands(): Promise<Brand[]> {
    try {
      // Asegurarse de que fetch solo se ejecute en el cliente
      if (typeof window === 'undefined') return [];

      const data = await apiClient.request<Brand[]>('/api/brands', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    try {
      const data = await apiClient.request<Brand>(`/api/brands/${slug}`);
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
}
