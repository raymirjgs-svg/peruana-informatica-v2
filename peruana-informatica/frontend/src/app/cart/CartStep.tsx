import Link from 'next/link';
import Image from 'next/image';
import { CartItem } from '@/hooks/useCart';
import { CouponInput } from '@/components/checkout/CouponInput';
import { Coupon } from '@/services/CouponService';
import { getImageUrl } from './helpers';
import { ProgressBar } from './ProgressBar';

interface CartStepProps {
  items: CartItem[];
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  totalPrice: number;
  discountAmount: number;
  finalTotal: number;
  coupon: Coupon | null;
  onCouponApplied: (coupon: Coupon | null) => void;
  onContinue: () => void;
}

export function CartStep({
  items,
  updateQuantity,
  removeItem,
  totalPrice,
  discountAmount,
  finalTotal,
  coupon,
  onCouponApplied,
  onContinue,
}: CartStepProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <ProgressBar currentStep="cart" />

        <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <p className="text-xl mb-6">Tu carrito está vacío</p>
            <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg">Explorar Productos</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.product.id} className="bg-white p-4 rounded-xl shadow flex gap-4">
                  <Image src={getImageUrl(item.product.image)} width={100} height={100} alt={item.product.name} className="object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-bold">{item.product.name}</h3>
                    <p className="text-green-600 font-bold">S/ {Number(item.product.price).toFixed(2)}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border rounded">
                        <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="px-3 py-1">-</button>
                        <span className="px-3">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-3 py-1">+</button>
                      </div>
                      <button onClick={() => removeItem(item.product.id)} className="text-red-500">Eliminar</button>
                    </div>
                  </div>
                  <div className="font-bold">
                    S/ {(Number(item.product.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden sticky top-4 border border-gray-100">
                <div className="bg-blue-600 p-4 text-white font-bold text-lg">Resumen del Pedido</div>
                <div className="p-6">
                  <div className="mb-6">
                    <CouponInput
                      subtotal={totalPrice}
                      onCouponApplied={onCouponApplied}
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-800">S/ {totalPrice.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center py-2 text-green-600">
                        <span className="">Descuento {coupon?.code}</span>
                        <span className="font-semibold">- S/ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-t border-gray-100 text-xl font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">S/ {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onContinue}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
