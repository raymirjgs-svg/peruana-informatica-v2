import { API_CONFIG } from '@/config/api';
import apiClient from '../utils/api';
import type {
  AIGenerationRequest,
  ApiResponse,
  BlogFormData,
  BlogPost,
  BlogStats,
  BlogTitleSuggestion,
  ContentGenerationRequest,
  PaginatedResponse,
} from './blog/types';
import {
  calculateReadingTime as calculateBlogReadingTime,
  formatDate as formatBlogDate,
  generateExcerpt as generateBlogExcerpt,
  generateSlug as generateBlogSlug,
  getCategoriesArray as getBlogCategoriesArray,
  getStatusColor as getBlogStatusColor,
  getStatusOptions as getBlogStatusOptions,
  getTagsArray as getBlogTagsArray,
} from './blog/utils';

export type {
  AIGenerationRequest,
  ApiResponse,
  BlogFormData,
  BlogPost,
  BlogStats,
  BlogTitleSuggestion,
  ContentGenerationRequest,
  PaginatedResponse,
} from './blog/types';

class BlogService {
  private static readonly BASE_URL = API_CONFIG.BASE_URL;
  private static readonly API_BASE = API_CONFIG.API_BASE_URL;

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

      const endpoint = `/api/blog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      console.log('🔍 Fetching blog posts from:', `${this.API_BASE}${endpoint}`);
      console.log('📍 API Base:', this.API_BASE);

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const result = await apiClient.request<PaginatedResponse<BlogPost>>(endpoint, {
          method: 'GET',
          signal: controller.signal,
        });

        console.log('✅ Blog posts loaded:', result.data?.length || 0, 'posts');

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
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
      return await apiClient.request<ApiResponse<BlogPost>>(`/api/blog/post/${slug}`, {
        method: 'GET',
      });
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
      return await apiClient.request<ApiResponse<{ likes: number }>>(`/api/blog/post/${id}/like`, {
        method: 'POST',
      });
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

      const endpoint = `/api/blog/admin${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      return await apiClient.request<PaginatedResponse<BlogPost>>(endpoint, {
        method: 'GET',
        auth: 'admin',
      });
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
      return await apiClient.request<ApiResponse<BlogStats>>('/api/blog/admin/stats', {
        method: 'GET',
        auth: 'admin',
      });
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
      return await apiClient.request<ApiResponse<BlogPost>>('/api/blog/admin', {
        method: 'POST',
        auth: 'admin',
        body: data,
      });
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
      return await apiClient.request<ApiResponse<BlogPost>>(`/api/blog/admin/${id}`, {
        method: 'GET',
        auth: 'admin',
      });
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
      return await apiClient.request<ApiResponse<BlogPost>>(`/api/blog/admin/${id}`, {
        method: 'PUT',
        auth: 'admin',
        body: data,
      });
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
      return await apiClient.request<ApiResponse<void>>(`/api/blog/admin/${id}`, {
        method: 'DELETE',
        auth: 'admin',
      });
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
      return await apiClient.request<ApiResponse<BlogTitleSuggestion[]>>('/api/blog/admin/ai/generate-titles', {
        method: 'POST',
        auth: 'admin',
        body: data,
      });
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

      const endpoint = `/api/blog/admin/ai/title-suggestions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      return await apiClient.request<ApiResponse<BlogTitleSuggestion[]>>(endpoint, {
        method: 'GET',
        auth: 'admin',
      });
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
      return await apiClient.request<ApiResponse<{
        post: BlogPost;
        suggestion: BlogTitleSuggestion;
        generated_image: boolean;
      }>>('/api/blog/admin/ai/generate-content', {
        method: 'POST',
        auth: 'admin',
        body: data,
      });
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
      return await apiClient.request<ApiResponse<BlogTitleSuggestion>>(`/api/blog/admin/ai/title-suggestions/${id}`, {
        method: 'PUT',
        auth: 'admin',
        body: { action },
      });
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
    return formatBlogDate(dateString);
  }

  static generateSlug(title: string): string {
    return generateBlogSlug(title);
  }

  static getStatusOptions() {
    return getBlogStatusOptions();
  }

  static getStatusColor(status: string): string {
    return getBlogStatusColor(status);
  }

  static calculateReadingTime(content: string): number {
    return calculateBlogReadingTime(content);
  }

  static generateExcerpt(content: string, maxLength: number = 160): string {
    return generateBlogExcerpt(content, maxLength);
  }

  static getTagsArray(tags?: string): string[] {
    return getBlogTagsArray(tags);
  }

  static getCategoriesArray(categories?: string): string[] {
    return getBlogCategoriesArray(categories);
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  static async testConnection(): Promise<any> {
    try {
      return await apiClient.request('/api/blog/test', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Blog connection test failed:', error);
      throw error;
    }
  }
}

export { BlogService };
