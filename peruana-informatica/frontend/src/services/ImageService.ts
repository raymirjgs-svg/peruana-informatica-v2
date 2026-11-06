import { ProductImage } from '@/models/Product';

export class ImageService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  private apiBase = (() => {
    const trimmed = this.baseUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  })();

  private getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  async getImagesByProduct(productId: number): Promise<ProductImage[]> {
    try {
      const response = await fetch(`${this.apiBase}/admin/images/product/${productId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const images = await response.json();
      return images;
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
  }

  async createImage(productId: number, imageUrl: string): Promise<ProductImage | null> {
    try {
      const response = await fetch(`${this.apiBase}/admin/images/product/${productId}`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ imagen: imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const image = await response.json();
      return image;
    } catch (error) {
      console.error('Error creating image:', error);
      return null;
    }
  }

  async deleteImage(imageId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/admin/images/${imageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}
