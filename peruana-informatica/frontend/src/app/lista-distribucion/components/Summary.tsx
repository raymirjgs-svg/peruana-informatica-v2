'use client';

import { Product } from '@/models/Product';

interface SummaryProps {
  products: Product[];
}

export function Summary({ products }: SummaryProps) {
  return (
    <div className="mt-6 bg-blue-50 p-6 rounded-lg print:hidden">
      <h3 className="font-bold text-lg mb-2">📊 Resumen</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total de productos</p>
          <p className="text-2xl font-bold text-blue-600">{products.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Productos disponibles</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.stock > 0).length}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Productos agotados</p>
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => p.stock === 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
