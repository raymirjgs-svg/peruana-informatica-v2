// src/utils/api.ts
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/authTokens';

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
        ...(endpoint.startsWith('/api/admin') ? getAuthHeaders('admin') : {}),
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
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = queryParams ? `/api/products?${queryParams}` : '/api/products';

    return this.request(endpoint, { method: 'GET' });
  };

  getProductById = async (id: number) =>
    this.request(`/api/products/${id}`, { method: 'GET' });

  getProductsByComponentType = async (type: string) =>
    this.request(`/api/products/by-component/${type}`, { method: 'GET' });

  // Compatibility System
  filterCompatibleProducts = async (targetComponentType: string, selectedProducts: any[]) =>
    this.request('/api/compatibility/filter', {
      method: 'POST',
      body: JSON.stringify({
        targetComponentType,
        selectedProducts
      })
    });

  validateBuild = async (productIds: number[]) =>
    this.request('/api/compatibility/validate', {
      method: 'POST',
      body: JSON.stringify({ productIds })
    });

  getAttributesByComponentType = async (componentType: string) =>
    this.request(`/api/compatibility/attributes/${componentType}`, { method: 'GET' });

  // Deprecated methods kept for backward compatibility if needed, but should be removed
  checkCompatibility = async (parentId: number, childId: number) => {
    console.warn('checkCompatibility is deprecated. Use validateBuild instead.');
    return { isCompatible: true };
  };

  // Laptops
  getLaptops = async (params?: any) => {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = queryParams ? `/api/laptops?${queryParams}` : '/api/laptops';
    return this.request(endpoint, { method: 'GET' });
  };

  getCotizadorLaptops = async (params?: any) => {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = queryParams ? `/api/cotizador/laptops?${queryParams}` : '/api/cotizador/laptops';
    return this.request(endpoint, { method: 'GET' });
  };

  getLaptopSubcategories = async () =>
    this.request('/api/laptops/subcategories', { method: 'GET' });

  getLaptopProcessors = async () =>
    this.request('/api/laptops/processors', { method: 'GET' });

  getLaptopRamOptions = async () =>
    this.request('/api/laptops/ram', { method: 'GET' });

  getLaptopStorageOptions = async () =>
    this.request('/api/laptops/storage', { method: 'GET' });
}

export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;