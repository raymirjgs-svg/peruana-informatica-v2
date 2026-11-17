'use client';

import { Product } from '@/models/Product';
import { X, Package } from 'lucide-react';
import { getProductImage } from './productImage';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center p-4">
                {getProductImage(product) ? (
                  <img
                    src={getProductImage(product)!}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Package className="w-20 h-20 text-gray-300" />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-mono">
                  Código: {product.codigo_interno || product.id}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">
                  S/ {Math.ceil(Number(product.priceCot || product.priceWeb || product.price)).toFixed(2)}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' :
                  product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Categoría</p>
                  <p className="font-medium text-gray-900">{product.category || 'Sin categoría'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Marca</p>
                  <p className="font-medium text-gray-900">
                    {product.brand || 'Sin marca'}
                  </p>
                </div>
              </div>

              {product.description && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase mb-2">Descripción</p>
                  <p className="text-sm text-gray-700 line-clamp-4">
                    {product.description.replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            Cerrar
          </button>
          <a
            href={`/productos/${product.slug || product.id}`}
            target="_blank"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Ver en tienda
          </a>
        </div>
      </div>
    </div>
  );
}
