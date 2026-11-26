'use client';

import { Product } from '@/models/Product';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
    products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
    if (!products || products.length === 0) return null;

    return (
        <section className="mt-10">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-black-800 dark:text-gray-100">
                    Comprados juntos habitualmente
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Clientes que vieron esto también vieron
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
