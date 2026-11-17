import { API_CONFIG } from '@/config/api';
import { getAuthHeaders, type AuthScope } from '@/lib/authTokens';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  auth?: AuthScope | false;
  baseUrl?: string;
  responseType?: 'json' | 'text' | 'blob';
}

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

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

function isRawBody(body: unknown): body is BodyInit {
  return (
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof Blob !== 'undefined' && body instanceof Blob) ||
    body instanceof ArrayBuffer ||
    (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) ||
    typeof body === 'string'
  );
}

function parseErrorBody(text: string): string {
  let message = 'Error en la solicitud';

  try {
    const errorJson = JSON.parse(text) as ApiErrorBody;
    message = errorJson.message || errorJson.error || message;

    if (Array.isArray(errorJson.details)) {
      const details = errorJson.details
        .map((detail) => `${detail.param || detail.path || 'Campo'}: ${detail.msg}`)
        .join(', ');

      if (details) message += ` (${details})`;
    }
  } catch {
    if (text) message = text;
  }

  return message;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, auth, baseUrl, headers, responseType = 'json', ...init } = options;
    const url = `${baseUrl ?? this.baseUrl}${endpoint}`;
    const resolvedAuth: AuthScope | false =
      auth === undefined ? (endpoint.startsWith('/api/admin') ? 'admin' : false) : auth;
    const rawBody = isRawBody(body);
    const finalHeaders = new Headers(headers);

    if (!rawBody && body !== undefined && !finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }

    if (resolvedAuth) {
      const authHeaders = getAuthHeaders(resolvedAuth);
      for (const [key, value] of Object.entries(authHeaders)) {
        if (!finalHeaders.has(key)) finalHeaders.set(key, value);
      }
    }

    try {
      const response = await fetch(url, {
        ...init,
        headers: finalHeaders,
        body: body === undefined ? undefined : rawBody ? body : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new ApiError(parseErrorBody(await response.text()), response.status);
      }

      if (response.status === 204) return undefined as T;
      if (responseType === 'blob') return (await response.blob()) as T;

      const text = await response.text();
      if (!text) return undefined as T;
      if (responseType === 'text') return text as T;

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
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
    return buildQueryString(params);
  }

  public get = <T = unknown>(endpoint: string, params?: QueryParams) =>
    this.request<T>(`${endpoint}${this.buildQuery(params)}`, { method: 'GET' });
  public post = <T = unknown>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
    this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  public put = <T = unknown>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
    this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  public patch = <T = unknown>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
    this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  public delete = <T = unknown>(endpoint: string, options: RequestOptions = {}) =>
    this.request<T>(endpoint, { ...options, method: 'DELETE' });

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
