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
    <div className="dark:bg-gray-900 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold dark:text-white">Productos ({products.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="rounded dark:border-gray-700"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {products.map(product => (
              <tr key={product.id} className="dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => onToggleProduct(product.id, e.target.checked)}
                    className="rounded dark:border-gray-700"
                  />
                </td>
                <td className="px-4 py-3 text-sm dark:text-white">
                  {product.codigo_interno || product.id}
                </td>
                <td className="px-4 py-3 text-sm dark:text-white">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-400">
                  {product.brand || '-'}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-400">
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
