// src/utils/api.ts
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Verificar si la respuesta es exitosa antes de parsear JSON
      if (!response.ok) {
        const errorText = await response.text(); // Obtener el texto del error
        let errorMessage = 'Error en la solicitud';

        try {
          // Intentar parsear como JSON para obtener el mensaje estructurado
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;

          // Si hay detalles específicos, incluirlos en el mensaje
          if (errorJson.details) {
            const details = Array.isArray(errorJson.details) ? errorJson.details : [errorJson.details];
            const detailMessages = details.map((detail: any) =>
              `${detail.param || detail.path || 'Campo'}: ${detail.msg}`
            ).join(', ');

            if (detailMessages) {
              errorMessage += ` (${detailMessages})`;
            }
          }
        } catch {
          // Si no se puede parsear como JSON, usar el texto plano
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`API Error for endpoint ${endpoint}:`, error.message);
        throw error;
      }
      console.error(`Unknown API Error for endpoint ${endpoint}:`, error);
      throw new Error('Error de red o desconocido');
    }
  }

  // Métodos genéricos públicos
  // Métodos genéricos públicos
  public get = <T = any>(endpoint: string) => this.request<T>(endpoint, { method: 'GET' });
  public post = <T = any>(endpoint: string, data: any) => this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  public put = <T = any>(endpoint: string, data: any) => this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  public delete = <T = any>(endpoint: string) => this.request<T>(endpoint, { method: 'DELETE' });


  // Cotizaciones
  createQuotation = (data: any) =>
    this.request('/api/quotations', {
      method: 'POST',
      body: JSON.stringify(data)
    });

  getQuotationByCode = (code: string) =>
    this.request(`/api/quotations/${code}`, {
      method: 'GET'
    });

  validateQuotation = (code: string) =>
    this.request('/api/quotations/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });

  // Descargar PDF de cotización
  downloadQuotationPdf = (code: string): void => {
    window.open(`${this.baseUrl}/api/quotations/${code}/pdf`, '_blank');
  };

  // Productos
  getProducts = async (params?: any) => {
    try {
      const queryParams = params ? new URLSearchParams(params).toString() : '';
      const endpoint = queryParams ? `/api/products?${queryParams}` : '/api/products';

      return await this.request(endpoint, { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /products, using fallback data:`, error);
      // Devolver datos de ejemplo cuando la API no esté disponible
      return {
        products: [
          {
            id: 1,
            cod_producto: 1,
            name: 'Laptop Dell Inspiron 15',
            slug: 'laptop-dell-inspiron-15',
            description: 'Laptop Dell Inspiron 15 con Intel Core i5, 8GB RAM, 256GB SSD',
            price: 2499.00,
            stock: 15,
            codigo_interno: 'LAP-DELL-15-001',
            component_type: 'laptop',
            component_specs: {
              processor: 'Intel Core i5-1135G7',
              ram: '8GB DDR4',
              storage: '256GB SSD',
              graphics: 'Intel Iris Xe',
              screen_size: '15.6" Full HD'
            }
          },
          {
            id: 2,
            cod_producto: 2,
            name: 'Laptop HP Pavilion Gaming',
            slug: 'laptop-hp-pavilion-gaming',
            description: 'Laptop HP Pavilion Gaming con AMD Ryzen 5, 16GB RAM, GTX 1650',
            price: 3299.00,
            stock: 8,
            codigo_interno: 'LAP-HP-PG-002',
            component_type: 'laptop',
            component_specs: {
              processor: 'AMD Ryzen 5 5600H',
              ram: '16GB DDR4',
              storage: '512GB SSD',
              graphics: 'NVIDIA GTX 1650 4GB',
              screen_size: '15.6" Full HD 144Hz'
            }
          },
          {
            id: 3,
            cod_producto: 3,
            name: 'MacBook Air M2',
            slug: 'macbook-air-m2',
            description: 'MacBook Air con chip M2, 8GB RAM, 256GB SSD',
            price: 5499.00,
            stock: 5,
            codigo_interno: 'LAP-MACBOOK-AIR-M2-003',
            component_type: 'laptop',
            component_specs: {
              processor: 'Apple M2 Chip',
              ram: '8GB unified memory',
              storage: '256GB SSD',
              graphics: '8-core GPU',
              screen_size: '13.6" Retina'
            }
          }
        ],
        total: 3,
        page: 1,
        pages: 1
      };
    }
  };

  getProductById = async (id: number) => {
    try {
      return await this.request(`/api/products/${id}`, { method: 'GET' });

    } catch (error) {
      console.warn(`API error for /products/${id}, using fallback data:`, error);
      // Devolver datos de ejemplo para el producto específico
      return {
        id,
        cod_producto: id,
        name: `Producto de Ejemplo ${id}`,
        slug: `producto-ejemplo-${id}`,
        description: 'Producto de ejemplo para demostración',
        price: 1999.00,
        stock: 10,
        codigo_interno: `PROD-${id}-EJEMPLO`,
        component_type: 'laptop',
        component_specs: {
          processor: 'Intel Core i5',
          ram: '8GB RAM',
          storage: '256GB SSD'
        }
      };
    }
  };

  getProductsByComponentType = async (type: string) => {
    try {
      return await this.request(`/api/products/by-component/${type}`, { method: 'GET' });

    } catch (error) {
      console.warn(`API error for /products/by-component/${type}, using fallback data:`, error);
      // Devolver datos de ejemplo según el tipo
      if (type === 'laptop' || type === 'laptops') {
        return {
          products: [
            {
              id: 1,
              cod_producto: 1,
              name: 'Laptop Ejemplo',
              slug: 'laptop-ejemplo',
              description: 'Laptop de ejemplo para demostración',
              price: 2999.00,
              stock: 12,
              codigo_interno: 'LAP-EJ-001',
              component_type: 'laptop',
              component_specs: {
                processor: 'Intel Core i5',
                ram: '8GB',
                storage: '256GB SSD'
              }
            }
          ],
          total: 1,
          page: 1,
          pages: 1
        };
      } else {
        return { products: [], total: 0, page: 1, pages: 1 };
      }
    }
  };

  // Compatibility System
  filterCompatibleProducts = async (targetComponentType: string, selectedProducts: any[]) => {
    try {
      return await this.request('/api/compatibility/filter', {
        method: 'POST',
        body: JSON.stringify({
          targetComponentType,
          selectedProducts
        })
      });
    } catch (error) {
      console.warn('API error filtering compatible products:', error);
      return { success: false, data: [] };
    }
  };

  validateBuild = async (productIds: number[]) => {
    try {
      return await this.request('/api/compatibility/validate', {
        method: 'POST',
        body: JSON.stringify({ productIds })
      });
    } catch (error) {
      console.warn('API error validating build:', error);
      return { success: false, data: { compatible: true, messages: [] } };
    }
  };

  getAttributesByComponentType = async (componentType: string) => {
    try {
      return await this.request(`/api/compatibility/attributes/${componentType}`, { method: 'GET' });
    } catch (error) {
      console.warn(`API error checking attributes for ${componentType}:`, error);
      return { success: false, data: [] };
    }
  };

  // Deprecated methods kept for backward compatibility if needed, but should be removed
  checkCompatibility = async (parentId: number, childId: number) => {
    console.warn('checkCompatibility is deprecated. Use validateBuild instead.');
    return { isCompatible: true };
  };

  // Laptops
  getLaptops = async (params?: any) => {
    try {
      const queryParams = params ? new URLSearchParams(params).toString() : '';
      const endpoint = queryParams ? `/api/laptops?${queryParams}` : '/api/laptops';
      return await this.request(endpoint, { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /laptops, using fallback data:`, error);
      // Fallback (omitted for brevity)
      return [];
    }
  };

  getCotizadorLaptops = async (params?: any) => {
    try {
      const queryParams = params ? new URLSearchParams(params).toString() : '';
      const endpoint = queryParams ? `/api/cotizador/laptops?${queryParams}` : '/api/cotizador/laptops';
      return await this.request(endpoint, { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /cotizador/laptops:`, error);
      return [];
    }
  };

  getLaptopSubcategories = async () => {
    try {
      return await this.request('/api/laptops/subcategories', { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /laptops/subcategories, using fallback data:`, error);
      // Devolver subcategorías de ejemplo
      return [
        { id: 1, name: 'Laptop Gamer', slug: 'laptop-gamer', type: 'tipo_laptop' },
        { id: 2, name: 'Laptop Empresarial', slug: 'laptop-empresarial', type: 'tipo_laptop' },
        { id: 3, name: 'Laptop Ultrabook', slug: 'laptop-ultrabook', type: 'tipo_laptop' }
      ];
    }
  };

  getLaptopProcessors = async () => {
    try {
      return await this.request('/api/laptops/processors', { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /laptops/processors, using fallback data:`, error);
      return [];
    }
  };

  getLaptopRamOptions = async () => {
    try {
      return await this.request('/api/laptops/ram', { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /laptops/ram, using fallback data:`, error);
      return [];
    }
  };

  getLaptopStorageOptions = async () => {
    try {
      return await this.request('/api/laptops/storage', { method: 'GET' });
    } catch (error) {
      console.warn(`API error for /laptops/storage, using fallback data:`, error);
      return [];
    }
  };
}

export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;