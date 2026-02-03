interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name: string;
  reading_time: number;
  views: number;
  likes: number;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  is_featured: boolean;
  ai_generated: boolean;
  ai_prompt?: string;
  ai_model?: string;
  tags?: string;
  categories?: string;
  word_count: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogTitleSuggestion {
  id: number;
  suggested_title: string;
  topic?: string;
  ai_prompt?: string;
  ai_model?: string;
  status: 'pending' | 'selected' | 'rejected' | 'used';
  blog_post_id?: number;
  generated_at: string;
  selected_at?: string;
  used_at?: string;
}

interface BlogStats {
  totals: {
    posts: number;
    published: number;
    drafts: number;
    ai_generated: number;
    views: number;
    likes: number;
    pending_suggestions: number;
  };
  popular_posts: BlogPost[];
  recent_posts: BlogPost[];
  ai_configured: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface BlogFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name?: string;
  author_email?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduled_at?: string;
  is_featured?: boolean;
  tags?: string;
  categories?: string;
}

interface AIGenerationRequest {
  topic?: string;
  count?: number;
  model?: string;
}

interface ContentGenerationRequest {
  title_suggestion_id: number;
  model?: string;
}

import { API_CONFIG } from '@/config/api';

class BlogService {
  private static readonly BASE_URL = API_CONFIG.BASE_URL;
  private static readonly API_BASE = API_CONFIG.API_BASE_URL;

  // Método para obtener las credenciales de autenticación básica
  private static getAuthHeaders(): Record<string, string> {
    const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    const credentials = btoa(`${username}:${password}`);

    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  // ====================== PUBLIC API ======================

  /**
   * Obtener posts publicados (frontend público)
   */
  static async getPublishedPosts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
  }): Promise<PaginatedResponse<BlogPost>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${this.API_BASE}/api/blog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      console.log('🔍 Fetching blog posts from:', url);
      console.log('📍 API Base:', this.API_BASE);

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Blog response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Blog API error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Blog posts loaded:', result.data?.length || 0, 'posts');

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching published posts:', error);

      // More detailed error logging
      if (error.name === 'AbortError') {
        console.error('⏰ Request timeout - server might be unreachable');
      } else if (error instanceof TypeError) {
        console.error('🌐 Network error - check if backend server is running');
        console.error('🔧 Make sure backend is running on:', this.BASE_URL);
        console.error('🔧 Check browser console for detailed network errors');
      }

      throw error;
    }
  }

  /**
   * Obtener post por slug (frontend público)
   */
  static async getPostBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/post/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener el post');
      }

      return result;
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      throw error;
    }
  }

  /**
   * Dar like a un post
   */
  static async likePost(id: number): Promise<ApiResponse<{ likes: number }>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/post/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al dar like al post');
      }

      return result;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  // ====================== ADMIN API ======================

  /**
   * Obtener todos los posts (admin)
   */
  static async getAllPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<BlogPost>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${this.API_BASE}/api/blog/admin${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener los posts');
      }

      return result;
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del blog (admin)
   */
  static async getBlogStats(): Promise<ApiResponse<BlogStats>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener las estadísticas');
      }

      return result;
    } catch (error) {
      console.error('Error fetching blog stats:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo post (admin)
   */
  static async createPost(data: BlogFormData): Promise<ApiResponse<BlogPost>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear el post');
      }

      return result;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Obtener post por ID (admin)
   */
  static async getPostById(id: number): Promise<ApiResponse<BlogPost>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener el post');
      }

      return result;
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  }

  /**
   * Actualizar post (admin)
   */
  static async updatePost(id: number, data: Partial<BlogFormData>): Promise<ApiResponse<BlogPost>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar el post');
      }

      return result;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Eliminar post (admin)
   */
  static async deletePost(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar el post');
      }

      return result;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ====================== AI FEATURES ======================

  /**
   * Generar títulos con IA (admin)
   */
  static async generateTitles(data: AIGenerationRequest): Promise<ApiResponse<BlogTitleSuggestion[]>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/ai/generate-titles`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al generar títulos');
      }

      return result;
    } catch (error) {
      console.error('Error generating titles:', error);
      throw error;
    }
  }

  /**
   * Obtener sugerencias de títulos (admin)
   */
  static async getTitleSuggestions(params?: {
    status?: string;
    topic?: string;
  }): Promise<ApiResponse<BlogTitleSuggestion[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${this.API_BASE}/api/blog/admin/ai/title-suggestions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener sugerencias');
      }

      return result;
    } catch (error) {
      console.error('Error fetching title suggestions:', error);
      throw error;
    }
  }

  /**
   * Generar contenido desde título sugerido (admin)
   */
  static async generateContentFromTitle(data: ContentGenerationRequest): Promise<ApiResponse<{
    post: BlogPost;
    suggestion: BlogTitleSuggestion;
    generated_image: boolean;
  }>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/ai/generate-content`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al generar contenido');
      }

      return result;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  /**
   * Gestionar sugerencia de título (admin)
   */
  static async manageTitleSuggestion(
    id: number,
    action: 'select' | 'reject'
  ): Promise<ApiResponse<BlogTitleSuggestion>> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/admin/ai/title-suggestions/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al gestionar sugerencia');
      }

      return result;
    } catch (error) {
      console.error('Error managing title suggestion:', error);
      throw error;
    }
  }

  // ====================== UTILITY METHODS ======================

  /**
   * Formatear fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Generar slug desde título
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[áäâàã]/g, 'a')
      .replace(/[éëêè]/g, 'e')
      .replace(/[íïîì]/g, 'i')
      .replace(/[óöôòõ]/g, 'o')
      .replace(/[úüûù]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones por un solo guión
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
  }

  /**
   * Obtener opciones de estado
   */
  static getStatusOptions() {
    return [
      { value: 'draft', label: 'Borrador', color: 'gray' },
      { value: 'published', label: 'Publicado', color: 'green' },
      { value: 'scheduled', label: 'Programado', color: 'blue' },
      { value: 'archived', label: 'Archivado', color: 'red' },
    ];
  }

  /**
   * Obtener color del estado
   */
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      published: 'bg-green-100 text-green-700 border-green-200',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      archived: 'bg-red-100 text-red-700 border-red-200'
    };
    return statusColors[status] || statusColors.draft;
  }

  /**
   * Calcular tiempo de lectura estimado
   */
  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Obtener extracto desde contenido
   */
  static generateExcerpt(content: string, maxLength: number = 160): string {
    // Eliminar markdown y HTML
    const plainText = content
      .replace(/#{1,6}\s/g, '') // Headers markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Italic markdown
      .replace(/<[^>]*>/g, '') // HTML tags
      .replace(/\n+/g, ' ') // Multiple line breaks
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength - 20) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }

  /**
   * Obtener tags como array
   */
  static getTagsArray(tags?: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }

  /**
   * Obtener categorías como array
   */
  static getCategoriesArray(categories?: string): string[] {
    if (!categories) return [];
    return categories.split(',').map(cat => cat.trim()).filter(Boolean);
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  static async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/api/blog/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Blog connection test failed:', error);
      throw error;
    }
  }
}

export {
  BlogService,
  type BlogPost,
  type BlogTitleSuggestion,
  type BlogStats,
  type BlogFormData,
  type AIGenerationRequest,
  type ContentGenerationRequest,
  type ApiResponse,
  type PaginatedResponse,
};
