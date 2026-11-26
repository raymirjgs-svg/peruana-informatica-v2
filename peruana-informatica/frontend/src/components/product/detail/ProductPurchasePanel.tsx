'use client';

import type { Product } from '@/models/Product';
import type { CompanySettings } from '@/services/SettingsService';
import { buildWhatsappLink, priceInquiryMessage } from '@/utils/whatsapp';
import { formatStockLabel } from '@/lib/product';
import { StarRating } from '@/components/product/StarRating';
import {
  CreditCard,
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';

interface ProductPurchasePanelProps {
  product: Product;
  settings: CompanySettings | null;
  quantity: number;
  isInWishlist: boolean;
  onQuantityChange: (quantity: number) => void;
  onBuyNow: () => void;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}

export function ProductPurchasePanel({
  product,
  settings,
  quantity,
  isInWishlist,
  onQuantityChange,
  onBuyNow,
  onAddToCart,
  onToggleWishlist,
}: ProductPurchasePanelProps) {
  const listPrice = Number(product.price || 0);
  const distributorPrice = Number(product.priceDis || 0);
  const stockLabel = formatStockLabel(product.stock, product.stockDisplay);
  const whatsapp = settings?.company_whatsapp || '988552455';

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-snug tracking-tight break-words mb-3">
        {product.name}
      </h1>

      {/* Valoracion real: si el producto no tiene resenas no se inventa nada */}
      {product.rating && product.rating.count > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={Number(product.rating.average) || 0} size="sm" />
          <span className="text-sm font-medium text-gray-700">
            {Number(product.rating.average || 0).toFixed(1)}
          </span>
          <span className="text-sm text-brand-red-600 hover:underline cursor-pointer">
            Ver {product.rating.count} reseñas
          </span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-6">
        {listPrice > 0 ? (
          <span className="block text-3xl md:text-4xl font-bold text-brand-red-600">
            S/ {listPrice.toFixed(2)}
          </span>
        ) : (
          <a
            href={buildWhatsappLink(
              priceInquiryMessage(product.name, quantity),
              settings?.company_whatsapp
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-2xl md:text-3xl font-bold text-brand-red-600 hover:text-brand-red-700"
          >
            <MessageCircle className="w-7 h-7 shrink-0" />
            Consultar precio por WhatsApp
          </a>
        )}
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4 shrink-0 text-gray-400" />
          Precio especial con cualquier medio de pago
        </p>

        {settings?.show_distributor_price_in_detail && distributorPrice > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium text-gray-500">Precio Distribuidor:</span>
              <span className="text-lg font-bold text-gray-900">
                S/ {distributorPrice.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Consulta precios y distribuciones con tu vendedor o por el{' '}
              <a
                href={buildWhatsappLink(priceInquiryMessage(product.name), whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-red-600 hover:underline"
              >
                WhatsApp {whatsapp}
              </a>
            </p>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Stock</dt>
          <dd
            className={`mt-1 text-sm font-semibold break-words ${
              product.stock > 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {stockLabel} unidades
          </dd>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Categoría</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">
            {product.category || '—'}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Código interno</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 font-mono break-words">
            {product.codigo_interno || '—'}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Marca</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">
            {product.brand || '—'}
          </dd>
        </div>
      </dl>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="cantidad">
          Cantidad
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span
            id="cantidad"
            className="w-16 h-11 border border-gray-300 rounded-lg flex items-center justify-center font-semibold"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            onClick={() => onQuantityChange(Math.min(product.stock, quantity + 1))}
            disabled={quantity >= product.stock}
            className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
          <span className="text-sm text-gray-600">({stockLabel} disponibles)</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={onBuyNow}
          className="w-full bg-brand-red-600 text-white py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-red-700 transition shadow-brand-red"
        >
          <Zap className="w-5 h-5" />
          Comprar ahora
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          className="w-full bg-white border-2 border-brand-red-600 text-brand-red-700 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-red-50 transition"
        >
          <ShoppingCart className="w-5 h-5" />
          Agregar al carrito
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onToggleWishlist}
            className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            <Heart
              className={`w-4 h-4 ${
                isInWishlist ? 'fill-brand-red-600 text-brand-red-600' : ''
              }`}
            />
            {isInWishlist ? 'En favoritos' : 'Agregar a favoritos'}
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Enlace copiado al portapapeles');
            }}
            className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-red-600" />
          Información de envío
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Envíos a todo el Perú</li>
          <li>• Entrega inmediata en Arequipa y Lima</li>
          <li>• Provincias: 2-5 días hábiles</li>
        </ul>
      </div>
    </div>
  );
}
