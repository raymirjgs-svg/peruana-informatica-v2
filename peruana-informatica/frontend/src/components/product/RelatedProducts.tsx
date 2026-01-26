'use client';

import Link from 'next/link';
import { Product } from '@/models/Product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
// Assuming we can reuse the solid card style or a variation of it
// For related products, a slightly more compact card is often better

interface RelatedProductsProps {
    products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
    const { addItem, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    if (!products || products.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                    Comprados juntos habitualmente
                    <span className="block text-sm font-normal text-gray-500 mt-1">
                        Clientes que vieron esto también vieron
                    </span>
                </h3>
                {/* Futuro: Flechas de carrusel aquí */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                    const isOnWishlist = isInWishlist(product.id);
                    const pPrice = Number(product.price || 0);
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

                    // Image logic
                    let imageUrl = '/placeholder.png';
                    if (product.images && product.images.length > 0 && product.images[0].imagen) {
                        imageUrl = product.images[0].imagen.startsWith('http')
                            ? product.images[0].imagen
                            : `${apiUrl}/images/products/${product.images[0].imagen}`;
                    } else if (product.image) {
                        imageUrl = product.image.startsWith('http')
                            ? product.image
                            : `${apiUrl}/images/products/${product.image}`;
                    }

                    return (
                        <div
                            key={product.id}
                            className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 relative"
                        >
                            {/* Image Area */}
                            <div className="relative h-48 bg-gray-50 p-4 transition-transform duration-500 group-hover:scale-105">
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                    }}
                                />

                                {/* Quick Actions overlay */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            isOnWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
                                        }}
                                        className={`p-2 rounded-full shadow-sm ${isOnWishlist ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-500'}`}
                                        title="Favoritos"
                                    >
                                        <svg className="w-4 h-4" fill={isOnWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <Link href={`/products/${product.slug}`} className="mb-2">
                                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                    </h4>
                                </Link>

                                {/* Rating fake/real - Amazon style shows stars everywhere */}
                                <div className="flex items-center gap-1 mb-2">
                                    <div className="flex text-yellow-400 text-xs">★★★★☆</div>
                                    <span className="text-xs text-gray-400">(12)</span>
                                </div>

                                {/* Price & Stock */}
                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-lg font-bold text-slate-900">
                                            {pPrice > 0 ? `S/. ${pPrice.toFixed(2)}` : 'Consultar'}
                                        </span>
                                        {/* Fake crossed out price for effect if we had it */}
                                        {/* <span className="text-xs text-gray-400 line-through">S/. {(pPrice * 1.2).toFixed(2)}</span> */}
                                    </div>

                                    <button
                                        onClick={() => addItem(product)}
                                        className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                    >
                                        Agregar al carrito
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
