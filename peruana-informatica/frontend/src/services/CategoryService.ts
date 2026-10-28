// ============================================
// 2. src/services/CategoryService.ts (NUEVO)
// ============================================
import { API_CONFIG } from '@/config/api';
import apiClient from '@/utils/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  appears_in_menu?: boolean;
}

export class CategoryService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  async getCategories(): Promise<Category[]> {
    try {
      const timestamp = new Date().getTime();
      const url = `${this.baseUrl}/api/categories?t=${timestamp}`;
      console.log('🔍 Fetching categories from:', url);
      console.log('📍 Base URL configured:', this.baseUrl);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      console.log('🚀 Attempting to fetch:', url);

      const data = await apiClient.request<Category[]>(`/api/categories?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      console.error('🔧 Check if backend is running on', this.baseUrl);
      return [];
    }
  }

  async getMenuCategories(): Promise<Category[]> {
    try {
      // Asegurarse de que fetch solo se ejecute en el cliente
      if (typeof window === 'undefined') return [];

      // Asegurarse de que fetch solo se ejecute en el cliente
      if (typeof window === 'undefined') return [];

      // Normalizar la URL base
      let baseUrl = this.baseUrl;
      baseUrl = baseUrl.replace(/\/+$/, ''); // Eliminar trailing slashes

      const timestamp = new Date().getTime();
      const url = `${baseUrl}/api/categories/menu?t=${timestamp}`;

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        return [];
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const data = await apiClient.request<Category[]>(`/api/categories/menu?t=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });

        return Array.isArray(data) ? data : [];
      } catch {
        // Silenciar errores de red completamente
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      // Silenciar todos los errores completamente
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const timestamp = new Date().getTime();
      const url = `${this.baseUrl}/api/categories/${slug}?t=${timestamp}`;
      console.log('🔍 Fetching category by slug from:', url);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      console.log('🚀 Attempting to fetch:', url);

      const data = await apiClient.request<Category>(`/api/categories/${slug}?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  async testConnection(): Promise<unknown> {
    try {
      // Usar el endpoint de health check general en lugar de uno específico de categorías
      const url = `${this.baseUrl}/api/health`;
      console.log('🔍 Testing connection to:', url);
      console.log('📍 Base URL configured:', this.baseUrl);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      console.log('🚀 Attempting to fetch:', url);

      const result = await apiClient.request<unknown>('/api/health', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('✅ Test connection successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Category connection test failed:', error);

      // More detailed error logging
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? String(error.name)
          : '';
      if (errorName === 'AbortError') {
        console.error('⏰ Request timeout - server might be unreachable');
      } else if (error instanceof TypeError) {
        console.error('🌐 Network error - check if backend server is running');
        console.error('🔧 Make sure backend is running on:', this.baseUrl);
        console.error('🔧 Check browser console for detailed network errors');
      }

      throw error;
    }
  }
}
