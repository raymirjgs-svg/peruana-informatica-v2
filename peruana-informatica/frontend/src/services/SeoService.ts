import apiClient from '../utils/api';

interface SeoSettings {
  id: number;
  page_type: string;
  page_identifier?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots: string;
  schema_markup?: string;
  custom_head?: string;
  priority: number;
  change_frequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SeoAnalysis {
  score: number;
  analysis: {
    totalPages: number;
    optimizedPages: number;
    pagesNeedingAttention: number;
    missingMetaTitle: number;
    missingMetaDescription: number;
    missingKeywords: number;
    incompleteOpenGraph: number;
    incompleteTwitter: number;
    pagesByType: { [key: string]: number };
    recommendations: string[];
  };
  pagesWithIssues?: {
    id: number;
    page_type: string;
    page_identifier?: string;
    issues: string[];
  }[];
  lastUpdated: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

interface SeoFormData {
  page_type: string;
  page_identifier?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots?: string;
  schema_markup?: string;
  custom_head?: string;
  priority?: number;
  change_frequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  is_active?: boolean;
}

class SeoService {
  /**
   * Obtener todas las configuraciones SEO
   */
  static async getAllSettings(params?: {
    page_type?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<SeoSettings[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/seo${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      return await apiClient.request<ApiResponse<SeoSettings[]>>(endpoint, {
        method: "GET",
        auth: "admin",
      });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      throw error;
    }
  }

  /**
   * Obtener configuración SEO por tipo de página
   */
  static async getByPageType(
    pageType: string,
    pageIdentifier?: string
  ): Promise<ApiResponse<SeoSettings>> {
    try {
      const queryParams = new URLSearchParams();
      if (pageIdentifier) {
        queryParams.append("page_identifier", pageIdentifier);
      }

      const endpoint = `/api/seo/page/${pageType}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      return await apiClient.request<ApiResponse<SeoSettings>>(endpoint, {
        method: "GET",
        auth: "admin",
      });
    } catch (error) {
      console.error("Error fetching SEO settings by page type:", error);
      throw error;
    }
  }

  /**
   * Obtener configuración SEO por ID
   */
  static async getById(id: number): Promise<ApiResponse<SeoSettings>> {
    try {
      return await apiClient.request<ApiResponse<SeoSettings>>(`/api/seo/${id}`, {
        method: "GET",
        auth: "admin",
      });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      throw error;
    }
  }

  /**
   * Crear nueva configuración SEO
   */
  static async create(data: SeoFormData): Promise<ApiResponse<SeoSettings>> {
    try {
      return await apiClient.request<ApiResponse<SeoSettings>>('/api/seo', {
        method: "POST",
        auth: "admin",
        body: data,
      });
    } catch (error) {
      console.error("Error creating SEO settings:", error);
      throw error;
    }
  }

  /**
   * Actualizar configuración SEO por ID
   */
  static async updateById(id: number, data: Partial<SeoFormData>): Promise<ApiResponse<SeoSettings>> {
    try {
      return await apiClient.request<ApiResponse<SeoSettings>>(`/api/seo/${id}`, {
        method: "PUT",
        auth: "admin",
        body: data,
      });
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      throw error;
    }
  }

  /**
   * Actualizar configuración SEO por tipo de página
   */
  static async updateByPageType(
    pageType: string,
    data: Partial<SeoFormData>,
    pageIdentifier?: string
  ): Promise<ApiResponse<SeoSettings>> {
    try {
      const queryParams = new URLSearchParams();
      if (pageIdentifier) {
        queryParams.append("page_identifier", pageIdentifier);
      }

      const endpoint = `/api/seo/page/${pageType}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      return await apiClient.request<ApiResponse<SeoSettings>>(endpoint, {
        method: "PUT",
        auth: "admin",
        body: data,
      });
    } catch (error) {
      console.error("Error updating SEO settings by page type:", error);
      throw error;
    }
  }

  /**
   * Eliminar configuración SEO
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      return await apiClient.request<ApiResponse<void>>(`/api/seo/${id}`, {
        method: "DELETE",
        auth: "admin",
      });
    } catch (error) {
      console.error("Error deleting SEO settings:", error);
      throw error;
    }
  }

  /**
   * Obtener análisis SEO del sitio
   */
  static async getAnalysis(): Promise<ApiResponse<SeoAnalysis>> {
    try {
      return await apiClient.request<ApiResponse<SeoAnalysis>>('/api/seo/analysis', {
        method: "GET",
        auth: "admin",
      });
    } catch (error) {
      console.error("Error fetching SEO analysis:", error);
      throw error;
    }
  }

  /**
   * Generar sugerencias SEO con IA
   */
  static async suggestMetadata(data: {
    page_type: string;
    page_identifier?: string;
    current_title?: string;
    current_description?: string;
  }): Promise<ApiResponse<unknown>> {
    try {
      return await apiClient.request<ApiResponse<unknown>>('/api/seo/suggest', {
        method: "POST",
        auth: "admin",
        body: data,
      });
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Obtener opciones de tipos de página
   */
  static getPageTypeOptions() {
    return [
      { value: "global", label: "Global", description: "Configuración global del sitio" },
      { value: "home", label: "Página de inicio", description: "Página principal del sitio" },
      { value: "products", label: "Productos", description: "Listado de productos" },
      { value: "categories", label: "Categorías", description: "Listado de categorías" },
      { value: "brands", label: "Marcas", description: "Listado de marcas" },
      { value: "contact", label: "Contacto", description: "Página de contacto" },
      { value: "blog", label: "Blog", description: "Blog/noticias" },
      { value: "product", label: "Producto específico", description: "Páginas individuales de producto" },
      { value: "category", label: "Categoría específica", description: "Páginas individuales de categoría" },
      { value: "brand", label: "Marca específica", description: "Páginas individuales de marca" },
    ];
  }

  /**
   * Obtener opciones de frecuencia de cambio
   */
  static getChangeFrequencyOptions() {
    return [
      { value: "always", label: "Siempre" },
      { value: "hourly", label: "Cada hora" },
      { value: "daily", label: "Diariamente" },
      { value: "weekly", label: "Semanalmente" },
      { value: "monthly", label: "Mensualmente" },
      { value: "yearly", label: "Anualmente" },
      { value: "never", label: "Nunca" },
    ];
  }

  /**
   * Obtener opciones de robots
   */
  static getRobotsOptions() {
    return [
      { value: "index,follow", label: "Index, Follow", description: "Permitir indexar y seguir enlaces" },
      { value: "noindex,follow", label: "NoIndex, Follow", description: "No indexar, pero seguir enlaces" },
      { value: "index,nofollow", label: "Index, NoFollow", description: "Indexar, pero no seguir enlaces" },
      { value: "noindex,nofollow", label: "NoIndex, NoFollow", description: "No indexar ni seguir enlaces" },
      { value: "noarchive", label: "NoArchive", description: "No guardar en caché" },
      { value: "nosnippet", label: "NoSnippet", description: "No mostrar snippets" },
    ];
  }

  /**
   * Validar longitud de meta título
   */
  static validateMetaTitle(title: string): { isValid: boolean; message?: string } {
    if (!title) return { isValid: true };

    if (title.length > 60) {
      return { isValid: false, message: "El título es demasiado largo (máximo 60 caracteres)" };
    }
    if (title.length < 10) {
      return { isValid: false, message: "El título es demasiado corto (mínimo 10 caracteres)" };
    }
    return { isValid: true };
  }

  /**
   * Validar longitud de meta descripción
   */
  static validateMetaDescription(description: string): { isValid: boolean; message?: string } {
    if (!description) return { isValid: true };

    if (description.length > 160) {
      return { isValid: false, message: "La descripción es demasiado larga (máximo 160 caracteres)" };
    }
    if (description.length < 120) {
      return { isValid: false, message: "La descripción es demasiado corta (mínimo 120 caracteres)" };
    }
    return { isValid: true };
  }

  /**
   * Formatear fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Obtener color del score SEO
   */
  static getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  /**
   * Obtener color de fondo del score SEO
   */
  static getScoreBackgroundColor(score: number): string {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  static async testConnection(): Promise<unknown> {
    try {
      return await apiClient.request('/api/seo/test', {
        method: "GET",
      });
    } catch (error) {
      console.error("SEO connection test failed:", error);
      throw error;
    }
  }
}

export {
  SeoService,
  type SeoSettings,
  type SeoAnalysis,
  type SeoFormData,
  type ApiResponse,
};
