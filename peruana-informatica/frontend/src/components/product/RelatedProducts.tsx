'use client';

import { Product } from '@/models/Product';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
    products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mt-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-brand-black-800 dark:text-gray-100">
                    Comprados juntos habitualmente
                    <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Clientes que vieron esto también vieron
                    </span>
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
