import { Product } from '@/models/Product';
import { RawProduct, PaginatedResponse } from '@/models/ApiTypes';
import apiClient from '@/utils/api';
import { API_CONFIG } from '@/config/api';
import { cleanHtmlText } from '@/utils/text';

interface ProductsResponse {
  products?: RawProduct[];
  total?: number;
  totalPages?: number;
  filters?: unknown;
}

export class ProductService {
  private baseUrl = API_CONFIG.BASE_URL;
  private apiBase = API_CONFIG.API_BASE_URL;

  /**
   * Test de conexión con el backend
   */
  async testConnection(): Promise<boolean> {
    try {
      await apiClient.request('/api/health', {
        baseUrl: this.baseUrl,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      console.log('✅ Backend connection successful');
      return true;
    } catch (error) {
      console.error('❌ Test connection failed:', error instanceof Error ? error.message : error);
      return false;
    }
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


    const slug = item.slug || item.url_amigable ||
      name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

    const product: Product = {
      id,
      name,
      slug,
      description,
      shortDescription: cleanHtmlText(description).substring(0, 100),
      keywords: name.split(' ').slice(0, 5),
      image: 'placeholder.jpg',
      price,
      stock,
      category: categoryName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    // Marca
    if (typeof item.productBrand === 'object' && item.productBrand?.name) {
      product.brand = item.productBrand.name;
    } else if (item.brand && typeof item.brand === 'object' && 'name' in item.brand) {
      product.brand = item.brand.name;
    } else if (typeof item.brand === 'string') {
      product.brand = item.brand;
    }

    const parseNum = (v: number | string | null | undefined): number | null => {
      if (typeof v === 'number') return isNaN(v) ? null : v;
      if (typeof v === 'string' && v.trim() !== '') return parseFloat(v) || 0;
      return null;
    };

    const ratingCount = parseNum(item.review_count);
    if (ratingCount !== null && ratingCount > 0) {
      product.rating = { average: parseNum(item.average_rating) ?? 0, count: ratingCount };
    }

    const cleanedShortDescription = cleanHtmlText(item.short_description);
    if (cleanedShortDescription !== '') {
      product.shortDescription = cleanedShortDescription;
    }

    // Fix URLs Helper
    const fixUrl = (url: string | undefined): string | null => {
      if (!url) return null;
      if (typeof url !== 'string') return null;
      // Check if URL contains localhost or private IPs and needs fixing
      if (url.includes('localhost') || url.match(/192\.168\.\d+\.\d+/) || url.match(/10\.\d+\.\d+\.\d+/)) {
        const parts = url.split('/uploads/');
        if (parts.length > 1) {
          return `uploads/${parts[1]}`;
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
        product.image = fixUrl(firstImg) || 'placeholder.jpg';
      } else {
        product.image = 'placeholder.jpg';
      }
    } else if (item.image || item.imagen) {
      const mainImg = fixUrl(item.image || item.imagen);
      product.image = mainImg || 'placeholder.jpg';
    } else {
      product.image = 'placeholder.jpg';
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
      let endpoint = `/api/products?page=${page}&limit=${pageSize}&t=${timestamp}`;

      if (filters.featured) endpoint += '&featured=true';
      if (filters.new) endpoint += '&new=true';
      if (filters.clearance) endpoint += '&clearance=true';
      if (filters.search) endpoint += `&search=${encodeURIComponent(filters.search)}`;

      // Validate URL
      try { new URL(`${this.apiBase}${endpoint}`); } catch (e) {
        return { products: [], total: 0, totalPages: 0, currentPage: page };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const data = await apiClient.request<RawProduct[] | ProductsResponse>(endpoint, {
          baseUrl: this.apiBase,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });

        // Type casting safely
        const rawProducts: RawProduct[] = Array.isArray(data) ? data : (data.products || []);
        const total = !Array.isArray(data) && typeof data.total === 'number' ? data.total : rawProducts.length;
        const totalPages = !Array.isArray(data) && typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / pageSize);

        const products = rawProducts.map(item => this.mapToProduct(item));

        return {
          products,
          total,
          totalPages,
          currentPage: page
        };
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      return { products: [], total: 0, totalPages: 0, currentPage: page };
    }
  }

  async getProductsWithFilters(queryParams: string): Promise<PaginatedResponse<Product> & { filters?: any }> {
    try {
      const timestamp = new Date().getTime();
      const endpoint = `/api/products?${queryParams}&t=${timestamp}`;

      try { new URL(`${this.apiBase}${endpoint}`); } catch (e) { throw new Error(`Invalid URL: ${this.apiBase}${endpoint}`); }

      const data = await apiClient.request<RawProduct[] | ProductsResponse>(endpoint, {
        baseUrl: this.apiBase,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const rawProducts: RawProduct[] = Array.isArray(data) ? data : (data.products || []);

      const products = rawProducts.map(item => this.mapToProduct(item));

      const total = !Array.isArray(data) && data.total ? data.total : products.length;

      return {
        products,
        total,
        totalPages: !Array.isArray(data) && data.totalPages ? data.totalPages : Math.ceil(total / 12),
        filters: !Array.isArray(data) ? data.filters || {} : {},
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
      const item = await apiClient.request<RawProduct>(`/api/products/slug/${cleanSlug}?t=${timestamp}`, {
        baseUrl: this.apiBase,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      return this.mapToProduct(item);
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      const timestamp = new Date().getTime();
      const item = await apiClient.request<RawProduct>(`/api/products/${id}?t=${timestamp}`, {
        baseUrl: this.apiBase,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

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
      const rawProducts = await apiClient.request<RawProduct[]>(`/api/products/utils/suggestions?q=${encodeURIComponent(query)}&limit=${limit}&t=${timestamp}`, {
        baseUrl: this.apiBase,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

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