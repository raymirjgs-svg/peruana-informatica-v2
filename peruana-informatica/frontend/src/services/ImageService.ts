import { ProductImage } from '@/models/Product';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import apiClient from '@/utils/api';

export class ImageService {
  async getImagesByProduct(productId: number): Promise<ProductImage[]> {
    try {
      const images = await apiClient.request<ProductImage[]>(`/api/admin/images/product/${productId}`, {
        headers: { ...getAdminAuthHeaders() },
      });

      return images;
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
  }

  async createImage(productId: number, imageUrl: string): Promise<ProductImage | null> {
    try {
      const image = await apiClient.request<ProductImage>(`/api/admin/images/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: { imagen: imageUrl },
      });

      return image;
    } catch (error) {
      console.error('Error creating image:', error);
      return null;
    }
  }

  async deleteImage(imageId: number): Promise<boolean> {
    try {
      await apiClient.request<void>(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
        headers: { ...getAdminAuthHeaders() },
      });

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}