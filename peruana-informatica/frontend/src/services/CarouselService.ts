// ============================================
// services/CarouselService.ts
// ============================================

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Obtener slides activos del carousel
   */
  async getActiveSlides(): Promise<CarouselSlide[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/carousel/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Retornar array vacío sin mostrar error si el backend no está disponible
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Silenciar el error y retornar array vacío para usar slides por defecto
      return [];
    }
  }

  /**
   * Obtener todos los slides (para admin)
   */
  async getAllSlides(): Promise<CarouselSlide[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/carousel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/admin/carousel/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/admin/carousel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slideData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/admin/carousel/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slideData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.baseUrl}/api/admin/carousel/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
      const response = await fetch(`${this.baseUrl}/api/admin/carousel/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slides }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error reordering slides:', error);
      throw error;
    }
  }
}
