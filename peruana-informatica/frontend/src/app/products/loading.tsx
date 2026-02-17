import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';

export default function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            ))}
          </div>
        </div>
      </aside>
      <div className="lg:col-span-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
