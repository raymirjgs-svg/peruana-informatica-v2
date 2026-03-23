import { Product } from '@/models/Product';
import { RawProduct, PaginatedResponse } from '@/models/ApiTypes';
import {
  NetworkError,
  handleFetchError,
  safeAsync,
} from '@/lib/errors';
import { API_CONFIG } from '@/config/api';

export class ProductService {
  private baseUrl = API_CONFIG.BASE_URL;
  private apiBase = API_CONFIG.API_BASE_URL;

  /**
   * Realiza un fetch con manejo de errores mejorado
   */
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        await handleFetchError(response);
      }

      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(
          'No se puede conectar al servidor. Verifica que el backend esté corriendo en ' + this.baseUrl
        );
      }
      throw error;
    }
  }

  /**
   * Test de conexión con el backend
   */
  async testConnection(): Promise<boolean> {
    const [error, response] = await safeAsync(
      this.fetchWithErrorHandling(`${this.baseUrl}/api/health`)
    );

    if (error) {
      console.error('❌ Test connection failed:', error.message);
      return false;
    }

    console.log('✅ Backend connection successful');
    return true;
  }

  /**
   * Helper privado para mapear RawProduct a Product
   */
  private mapToProduct(item: RawProduct): Product {
    // Determinar ID
    const id = item.cod_producto || item.id || 0;

    // Determinar Nombre
    const name = item.name || item.nombre_producto || `Producto ${id}`;

    // Determinar Descripción
    const description = item.description || item.descripcion || '';

    // Determinar Precio Base
    // Determinar Precio Base
    let price = 0;
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (typeof item.price === 'string') {
      price = parseFloat(item.price) || 0;
    } else if (typeof item.precio_actual === 'number') {
      price = item.precio_actual;
    } else if (typeof item.precio_actual === 'string') {
      price = parseFloat(item.precio_actual) || 0;
    }

    // Determinar Stock
    // Determinar Stock
    let stock = 0;
    if (typeof item.stock === 'number') {
      stock = item.stock;
    } else if (typeof item.stock === 'string') {
      stock = parseInt(item.stock, 10) || 0;
    } else if (typeof item.stock_actual === 'number') {
      stock = item.stock_actual;
    } else if (typeof item.stock_actual === 'string') {
      stock = parseInt(item.stock_actual, 10) || 0;
    }

    // Determinar Categoría (String)
    let categoryName = 'Sin categoría';
    if (typeof item.productCategory === 'object' && item.productCategory?.name) {
      categoryName = item.productCategory.name;
    } else if (item.category && typeof item.category === 'object' && 'name' in item.category) {
      categoryName = item.category.name;
    } else if (typeof item.category === 'string') {
      categoryName = item.category;
    } else if (item.cod_categoria) {
      categoryName = String(item.cod_categoria);
    }


    // Instanciar Modelo
    const product = new Product(id, name, description, price, stock, categoryName);

    // Completar propiedades adicionales

    // Slug
    product.slug = item.slug || item.url_amigable ||
      name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

    // Código Interno
    if (item.codigo_interno) product.codigo_interno = item.codigo_interno;

    // Precios adicionales (parsing seguro)
    const parsePrice = (p: string | number | undefined): number => {
      if (typeof p === 'number') return p;
      if (typeof p === 'string') return parseFloat(p) || 0;
      return 0;
    };

    product.priceWeb = parsePrice(item.price_web || item.precio_web);
    product.priceCot = parsePrice(item.price_cot || item.precio_cot);
    product.priceDis = parsePrice(item.price_dis || item.precio_dis);

    // Flags booleanos
    const isTrue = (val: boolean | number | string | undefined): boolean =>
      val === true || val === 1 || val === '1';

    product.is_featured = isTrue(item.is_featured);
    product.is_new = isTrue(item.is_new);
    product.is_clearance = isTrue(item.is_clearance);
    product.video_url = item.video_url || null;

    // Marca
    if (typeof item.productBrand === 'object' && item.productBrand?.name) {
      product.brand = item.productBrand.name;
    } else if (item.brand && typeof item.brand === 'object' && 'name' in item.brand) {
      product.brand = item.brand.name;
    } else if (typeof item.brand === 'string') {
      product.brand = item.brand;
    }

    // Fix URLs Helper - encode special characters in image filenames
    const fixUrl = (url: string | undefined): string | null => {
      if (!url) return null;
      if (typeof url !== 'string') return null;
      
      // Check if URL contains localhost or private IPs and needs fixing
      if (url.includes('localhost') || url.match(/192\.168\.\d+\.\d+/) || url.match(/10\.\d+\.\d+\.\d+/)) {
        const parts = url.split('/uploads/');
        if (parts.length > 1 && parts[1]) {
          return `uploads/${encodeURIComponent(parts[1])}`;
        }
      }
      
      // Encode the filename portion of image URLs to handle special characters
      if (url.includes('/images/') || url.includes('/uploads/')) {
        const match = url.match(/^(.+\/)([^/]+)$/);
        if (match && match[1] && match[2]) {
          const basePath = match[1];
          const filename = match[2];
          return basePath + encodeURIComponent(filename);
        }
      }
      
      return url;
    };

    // Imágenes
    product.images = [];
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      product.images = item.images.map(img => ({
        cod_galeria: img.cod_galeria || 0,
        imagen: fixUrl(img.imagen || img.url) || ''
      })).filter(img => img.imagen !== ''); // Filtrar imágenes vacías

      const firstImg = product.images[0]?.imagen;
      if (firstImg) {
        product.image = fixUrl(firstImg) || '';
      } else {
        product.image = '';
      }
    } else if (item.image || item.imagen) {
      const mainImg = fixUrl(item.image || item.imagen);
      product.image = mainImg || '';
    } else {
      product.image = '';
    }

    return product;
  }

  async getProducts(
    page: number = 1,
    pageSize: number = 12,
    filters: { featured?: boolean; new?: boolean; clearance?: boolean; search?: string } = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      const timestamp = new Date().getTime();
      let url = `${this.apiBase}/api/products?page=${page}&limit=${pageSize}&t=${timestamp}`;

      if (filters.featured) url += '&featured=true';
      if (filters.new) url += '&new=true';
      if (filters.clearance) url += '&clearance=true';
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;

      // Validate URL
      try { new URL(url); } catch (e) {
        return { products: [], total: 0, totalPages: 0, currentPage: page };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response;
      try {
        response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });
      } catch (e) {
        clearTimeout(timeoutId);
        return { products: [], total: 0, totalPages: 0, currentPage: page };
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { products: [], total: 0, totalPages: 0, currentPage: page };
      }

      const data = await response.json().catch(() => ({ products: [], total: 0 }));

      // Type casting safely
      const rawProducts: RawProduct[] = Array.isArray(data) ? data : (data.products || []);
      const total = typeof data.total === 'number' ? data.total : rawProducts.length;
      const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / pageSize);

      const products = rawProducts.map(item => this.mapToProduct(item));

      return {
        products,
        total,
        totalPages,
        currentPage: page
      };

    } catch (error) {
      return { products: [], total: 0, totalPages: 0, currentPage: page };
    }
  }

  async getProductsWithFilters(queryParams: string): Promise<PaginatedResponse<Product> & { filters?: any }> {
    try {
      const timestamp = new Date().getTime();
      const url = `${this.apiBase}/api/products?${queryParams}&t=${timestamp}`;

      try { new URL(url); } catch (e) { throw new Error(`Invalid URL: ${url}`); }

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawProducts: RawProduct[] = Array.isArray(data) ? data : (data.products || []);

      const products = rawProducts.map(item => this.mapToProduct(item));

      return {
        products,
        total: data.total || products.length,
        totalPages: data.totalPages || Math.ceil((data.total || products.length) / 12),
        filters: data.filters || {},
      };
    } catch (error) {
      console.error('Error fetching filtered products:', error);
      return { products: [], total: 0, totalPages: 0, filters: {} };
    }
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const cleanSlug = slug.replace(/%22/g, '').replace(/"/g, '').trim();
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.apiBase}/api/products/slug/${cleanSlug}?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) return null;

      const item: RawProduct = await response.json();
      return this.mapToProduct(item);
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.apiBase}/api/products/${id}?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) return null;

      const item: RawProduct = await response.json();
      return this.mapToProduct(item);
    } catch (error) {
      console.error('Error fetching product by id:', error);
      return null;
    }
  }

  async getSuggestions(query: string, limit: number = 5): Promise<Product[]> {
    try {
      if (!query || query.trim().length === 0) return [];
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.apiBase}/api/products/utils/suggestions?q=${encodeURIComponent(query)}&limit=${limit}&t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) return [];

      const rawProducts: RawProduct[] = await response.json();
      return rawProducts.map(item => this.mapToProduct(item));
    } catch (error) {
      console.warn('Error fetching suggestions:', error);
      return [];
    }
  }

  async getAllProducts(): Promise<Product[]> {
    const allProducts: Product[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { products, totalPages } = await this.getProducts(page, 100);
      allProducts.push(...products);

      hasMore = page < totalPages;
      page++;
    }

    return allProducts;
  }
}

export const productService = new ProductService();