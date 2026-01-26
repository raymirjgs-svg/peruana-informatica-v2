import axios from "axios";

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

class UnsplashService {
  private accessKey: string | null = null;
  private baseUrl = "https://api.unsplash.com";

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || null;
    
    if (this.accessKey) {
      console.log("📸 Unsplash API initialized successfully");
    } else {
      console.log("⚠️ Unsplash API key not found - image generation disabled");
    }
  }

  isReady(): boolean {
    return this.accessKey !== null;
  }

  /**
   * Buscar fotos en Unsplash basadas en keywords
   */
  async searchPhotos(query: string, perPage: number = 10): Promise<UnsplashPhoto[]> {
    try {
      if (!this.accessKey) {
        throw new Error("Unsplash API key not configured");
      }

      console.log(`🔍 Searching Unsplash for: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/search/photos`, {
        params: {
          query,
          per_page: perPage,
          orientation: "landscape",
          content_filter: "high",
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });

      const photos = response.data.results as UnsplashPhoto[];
      console.log(`✅ Found ${photos.length} photos on Unsplash`);

      return photos;
    } catch (error: any) {
      console.error("❌ Error searching Unsplash:", error.message);
      throw error;
    }
  }

  /**
   * Obtener la mejor foto para un tema específico
   */
  async getBestPhoto(query: string): Promise<string> {
    try {
      const photos = await this.searchPhotos(query, 5);

      if (photos.length === 0) {
        throw new Error("No photos found for query: " + query);
      }

      // Tomar la primera foto (más relevante según Unsplash)
      const bestPhoto = photos[0];
      
      // Verificar que bestPhoto no sea undefined
      if (!bestPhoto) {
        throw new Error("No valid photo found");
      }
      
      // Usar la URL 'regular' que es 1080p (perfecto para blog)
      const imageUrl = `${bestPhoto.urls.regular}&w=1200&h=600&fit=crop`;

      console.log(`✅ Selected photo by ${bestPhoto.user.name}`);
      console.log(`   URL: ${imageUrl}`);

      return imageUrl;
    } catch (error: any) {
      console.error("❌ Error getting best photo:", error.message);
      throw error;
    }
  }

  /**
   * Descargar una foto (trigger de descarga para Unsplash Analytics)
   */
  async triggerDownload(photoId: string): Promise<void> {
    try {
      if (!this.accessKey) return;

      await axios.get(`${this.baseUrl}/photos/${photoId}/download`, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });

      console.log(`📥 Download triggered for photo ${photoId}`);
    } catch (error) {
      console.error("❌ Error triggering download:", error);
    }
  }
}

export const unsplashService = new UnsplashService();