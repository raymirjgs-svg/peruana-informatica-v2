// ============================================
// 1. frontend/src/app/categories/page.tsx
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryService, Category } from '@/services/CategoryService';
import { Navigation } from '@/components/common/Navigation';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const categoryService = new CategoryService();
      const data = await categoryService.getCategories();
      setCategories(data);
      setLoading(false);
    };
    loadCategories();
  }, []);

  // Iconos por categoría
  const getCategoryIcon = (slug: string) => {
    const icons: { [key: string]: string } = {
      'laptops': '💻',
      'monitores': '🖥️',
      'computadoras': '🖨️',
      'teclados': '⌨️',
      'mouse': '🖱️',
      'memorias': '🧠',
      'discos': '💾',
      'procesadores': '⚙️',
      'placas': '🔧',
      'tarjetas-video': '🎮',
      'fuentes': '🔌',
      'cases': '📦',
      'refrigeracion': '❄️',
      'perifericos': '🎧',
      'audifonos': '🎧',
      'parlantes': '🔊',
      'webcams': '📷',
      'impresoras': '🖨️',
      'routers': '📡',
      'switches': '🔀',
      'cables': '🔗',
      'mochilas': '🎒',
      'ups': '🔋',
      'camaras': '📹',
      'tablets': '📱',
      'proyectores': '📽️',
      'software': '💿',
      'antivirus': '🛡️',
    };
    return icons[slug] || '📦';
  };

  return (
    <>
      <Navigation />
      <div>
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Todas las Categorías</h1>
          <p className="text-gray-600 text-lg">
            Explora nuestro catálogo completo de {categories.length} categorías de productos
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Cargando categorías...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden border-2 border-transparent hover:border-blue-500 transform hover:scale-105"
              >
                <div className="p-6 text-center">
                  {/* Icono */}
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {getCategoryIcon(category.slug)}
                  </div>
                  
                  {/* Nombre */}
                  <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition">
                    {category.name}
                  </h3>
                  
                  {/* Badge */}
                  <span className="inline-block bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">
                    Ver productos →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Botón volver */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            ← Ver todos los productos
          </Link>
        </div>
      </div>
    </>
  );
}
