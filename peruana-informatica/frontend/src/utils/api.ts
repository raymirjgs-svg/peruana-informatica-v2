import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/authTokens';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export type QueryParams = Record<string, string | number | boolean | undefined>;

interface ApiErrorDetail {
  param?: string;
  path?: string;
  msg?: string;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: ApiErrorDetail[];
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error en la solicitud';

        try {
          const errorJson = JSON.parse(errorText) as ApiErrorBody;
          errorMessage = errorJson.message || errorJson.error || errorMessage;

          if (Array.isArray(errorJson.details)) {
            const detailMessages = errorJson.details
              .map((detail) => `${detail.param || detail.path || 'Campo'}: ${detail.msg}`)
              .join(', ');

            if (detailMessages) {
              errorMessage += ` (${detailMessages})`;
            }
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`API Error for endpoint ${endpoint}:`, error.message);
        throw error;
      }
      console.error(`Unknown API Error for endpoint ${endpoint}:`, error);
      throw new Error('Error de red o desconocido');
    }
  }

  private buildQuery(params?: QueryParams): string {
    if (!params) return '';
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
  }

  public get = <T = unknown>(endpoint: string) => this.request<T>(endpoint, { method: 'GET' });
  public post = <T = unknown>(endpoint: string, data: unknown) => this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  public put = <T = unknown>(endpoint: string, data: unknown) => this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  public delete = <T = unknown>(endpoint: string) => this.request<T>(endpoint, { method: 'DELETE' });

  createQuotation = (data: unknown) =>
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

  downloadQuotationPdf = (code: string): void => {
    window.open(`${this.baseUrl}/api/quotations/${code}/pdf`, '_blank');
  };

  getProducts = async (params?: QueryParams) =>
    this.request(`/api/products${this.buildQuery(params)}`, { method: 'GET' });

  getProductById = async (id: number) =>
    this.request(`/api/products/${id}`, { method: 'GET' });

  getProductsByComponentType = async (type: string) =>
    this.request(`/api/products/by-component/${type}`, { method: 'GET' });

  filterCompatibleProducts = async (targetComponentType: string, selectedProducts: number[]) =>
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

  checkCompatibility = async (_parentId: number, _childId: number) => {
    console.warn('checkCompatibility is deprecated. Use validateBuild instead.');
    return { isCompatible: true };
  };

  getLaptops = async (params?: QueryParams) =>
    this.request(`/api/laptops${this.buildQuery(params)}`, { method: 'GET' });

  getCotizadorLaptops = async (params?: QueryParams) =>
    this.request(`/api/cotizador/laptops${this.buildQuery(params)}`, { method: 'GET' });

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
