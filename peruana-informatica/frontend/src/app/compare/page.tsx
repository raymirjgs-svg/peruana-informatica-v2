'use client';

import { useCompare } from '@/hooks/useCompare';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/models/Product';
import { useState } from 'react';
import { getProductImageUrl } from '@/utils/images';

export default function ComparePage() {
  const { compareList, compareCount, removeFromCompare, clearCompare, maxCompareItems } = useCompare();
  const { addItem } = useCart();
  const [highlightDifferences, setHighlightDifferences] = useState(false);

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  // Helper to check if a value differs across products
  const isDifferent = (field: keyof Product): boolean => {
    if (compareList.length < 2) return false;
    const values = compareList.map(p => p[field]);
    return new Set(values).size > 1;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b mb-8 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar Productos
            </h1>
            <p className="text-gray-600">
              {compareCount === 0
                ? 'No tienes productos para comparar'
                : `Comparando ${compareCount} de ${maxCompareItems} productos`
              }
            </p>
          </div>

          {compareCount > 0 && (
            <div className="flex gap-3">
              {compareCount > 1 && (
                <button
                  onClick={() => setHighlightDifferences(!highlightDifferences)}
                  className={`px-4 py-2 rounded-lg transition font-semibold flex items-center gap-2 ${highlightDifferences
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  {highlightDifferences ? 'Diferencias Resaltadas' : 'Resaltar Diferencias'}
                </button>
              )}
              <button
                onClick={clearCompare}
                className="bg-red-100 text-red-600 px-6 py-2 rounded-lg hover:bg-red-200 transition font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      {compareCount === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="mb-6">
            <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No hay productos para comparar
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Agrega productos haciendo clic en el icono de comparación 📊 desde cualquier tarjeta de producto
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
                  Puedes comparar hasta {maxCompareItems} productos al mismo tiempo. Revisa las especificaciones lado a lado para tomar la mejor decisión.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa - Desktop */}
          <div className="hidden lg:block overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 text-left bg-gray-50 font-bold sticky left-0 z-10">Característica</th>
                  {compareList.map((product) => (
                    <th key={product.id} className="p-4 min-w-[250px]">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                          title="Quitar de comparación"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="relative h-40 mb-4 bg-gray-50 rounded-lg">
                          <Image
                            src={getProductImageUrl(product.image)}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <Link href={`/products/${product.slug}`} className="font-bold text-gray-900 hover:text-blue-600 transition block mb-2">
                          {product.name}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Precio */}
                <tr className={`border-b border-gray-100 transition ${highlightDifferences && isDifferent('price') ? 'bg-yellow-50' : 'hover:bg-gray-50 bg-white'
                  }`}>
                  <td className="p-4 font-semibold bg-gray-100 sticky left-0 border-r">💰 Precio</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className="text-2xl font-bold text-blue-600">S/. {product.price}</span>
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr className={`border-b border-gray-100 transition ${highlightDifferences && isDifferent('stock') ? 'bg-yellow-50' : 'hover:bg-gray-50 bg-gray-50'
                  }`}>
                  <td className="p-4 font-semibold bg-gray-100 sticky left-0 border-r">📦 Disponibilidad</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Descripción */}
                <tr className={`border-b border-gray-100 transition ${highlightDifferences && isDifferent('shortDescription') ? 'bg-yellow-50' : 'hover:bg-gray-50 bg-white'
                  }`}>
                  <td className="p-4 font-semibold bg-gray-100 sticky left-0 border-r">📝 Descripción</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4">
                      <p className="text-sm text-gray-600">{product.shortDescription}</p>
                    </td>
                  ))}
                </tr>

                {/* Categoría */}
                <tr className={`border-b border-gray-100 transition ${highlightDifferences && isDifferent('category') ? 'bg-yellow-50' : 'hover:bg-gray-50 bg-gray-50'
                  }`}>
                  <td className="p-4 font-semibold bg-gray-100 sticky left-0 border-r">🏷️ Categoría</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        {product.category || 'N/A'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Acciones */}
                <tr className="bg-white">
                  <td className="p-4 font-semibold bg-gray-100 sticky left-0 border-r">⚡ Acciones</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0}
                          className={`w-full py-2 rounded-lg font-semibold transition ${product.stock > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          🛒 Agregar al Carrito
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          className="block w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Vista Móvil */}
          <div className="lg:hidden space-y-6">
            {compareList.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg flex-1">{product.name}</h3>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative h-48 mb-4 bg-gray-50 rounded-lg">
                  <Image
                    src={getProductImageUrl(product.image)}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold">Precio:</span>
                    <span className="text-xl font-bold text-blue-600">S/. {product.price}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold">Stock:</span>
                    <span className={`px-2 py-1 rounded text-sm ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {product.stock > 0 ? `${product.stock} unidades` : 'Agotado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold">Categoría:</span>
                    <span>{product.category || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className={`w-full py-3 rounded-lg font-semibold transition ${product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    🛒 Agregar al Carrito
                  </button>
                  <Link
                    href={`/products/${product.slug}`}
                    className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Botón para buscar más productos */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
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
