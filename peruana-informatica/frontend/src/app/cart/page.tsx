'use client';

import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User,
  CreditCard,
  CheckCircle,
  Banknote,
  ArrowRightLeft,
  Smartphone,
  Search,
  Mail,
  FileText,
  Home,
  ShoppingBag
} from 'lucide-react';
import { CouponInput } from '@/components/checkout/CouponInput';
import { type Coupon } from '@/services/CouponService';
import { getProductImageUrl } from '@/utils/images';

type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'yape' | 'plin' | 'mercadopago';
type InvoiceType = 'boleta' | 'factura';

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados del flujo
  const [step, setStep] = useState<'cart' | 'customer' | 'payment' | 'success'>('cart');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [checkoutMode, setCheckoutMode] = useState<'direct' | 'approval'>('direct');

  // Coupon State
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Fetch Checkout Mode
  useEffect(() => {
    const fetchCheckoutMode = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/settings/checkout-mode`);
        if (res.ok) {
          const data = await res.json();
          setCheckoutMode(data.mode);
        }
      } catch (error) {
        console.error('Error fetching checkout mode:', error);
      }
    };
    fetchCheckoutMode();
  }, []);

  // Update discount when coupon or total price changes
  useEffect(() => {
    if (coupon) {
      if (coupon.type === 'percentage') {
        setDiscountAmount((totalPrice * coupon.value) / 100);
      } else {
        setDiscountAmount(coupon.value);
      }
    } else {
      setDiscountAmount(0);
    }
  }, [coupon, totalPrice]);

  const finalTotal = Math.max(0, totalPrice - discountAmount);

  // Datos del cliente
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });

  // Pre-fill data from session
  useEffect(() => {
    if (session?.user) {
      setCustomerData(prev => ({
        ...prev,
        name: session.user?.name || prev.name,
        email: session.user?.email || prev.email,
      }));
    }
  }, [session]);


  // Datos de pago y facturación
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('boleta');
  const [invoiceData, setInvoiceData] = useState({
    ruc: '',
    business_name: '',
    tax_address: ''
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  // Datos de tarjeta
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Formatear fecha de expiración (MM/YY)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Detectar tipo de tarjeta
  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    return null;
  };

  // Iconos SVG para métodos de pago
  const PaymentIcons = {
    efectivo: <Banknote className="w-8 h-8" />,
    transferencia: <ArrowRightLeft className="w-8 h-8" />,
    tarjeta: <CreditCard className="w-8 h-8" />,
    yape: <Smartphone className="w-8 h-8" />,
    plin: <Smartphone className="w-8 h-8" />,
    mercadopago: <CreditCard className="w-8 h-8 text-blue-500" />
  };

  // Componente de Barra de Progreso Mejorada
  const ProgressBar = ({ currentStep }: { currentStep: string }) => {
    const steps = [
      { id: 'cart', label: 'Carrito', icon: <ShoppingBag className="w-5 h-5" /> },
      { id: 'customer', label: 'Datos', icon: <User className="w-5 h-5" /> },
      { id: 'payment', label: 'Pago', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'success', label: 'Confirmación', icon: <CheckCircle className="w-5 h-5" /> }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="mb-10 px-4">
        <div className="relative">
          {/* Línea de fondo */}
          <div className="absolute left-0 top-6 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full"></div>

          {/* Línea de progreso animada */}
          <div
            className="absolute left-0 top-6 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          <div className="relative flex justify-between">
            {steps.map((s, index) => {
              const isCurrent = s.id === currentStep;
              const isCompleted = index < currentIndex;

              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                    transition-all duration-500 transform border-4 shadow-lg
                    ${isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white scale-100'
                      : isCurrent
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-300 text-white scale-110 ring-4 ring-blue-200 ring-opacity-50'
                        : 'bg-white border-gray-300 text-gray-400 scale-95'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      s.icon
                    )}
                  </div>
                  <span className={`
                    text-sm mt-3 font-semibold transition-colors duration-300
                    ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const payload = {
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_document: customerData.document,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        coupon_code: coupon?.code,
        discount_amount: discountAmount,
        total_amount: finalTotal
      };

      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setOrderId(data.order_id);
        setOrderTotal(finalTotal);

        if (data.status === 'pending_approval' || checkoutMode === 'approval') {
          setStep('success');
        } else {
          setStep('payment');
        }
        clearCart();
      } else {
        setError(data.error || 'No se pudo crear el pedido');
      }
    } catch {
      setError('Error de conexión. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'mercadopago') {
      setIsLoading(true);
      try {
        const { init_point } = await import('@/services/PaymentService').then(m => m.paymentService.createPreferenceForOrder(orderId!));
        window.location.href = init_point;
        return;
      } catch (e: any) {
        setError(e.message || 'Error al conectar con MercadoPago');
        setIsLoading(false);
        return;
      }
    }

    if (paymentMethod === 'tarjeta') {
      if (!cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv) {
        setError('Debe completar todos los datos de la tarjeta');
        return;
      }
    } else if (paymentMethod !== 'efectivo' && !paymentProof) {
      setError('Debe subir un comprobante de pago');
      return;
    }

    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const formData = new FormData();
      formData.append('payment_method', paymentMethod);
      formData.append('invoice_type', invoiceType);

      if (paymentProof) {
        formData.append('payment_proof', paymentProof);
      }

      if (paymentMethod === 'tarjeta') {
        const cleanCardNumber = cardData.number.replace(/\s/g, '');
        formData.append('card_last_four', cleanCardNumber.slice(-4));
        formData.append('card_type', getCardType(cardData.number) || 'unknown');
        formData.append('card_holder', cardData.holder);
      }

      if (invoiceType === 'factura') {
        formData.append('ruc', invoiceData.ruc);
        formData.append('business_name', invoiceData.business_name);
        formData.append('tax_address', invoiceData.tax_address);
      }

      const response = await fetch(`${apiUrl}/api/payments/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.error || 'No se pudo procesar el pago');
      }
    } catch {
      setError('Error de conexión. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizado según el paso
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <ProgressBar currentStep="success" />
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl mb-4 animate-bounce">
                  {checkoutMode === 'approval' ? (
                    <div className="text-yellow-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                  ) : (
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {checkoutMode === 'approval' ? 'Solicitud en Revisión' : '¡Pedido Registrado!'}
                </h1>
                <p className="text-green-100 text-lg">
                  {checkoutMode === 'approval'
                    ? 'Tu pedido requiere aprobación del administrador'
                    : 'Gracias por tu compra'}
                </p>
              </div>
            </div>

            <div className="px-8 -mt-6 relative z-10">
              <div className={`rounded-2xl p-6 text-center shadow-lg ${checkoutMode === 'approval' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                <p className="text-white/80 text-sm uppercase tracking-wide mb-1">Número de Pedido</p>
                <p className="text-4xl font-bold text-white">#{orderId}</p>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmación enviada a:</p>
                  <p className="font-semibold text-blue-600">{customerData.email}</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </span>
                  Próximos pasos
                </h2>
                <div className="space-y-3">
                  {[
                    { icon: '📥', text: 'Hemos recibido tu comprobante de pago' },
                    { icon: '🔍', text: 'Nuestro equipo verificará el pago en las próximas 24 horas' },
                    { icon: '📧', text: 'Recibirás un email cuando tu pago sea verificado' },
                    { icon: '📄', text: `Generaremos tu ${invoiceType === 'factura' ? 'factura' : 'boleta'}` },
                    { icon: '✅', text: 'Te enviaremos el comprobante por email' }
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <span className="text-2xl">{step.icon}</span>
                      <span className="text-gray-700">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold text-amber-800">Consejo</p>
                    <p className="text-amber-700 text-sm">Guarda tu número de pedido <strong>#{orderId}</strong> para consultar su estado</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Volver al inicio
                </Link>
                <Link
                  href={`/orders/${orderId}`}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-semibold text-center flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Ver mi pedido
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <ProgressBar currentStep="payment" />
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Método de Pago</h1>
            <p className="text-gray-600">Selecciona cómo deseas realizar tu pago</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-r-xl mb-6 flex items-center gap-3 shadow-sm">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handlePaymentSubmit}>
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    Selecciona tu método de pago
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { value: 'efectivo', label: 'Efectivo', color: 'emerald', desc: 'Pago en tienda' },
                      { value: 'transferencia', label: 'Transferencia', color: 'blue', desc: 'BCP' },
                      { value: 'tarjeta', label: 'Tarjeta', color: 'orange', desc: 'Visa/MC' },
                      { value: 'yape', label: 'Yape', color: 'purple', desc: 'Pago rápido' },
                      { value: 'plin', label: 'Plin', color: 'green', desc: 'Pago móvil' },
                      { value: 'mercadopago', label: 'MercadoPago', color: 'blue', desc: 'Tarjetas y más' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className="font-bold">{method.label}</div>
                        <div className="text-xs text-gray-500">{method.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod !== 'efectivo' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      Datos para realizar el pago
                    </h2>
                    {paymentMethod === 'transferencia' && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        {/* Transferencia details */}
                        <p className="font-bold">BCP Soles</p>
                        <p>Cuenta: 191-1234567-0-00</p>
                        <p>CCI: 00219100123456700012</p>
                        <p>Titular: PERUANA INFORMATICA</p>
                      </div>
                    )}
                    {/* Simplified payment details for brevity in restoration, logic remains */}
                    {paymentMethod === 'yape' && <div className="p-4 bg-purple-50 text-purple-800 rounded">Yape: 987 654 321 - PERUANA INFORMATICA</div>}
                    {paymentMethod === 'plin' && <div className="p-4 bg-green-50 text-green-800 rounded">Plin: 987 654 321 - PERUANA INFORMATICA</div>}

                    {paymentMethod === 'tarjeta' && (
                      <div className="space-y-4">
                        <input type="text" placeholder="Número de Tarjeta" value={cardData.number} onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })} className="w-full border p-2 rounded" />
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="MM/YY" value={cardData.expiry} onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })} className="w-full border p-2 rounded" />
                          <input type="text" placeholder="CVV" value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <input type="text" placeholder="Titular" value={cardData.holder} onChange={e => setCardData({ ...cardData, holder: e.target.value })} className="w-full border p-2 rounded" />
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Comprobante</h2>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setInvoiceType('boleta')} className={`flex-1 p-4 border rounded ${invoiceType === 'boleta' ? 'border-blue-500 bg-blue-50' : ''}`}>Boleta</button>
                    <button type="button" onClick={() => setInvoiceType('factura')} className={`flex-1 p-4 border rounded ${invoiceType === 'factura' ? 'border-blue-500 bg-blue-50' : ''}`}>Factura</button>
                  </div>
                  {invoiceType === 'factura' && (
                    <div className="mt-4 space-y-4">
                      <input type="text" placeholder="RUC" value={invoiceData.ruc} onChange={e => setInvoiceData({ ...invoiceData, ruc: e.target.value })} className="w-full border p-2 rounded" />
                      <input type="text" placeholder="Razón Social" value={invoiceData.business_name} onChange={e => setInvoiceData({ ...invoiceData, business_name: e.target.value })} className="w-full border p-2 rounded" />
                      <input type="text" placeholder="Dirección Fiscal" value={invoiceData.tax_address} onChange={e => setInvoiceData({ ...invoiceData, tax_address: e.target.value })} className="w-full border p-2 rounded" />
                    </div>
                  )}
                </div>

                {paymentMethod !== 'efectivo' && paymentMethod !== 'tarjeta' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <label className="block mb-2 font-bold">Subir Comprobante</label>
                    <input type="file" onChange={e => setPaymentProof(e.target.files?.[0] || null)} className="w-full" />
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep('customer')} className="px-6 py-4 border rounded-xl">Atrás</button>
                  <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white rounded-xl py-4 font-bold">
                    {isLoading ? 'Procesando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              </form>
            </div>
            <div className="lg:col-span-1">
              {/* Summary Side - Simplified for recovery */}
              <div className="bg-white p-6 rounded shadow border">
                <h3 className="font-bold mb-4">Resumen</h3>
                <div className="flex justify-between mb-2"><span>Total</span><span>S/ {finalTotal.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <ProgressBar currentStep="customer" />
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Datos del Cliente</h1>
            {/* Auth Prompt */}
            {status === 'unauthenticated' && (
              <div className="bg-blue-50 p-4 rounded mb-6 flex justify-between items-center">
                <p>¿Ya tienes cuenta?</p>
                <button onClick={() => router.push('/account/login')} className="bg-blue-600 text-white px-4 py-2 rounded">Iniciar Sesión</button>
              </div>
            )}
          </div>

          <form onSubmit={handleCustomerSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold mb-2">Nombre Completo</label>
                <input type="text" required value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} className="w-full border p-3 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold mb-2">DNI / CE</label>
                <input type="text" required value={customerData.document} onChange={e => setCustomerData({ ...customerData, document: e.target.value })} className="w-full border p-3 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-2">Email</label>
              <input type="email" required value={customerData.email} onChange={e => setCustomerData({ ...customerData, email: e.target.value })} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block font-bold mb-2">Teléfono</label>
              <input type="tel" required value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} className="w-full border p-3 rounded-lg" />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep('cart')} className="flex-1 border p-4 rounded-xl font-bold">Volver</button>
              <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold">
                {checkoutMode === 'approval' ? 'Enviar Solicitud' : 'Continuar al Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Cart Step
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
                  <Image src={getProductImageUrl(item.product.image)} width={100} height={100} alt={item.product.name} className="object-cover rounded" />
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
                      onCouponApplied={(c) => setCoupon(c)}
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
                    onClick={() => setStep('customer')}
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
