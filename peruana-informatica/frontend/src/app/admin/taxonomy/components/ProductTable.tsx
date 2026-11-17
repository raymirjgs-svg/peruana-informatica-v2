'use client';

import type { Product } from '@/models/Product';

interface ProductTableProps {
  products: Product[];
  selectedIds: number[];
  onToggleAll: (checked: boolean) => void;
  onToggleProduct: (id: number, checked: boolean) => void;
  onAssign: (product: Product) => void;
}

export function ProductTable({
  products,
  selectedIds,
  onToggleAll,
  onToggleProduct,
  onAssign,
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">Productos ({products.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => onToggleProduct(product.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {product.codigo_interno || product.id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.brand || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.category || '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onAssign(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Asignar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
