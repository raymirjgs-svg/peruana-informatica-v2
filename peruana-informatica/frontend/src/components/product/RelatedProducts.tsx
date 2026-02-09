'use client';

import Link from 'next/link';
import { Product } from '@/models/Product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { motion } from 'framer-motion';

interface RelatedProductsProps {
    products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
    const { addItem, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

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
                {products.map((product) => {
                    const isOnWishlist = isInWishlist(product.id);
                    const inCart = isInCart(product.id);
                    const pPrice = Number(product.price || 0);
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

                    // Image logic
                    let imageUrl = '/placeholder.png';
                    const firstImage = product.images?.[0]?.imagen;
                    if (firstImage) {
                        imageUrl = firstImage.startsWith('http')
                            ? firstImage
                            : `${apiUrl}/images/products/${firstImage}`;
                    } else if (product.image) {
                        imageUrl = product.image.startsWith('http')
                            ? product.image
                            : `${apiUrl}/images/products/${product.image}`;
                    }

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-brand-red transition-all duration-300 relative"
                        >
                            {/* Image Area */}
                            <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                    }}
                                />

                                {/* Quick Actions overlay */}
                                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            isOnWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`p-2 rounded-full shadow-md transition-colors ${isOnWishlist
                                            ? 'bg-brand-red-600 text-white shadow-brand-red'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-red-50 dark:hover:bg-red-900/30 hover:text-brand-red-600'
                                            }`}
                                        title={isOnWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                    >
                                        <svg className="w-4 h-4" fill={isOnWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Out of stock badge */}
                                {!product.isAvailable() && (
                                    <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        Agotado
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <Link href={`/products/${product.slug}`} className="mb-2">
                                    <h4 className="font-semibold text-brand-black-800 dark:text-gray-100 text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-brand-red-600 dark:group-hover:text-brand-red-400 transition-colors">
                                        {product.name}
                                    </h4>
                                </Link>

                                {/* Codigo Interno */}
                                {product.codigo_interno && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-mono">
                                        {product.codigo_interno}
                                    </div>
                                )}

                                {/* Price & Stock */}
                                <div className="mt-auto">
                                    <div className="flex flex-col mb-3">
                                        <span className="text-lg font-bold text-brand-black-800 dark:text-gray-100">
                                            {pPrice > 0 ? `S/. ${pPrice.toFixed(2)}` : 'Consultar'}
                                        </span>

                                        {/* Stock indicator */}
                                        {product.isAvailable() && (
                                            <div className="mt-1 text-xs font-medium">
                                                {product.stock < 5 ? (
                                                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                                        ⚠️ Solo {product.stock}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        {product.stock} disponibles
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => addItem(product)}
                                        disabled={!product.isAvailable()}
                                        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-brand-red active:scale-95 ${product.isAvailable()
                                            ? inCart
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white hover:from-brand-red-700 hover:to-brand-red-800'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {!product.isAvailable()
                                            ? 'Agotado'
                                            : inCart
                                                ? 'En el carrito'
                                                : 'Agregar al carrito'
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
