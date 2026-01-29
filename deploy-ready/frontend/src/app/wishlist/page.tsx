'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, wishlistCount, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Mis Favoritos
            </h1>
            <p className="text-gray-600">
              {wishlistCount === 0 
                ? 'No tienes productos en tu lista de favoritos'
                : `${wishlistCount} ${wishlistCount === 1 ? 'producto' : 'productos'} guardados`
              }
            </p>
          </div>
          
          {wishlistCount > 0 && (
            <button
              onClick={clearWishlist}
              className="bg-red-100 text-red-600 px-6 py-2 rounded-lg hover:bg-red-200 transition font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Lista
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {wishlistCount === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="mb-6">
            <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            Tu lista de favoritos está vacía
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Explora nuestros productos y guarda tus favoritos haciendo clic en el corazón ❤️
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Explorar Productos
          </Link>
        </div>
      ) : (
        <>
          {/* Tips */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">💡 Tip:</h3>
                <p className="text-blue-800 text-sm">
                  Los productos en tu lista de favoritos se guardan automáticamente. Puedes volver a verlos cuando quieras.
                </p>
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Botones de acción adicionales */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar Más Productos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
