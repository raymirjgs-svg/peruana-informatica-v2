// src/models/ApiTypes.ts

/**
 * Representa la estructura cruda del producto tal cual viene de la API.
 * Dado que la API puede tener inconsistencias (campo español/inglés), se definen todos los posibles.
 */
export interface RawProduct {
    // Identificadores
    id?: number;
    cod_producto?: number;
    codigo_interno?: string;

    // Información básica
    name?: string;
    nombre_producto?: string; // Legacy/Alternative
    slug?: string;
    url_amigable?: string; // Legacy
    description?: string;
    descripcion?: string; // Legacy

    // Precios
    price?: number;
    precio_actual?: number; // Legacy
    price_web?: number | string;
    precio_web?: number | string;
    price_cot?: number | string;
    precio_cot?: number | string;
    price_dis?: number | string;
    precio_dis?: number | string;

    // Inventario
    stock?: number;
    stock_actual?: number; // Legacy

    // Categoría (puede ser string ID, string nombre, u objeto)
    category?: string | { name: string; id?: number };
    productCategory?: { name: string; id?: number };
    cod_categoria?: string; // ID como string

    // Marca
    brand?: string | { name: string; id?: number };
    productBrand?: { name: string; id?: number };

    // Imágenes
    image?: string; // Imagen principal
    imagen?: string; // Legacy
    images?: Array<{
        cod_galeria?: number;
        imagen?: string;
        url?: string;
    }>;

    // Flags
    is_featured?: boolean | number | string; // API a veces devuelve 1/'1'
    is_new?: boolean | number | string;
    is_clearance?: boolean | number | string;

    // Video
    video_url?: string | null;

    // Specifications
    specifications?: Array<{key: string; value: string}> | null;

    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedResponse<T> {
    products: T[];
    total: number;
    totalPages: number;
    currentPage?: number;
    filters?: {
        category?: string;
        brand?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        featured?: boolean;
        new?: boolean;
        clearance?: boolean;
    };
}
