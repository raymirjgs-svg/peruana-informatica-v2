// ============================================
// 5. src/components/product/ProductGrid.tsx
// ============================================
'use client';

import { Product } from '@/models/Product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg
          className="w-10 h-10 mb-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 8l-9-5-9 5m18 0v8l-9 5m9-13l-9 5m0 0l-9-5m9 5v8m-9-13v8l9 5" />
        </svg>
        <p className="text-gray-700 dark:text-gray-300 text-lg">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
