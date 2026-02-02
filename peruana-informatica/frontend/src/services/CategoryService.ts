// ============================================
// 2. src/services/CategoryService.ts (NUEVO)
// ============================================
import { API_CONFIG } from '@/config/api';

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
      const url = `${this.baseUrl}/categories?t=${timestamp}`;
      console.log('🔍 Fetching categories from:', url);
      console.log('📍 Base URL configured:', this.baseUrl);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      let response;
      try {
        console.log('🚀 Attempting to fetch:', url);
        response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        console.log('✅ Fetch successful, response object:', response);
      } catch (networkError) {
        console.error('❌ Network error:', networkError);
        console.error('📍 Attempted URL:', url);
        console.error('📍 Base URL:', this.baseUrl);
        console.error('📍 Full error object:', networkError);
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}. Attempted to fetch: ${url}`);
      }

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ Categories API error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? (data as Category[]) : [];
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
      const url = `${baseUrl}/categories/menu?t=${timestamp}`;

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        return [];
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });
      } catch (networkError: any) {
        clearTimeout(timeoutId);
        // Silenciar errores de red completamente
        return [];
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Silenciar errores HTTP, retornar array vacío
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Silenciar todos los errores completamente
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const timestamp = new Date().getTime();
      const url = `${this.baseUrl}/categories/${slug}?t=${timestamp}`;
      console.log('🔍 Fetching category by slug from:', url);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      let response;
      try {
        console.log('🚀 Attempting to fetch:', url);
        response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        console.log('✅ Fetch successful, response object:', response);
      } catch (networkError) {
        console.error('❌ Network error:', networkError);
        console.error('📍 Attempted URL:', url);
        console.error('📍 Base URL:', this.baseUrl);
        console.error('📍 Full error object:', networkError);
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}. Attempted to fetch: ${url}`);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ Category by slug API error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data as Category;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  async testConnection(): Promise<any> {
    try {
      // Usar el endpoint de health check general en lugar de uno específico de categorías
      const url = `${this.baseUrl}/health`;
      console.log('🔍 Testing connection to:', url);
      console.log('📍 Base URL configured:', this.baseUrl);

      // Verificar que la URL sea válida
      try {
        new URL(url);
      } catch (urlError) {
        console.error('❌ Invalid URL:', url);
        throw new Error(`Invalid URL: ${url}`);
      }

      let response;
      try {
        console.log('🚀 Attempting to fetch:', url);
        response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        console.log('✅ Fetch successful, response object:', response);
      } catch (networkError) {
        console.error('❌ Network error:', networkError);
        console.error('📍 Attempted URL:', url);
        console.error('📍 Base URL:', this.baseUrl);
        console.error('📍 Full error object:', networkError);
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}. Attempted to fetch: ${url}`);
      }

      console.log('📡 Test connection response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ Test connection API error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Test connection successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Category connection test failed:', error);

      // More detailed error logging
      if (error.name === 'AbortError') {
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
