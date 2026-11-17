'use client';

import { Product } from '@/models/Product';
import { Eye, ChevronUp, ChevronDown, Package } from 'lucide-react';
import { getProductImage } from './productImage';

interface ProductListProps {
  loading: boolean;
  products: Product[];
  sortField: 'name' | 'price' | 'stock';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'price' | 'stock') => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductList({
  loading,
  products,
  sortField,
  sortDirection,
  onSort,
  onSelectProduct,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24 print:hidden">Img</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-1">
                  Producto
                  {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Info</th>
              <th
                className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition"
                onClick={() => onSort('price')}
              >
                <div className="flex items-center justify-end gap-1">
                  Precio
                  {sortField === 'price' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>
              <th
                className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition"
                onClick={() => onSort('stock')}
              >
                <div className="flex items-center justify-center gap-1">
                  Stock
                  {sortField === 'stock' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:hidden">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length > 0 ? (
              products.map((product, index) => {
                const imgUrl = getProductImage(product);
                const hasSpecialPrice = Boolean(product.priceCot && product.priceCot > 0);
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-blue-50/50 transition group/row ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-6 py-4 print:hidden">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center group-hover/row:scale-110 transition-transform duration-300 shadow-sm">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-gray-50 ${imgUrl ? 'hidden' : ''}`}>
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {product.codigo_interno || product.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full w-fit">
                          {product.category || 'General'}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-gray-400">
                            {product.brand}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900">
                          S/ {Math.ceil(Number(product.priceCot || product.priceWeb || product.price)).toFixed(2)}
                        </span>
                        {hasSpecialPrice && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                            Oferta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${product.stock > 10
                        ? 'bg-blue-50 text-blue-700'
                        : product.stock > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                        }`}>
                        {product.stock} u.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center print:hidden">
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="p-2 rounded-full hover:bg-white hover:shadow-md text-gray-400 hover:text-blue-600 transition border border-transparent hover:border-gray-100"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-50 rounded-full">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>No se encontraron productos con los filtros seleccionados</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
