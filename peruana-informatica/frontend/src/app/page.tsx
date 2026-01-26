'use client';

import Link from 'next/link';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Carousel } from '@/components/common/Carousel';
import { useEffect, useState } from 'react';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [clearanceProducts, setClearanceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const productService = new ProductService();

      try {
        const [featured, newArrivals, clearance] = await Promise.all([
          productService.getProducts(1, 4, { featured: true }),
          productService.getProducts(1, 4, { new: true }),
          productService.getProducts(1, 4, { clearance: true }),
        ]);

        setFeaturedProducts(featured.products);
        setNewProducts(newArrivals.products);
        setClearanceProducts(clearance.products);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div>
      {/* CARRUSEL */}
      <Carousel />

      <div className="space-y-16 mt-12">
        {/* Novedades */}
        {newProducts.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🆕</span>
                <h2 className="text-3xl font-bold text-gray-900">Nuevos Ingresos</h2>
              </div>
              <Link href="/products?new=true" className="text-blue-600 font-semibold hover:text-blue-800 transition flex items-center gap-1">
                Ver todo <span className="text-xl">→</span>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <ProductGrid products={newProducts} />
            )}
          </section>
        )}

        {/* Productos destacados */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
            </div>
            <Link href="/products?featured=true" className="text-blue-600 font-semibold hover:text-blue-800 transition flex items-center gap-1">
              Ver todo <span className="text-xl">→</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={featuredProducts.length > 0 ? featuredProducts : []} />
          )}
        </section>

        {/* Remates */}
        {clearanceProducts.length > 0 && (
          <section className="bg-red-50 p-8 rounded-2xl border border-red-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <h2 className="text-3xl font-bold text-red-700">Zona de Remates</h2>
              </div>
              <Link href="/products?clearance=true" className="text-red-600 font-semibold hover:text-red-800 transition flex items-center gap-1">
                Ver ofertas <span className="text-xl">→</span>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <ProductGrid products={clearanceProducts} />
            )}
          </section>
        )}
      </div>

      <div className="mb-16"></div>

      {/* Why us */}
      <section className="bg-white py-16 rounded-xl shadow-md border border-gray-100 mb-12">
        <h2 className="text-4xl font-bold mb-12 text-center">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition">
            <div className="text-5xl mb-4">🚚</div>
            <h3 className="font-bold text-lg mb-2">Envío Rápido</h3>
            <p className="text-gray-700">Llegamos a todo el Perú en 2-3 días hábiles</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-lg mb-2">Garantía Oficial</h3>
            <p className="text-gray-700">Todos nuestros productos tienen garantía del fabricante</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-bold text-lg mb-2">Soporte 24/7</h3>
            <p className="text-gray-700">Atención al cliente disponible todo el tiempo</p>
          </div>
        </div>
      </section>

      {/* Sección de Contacto */}
      <section id="contacto" className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-16 rounded-xl shadow-lg">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">¿Necesitas ayuda?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Teléfono */}
          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition">
            <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Llámanos</h3>
            <p className="text-blue-100 mb-2">+51 1 234-5678</p>
            <p className="text-blue-100">+51 987-654-321</p>
          </div>

          {/* Email */}
          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition">
            <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Escríbenos</h3>
            <p className="text-blue-100 mb-2">info@peruanainformatica.com</p>
            <p className="text-blue-100">ventas@peruanainformatica.com</p>
          </div>

          {/* WhatsApp */}
          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.085" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
            <p className="text-blue-100 mb-2">+51 987-654-321</p>
            <p className="text-blue-100 text-sm">Respuesta inmediata</p>
          </div>

          {/* Ubicación */}
          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition">
            <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Visítanos</h3>
            <p className="text-blue-100 mb-2">Av. Tecnología 123</p>
            <p className="text-blue-100">Lima, Perú 15001</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition transform hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Formulario de Contacto Completo
          </Link>
        </div>
      </section>
    </div>
  );
}