'use client';

import type { Product } from '@/models/Product';
import type { CompanySettings } from '@/services/SettingsService';

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

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex text-yellow-400">
          {'★★★★★'.split('').map((star, i) => (
            <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-300'}>{star}</span>
          ))}
        </div>
        <span className="text-gray-600">(4.2)</span>
        <span className="text-blue-600 hover:underline cursor-pointer">Ver 156 reseñas</span>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-6 border border-yellow-200">
        <div className="flex flex-col gap-1">
          {listPrice > 0 ? (
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-blue-600">S/. {listPrice.toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-600">Consultar Precio</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">💳 Precio especial con cualquier medio de pago</p>

        {settings?.show_distributor_price_in_detail && (product.priceDis || 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-yellow-200">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-500">Precio Distribuidor:</span>
              <span className="text-lg font-bold text-gray-700">S/. {Math.ceil(product.priceDis || 0).toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Consultar precios y distribuciones con su vendedor o por el ws{' '}
              <a
                href={`https://wa.me/51${(settings.company_whatsapp || '988552455').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline font-bold"
              >
                {settings.company_whatsapp || '988552455'}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Descripción:</h3>
        <p className="text-gray-600 leading-relaxed">
          {product.shortDescription ||
            product.description
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 150) + '...'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Stock disponible</p>
          <p className="text-xl font-bold text-green-600">{product.stock} unidades</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Categoría</p>
          <p className="text-xl font-bold text-gray-800">{product.category}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad:</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
          >
            -
          </button>
          <span className="w-16 h-10 border border-gray-300 rounded-lg flex items-center justify-center font-semibold">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(Math.min(product.stock, quantity + 1))}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
          >
            +
          </button>
          <span className="text-sm text-gray-600 ml-2">({product.stock} disponibles)</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={onBuyNow}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition transform hover:scale-105 shadow-lg"
        >
          🚀 Comprar Ahora
        </button>
        <button
          onClick={onAddToCart}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
        >
          🛒 Agregar al Carrito
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onToggleWishlist}
            className={`py-3 rounded-xl font-medium transition transform hover:scale-105 ${isInWishlist
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {isInWishlist ? '❤️ En Favoritos' : '🤍 Agregar a Favoritos'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Enlace copiado al portapapeles');
            }}
            className="bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            📤 Compartir
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">🚚 Información de Envío</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Envío gratis a todo Lima</li>
          <li>• Entrega en 24-48 horas</li>
          <li>• Provincias: 2-5 días hábiles</li>
        </ul>
      </div>
    </div>
  );
}
