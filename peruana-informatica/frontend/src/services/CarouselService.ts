// ============================================
// services/CarouselService.ts
// ============================================

import apiClient from '@/utils/api';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import type { PaginationMeta } from '../types';

export interface CarouselPage {
  data: CarouselSlide[];
  pagination: PaginationMeta;
}

export interface CarouselSlide {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  imageUrl?: string;
  order: number;
}

export class CarouselService {
  /**
   * Obtener slides activos del carousel
   */
  async getActiveSlides(): Promise<CarouselSlide[]> {
    try {
      return await apiClient.request<CarouselSlide[]>('/api/admin/carousel/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        auth: false,
      });
    } catch (error) {
      // Silenciar el error y retornar array vacío para usar slides por defecto
      return [];
    }
  }

  /**
   * Obtener una página de slides (para admin)
   */
  async getSlidesPage(page = 1, limit = 20): Promise<CarouselPage> {
    const result = await apiClient.request<{
      data?: CarouselSlide[];
      pagination: PaginationMeta;
    }>(`/api/admin/carousel?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
    });

    return {
      data: result.data || [],
      pagination: result.pagination,
    };
  }

  /**
   * Obtener todos los slides (para admin)
   */
  async getAllSlides(): Promise<CarouselSlide[]> {
    try {
      return await apiClient.request<CarouselSlide[]>('/api/admin/carousel', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
      });
    } catch (error) {
      console.error('Error fetching all slides:', error);
      throw error;
    }
  }

  /**
   * Obtener un slide por ID
   */
  async getSlideById(id: number): Promise<CarouselSlide> {
    try {
      return await apiClient.request<CarouselSlide>(`/api/admin/carousel/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
      });
    } catch (error) {
      console.error('Error fetching slide:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo slide
   */
  async createSlide(slideData: Omit<CarouselSlide, 'id'>): Promise<CarouselSlide> {
    try {
      return await apiClient.request<CarouselSlide>('/api/admin/carousel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: slideData,
      });
    } catch (error) {
      console.error('Error creating slide:', error);
      throw error;
    }
  }

  /**
   * Actualizar un slide existente
   */
  async updateSlide(id: number, slideData: Partial<CarouselSlide>): Promise<CarouselSlide> {
    try {
      return await apiClient.request<CarouselSlide>(`/api/admin/carousel/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: slideData,
      });
    } catch (error) {
      console.error('Error updating slide:', error);
      throw error;
    }
  }

  /**
   * Eliminar un slide
   */
  async deleteSlide(id: number): Promise<void> {
    try {
      await apiClient.request<void>(`/api/admin/carousel/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
      });
    } catch (error) {
      console.error('Error deleting slide:', error);
      throw error;
    }
  }

  /**
   * Reordenar slides
   */
  async reorderSlides(slides: { id: number; order: number }[]): Promise<void> {
    try {
      await apiClient.request<void>('/api/admin/carousel/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: { slides },
      });
    } catch (error) {
      console.error('Error reordering slides:', error);
      throw error;
    }
  }
}
