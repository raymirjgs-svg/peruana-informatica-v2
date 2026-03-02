'use client';

import Link from 'next/link';
import { Product } from '@/models/Product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import Image from 'next/image';
import { memo } from 'react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const handleAddToCart = () => {
    if (product.isAvailable()) addItem(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare(product.id)) removeFromCompare(product.id);
    else addToCompare(product);
  };

  const getImageSrc = () => {
    if (product.images && product.images.length > 0 && product.images[0]?.imagen) {
      const image = product.images[0].imagen;
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
  const isLocal = imgSrc.startsWith('/');

  const pWeb = Number(product.price || 0);
  const pDis = Number(product.priceDis || 0);
  const hasDiscount = pDis > 0 && pWeb > 0 && pDis > pWeb * 1.1;
  const discountPct = hasDiscount ? Math.round((1 - pWeb / pDis) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Left accent bar */}
      <span className="absolute left-0 inset-y-0 w-[3px] bg-brand-red-600 rounded-r origin-center scale-y-0 group-hover:scale-y-100 transition-transform duration-300 z-20" />

      {/* Image area */}
      <div className="relative bg-gray-50 dark:bg-gray-800 h-48 overflow-hidden flex-none">
        {isLocal ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = '/images/no-image.svg'; }}
          />
        )}

        {/* Status badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {!product.isAvailable() && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-gray-700 text-white rounded">
              Agotado
            </span>
          )}
          {product.is_new && product.isAvailable() && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-600 text-white rounded">
              Nuevo
            </span>
          )}
          {product.is_featured && product.isAvailable() && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-amber-500 text-white rounded">
              Top
            </span>
          )}
          {product.is_clearance && product.isAvailable() && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-brand-red-600 text-white rounded">
              Oferta
            </span>
          )}
        </div>

        {/* Discount badge — top right */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[11px] font-black bg-brand-red-600 text-white rounded tabular-nums">
            -{discountPct}%
          </span>
        )}

        {/* Action buttons — slide in from right on hover */}
        <div className="absolute right-2 bottom-2 flex flex-col gap-1.5 translate-x-10 group-hover:translate-x-0 transition-transform duration-300 z-10">
          <button
            onClick={handleToggleWishlist}
            title={isInWishlist(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className={`p-1.5 rounded-lg shadow-sm transition-colors ${
              isInWishlist(product.id)
                ? 'bg-brand-red-600 text-white'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 hover:text-brand-red-600'
            }`}
          >
            <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            onClick={handleToggleCompare}
            title={isInCompare(product.id) ? 'Quitar de comparación' : 'Comparar'}
            className={`p-1.5 rounded-lg shadow-sm transition-colors ${
              isInCompare(product.id)
                ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5">
        <Link href={`/products/${product.slug}`} className="block mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-[13px] leading-snug hover:text-brand-red-600 dark:hover:text-brand-red-400 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {product.codigo_interno && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mb-2">
            {product.codigo_interno}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mb-3 pt-2">
          {pWeb > 0 ? (
            <div className="flex flex-col gap-0.5">
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through leading-none tabular-nums">
                  S/. {pDis.toFixed(2)}
                </span>
              )}
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight tabular-nums">
                S/. {pWeb.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-400">Consultar precio</span>
          )}

          {product.isAvailable() && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {product.stock < 5 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-none" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Solo {product.stock} en stock
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    En stock
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* CTA button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.isAvailable()}
          className={`w-full py-2 text-[13px] font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${
            product.isAvailable()
              ? isInCart(product.id)
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-800 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-brand-red-600 hover:border-brand-red-600 hover:text-white dark:hover:bg-brand-red-600 dark:hover:border-brand-red-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {!product.isAvailable()
            ? 'Agotado'
            : isInCart(product.id)
              ? 'En el carrito'
              : 'Agregar al carrito'}
        </button>
      </div>
    </motion.div>
  );
});
