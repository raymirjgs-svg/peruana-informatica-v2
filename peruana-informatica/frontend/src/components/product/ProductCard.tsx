// ============================================
// 4. src/components/product/ProductCard.tsx
// ============================================
'use client';

import Link from 'next/link';
import { Product } from '@/models/Product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import Image from 'next/image';
import { memo } from 'react';

interface ProductCardProps {
  product: Product;
}

import { motion } from 'framer-motion';

// ... imports

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const handleAddToCart = () => {
    if (product.isAvailable()) {
      addItem(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-brand-red transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group"
    >
      {/* Imagen */}
      <div className="bg-gray-100 dark:bg-gray-700 h-44 relative overflow-hidden">
        {(() => {
          const getImageSrc = () => {
            if (product.images && product.images.length > 0 && product.images[0]?.imagen) {
              const image = product.images[0]?.imagen;
              if (image.startsWith('http')) return image;
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              return `${apiUrl}/images/products/${encodeURIComponent(image)}`;
            }
            if (product.image && product.image.trim() !== '') {
              if (product.image.startsWith('http')) return product.image;
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              return `${apiUrl}/images/products/${encodeURIComponent(product.image)}`;
            }
            return '/images/no-image.svg';
          };
          const imgSrc = getImageSrc();
          const isLocal = imgSrc.startsWith('/') || imgSrc === '/images/no-image.svg';
          
          if (isLocal) {
            return (
              <Image
                src={imgSrc}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            );
          }
          
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = '/images/no-image.svg';
              }}
            />
          );
        })()}

        {/* Botones de acción flotantes (solo visibles en hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <button
            onClick={handleToggleWishlist}
            className={`p-2 rounded-full shadow-md transition-colors ${isInWishlist(product.id)
              ? 'bg-brand-red-600 text-white shadow-brand-red'
              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-red-50 dark:hover:bg-red-900/30 hover:text-brand-red-600'
              }`}
            title={isInWishlist(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <svg className="w-5 h-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <button
            onClick={handleToggleCompare}
            className={`p-2 rounded-full shadow-md transition-colors ${isInCompare(product.id)
              ? 'bg-brand-slate-800 text-white shadow-brand-slate'
              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-slate-100 dark:hover:bg-slate-900/30 hover:text-brand-slate-800'
              }`}
            title={isInCompare(product.id) ? 'Quitar de comparación' : 'Agregar a comparación'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* Badges: NEW / FEATURED / CLEARANCE / AGOTADO */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {!product.isAvailable() && (
            <span className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-gray-800/90 backdrop-blur-sm text-white rounded-md shadow-sm">
              Agotado
            </span>
          )}
          {product.is_new && product.isAvailable() && (
            <span className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white rounded-md shadow-sm">
              Nuevo
            </span>
          )}
          {product.is_featured && product.isAvailable() && (
            <span className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-amber-500 text-white rounded-md shadow-sm">
              ⭐ Top
            </span>
          )}
          {product.is_clearance && product.isAvailable() && (
            <span className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-red-600 text-white rounded-md shadow-sm animate-pulse">
              🔥 Oferta
            </span>
          )}
          {(() => {
            const pWeb = Number(product.price || 0);
            const pDis = Number(product.priceDis || 0);
            if (pDis > 0 && pWeb > 0 && pDis > pWeb * 1.1) {
              const pct = Math.round((1 - pWeb / pDis) * 100);
              return (
                <span className="px-2.5 py-1 text-[10px] font-black tracking-wide bg-red-600 text-white rounded-md shadow-sm">
                  -{pct}%
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-brand-black-800 dark:text-gray-100 text-sm mb-1 hover:text-brand-red-600 dark:hover:text-brand-red-400 transition-colors cursor-pointer line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Codigo Interno */}
        {product.codigo_interno && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-mono">
            {product.codigo_interno}
          </div>
        )}

        {/* Precio y stock */}
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
            {(() => {
              const pWeb = Number(product.price || 0);
              const pDis = Number(product.priceDis || 0);
              const hasDiscount = pDis > 0 && pWeb > 0 && pDis > pWeb * 1.1;
              if (pWeb > 0) {
                return (
                  <div className="flex flex-col gap-0.5">
                    {hasDiscount && (
                      <span className="text-sm text-gray-400 dark:text-gray-500 line-through leading-none">
                        S/. {pDis.toFixed(2)}
                      </span>
                    )}
                    <span className="text-lg font-bold text-brand-black-800 dark:text-gray-100 leading-none">
                      S/. {pWeb.toFixed(2)}
                    </span>
                  </div>
                );
              }
              return <span className="text-xl font-bold text-gray-500 dark:text-gray-400">Consultar</span>;
            })()}

            {/* Indicador de Stock */}
            {product.isAvailable() && (
              <div className="mt-1 text-xs font-medium">
                {product.stock < 5 ? (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1 animate-pulse">
                    ⚠️ ¡Solo {product.stock}!
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    En stock
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={handleAddToCart}
          disabled={!product.isAvailable()}
          className={`w-full py-2 text-sm rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-brand-red active:scale-95 ${product.isAvailable()
            ? isInCart(product.id)
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white hover:from-brand-red-700 hover:to-brand-red-800'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
            }`}
        >
          {!product.isAvailable()
            ? 'Agotado'
            : isInCart(product.id)
              ? 'En el carrito'
              : 'Agregar al carrito'
          }
        </button>
      </div>
    </motion.div>
  );
});
