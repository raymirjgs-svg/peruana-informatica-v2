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

  // Helper para imágenes
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return 'https://placehold.co/100x100?text=Sin+Imagen';
    if (imagePath.startsWith('http')) return imagePath;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}/images/products/${imagePath}`;
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
        }))
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
        setOrderTotal(totalPrice); // Guardar el total antes de vaciar

        // Si el estado es pendiente de aprobación, vamos directo a éxito
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

    // Validación según método de pago
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

      // Agregar comprobante si existe
      if (paymentProof) {
        formData.append('payment_proof', paymentProof);
      }

      // Agregar datos de tarjeta (solo últimos 4 dígitos por seguridad PCI)
      if (paymentMethod === 'tarjeta') {
        const cleanCardNumber = cardData.number.replace(/\s/g, '');
        formData.append('card_last_four', cleanCardNumber.slice(-4));
        formData.append('card_type', getCardType(cardData.number) || 'unknown');
        formData.append('card_holder', cardData.holder);
      }

      // Agregar datos de factura
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

          {/* Tarjeta principal de éxito */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header con animación */}
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

            {/* Número de pedido destacado */}
            <div className="px-8 -mt-6 relative z-10">
              <div className={`rounded-2xl p-6 text-center shadow-lg ${checkoutMode === 'approval' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                <p className="text-white/80 text-sm uppercase tracking-wide mb-1">Número de Pedido</p>
                <p className="text-4xl font-bold text-white">#{orderId}</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">
              {/* Email de confirmación */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmación enviada a:</p>
                  <p className="font-semibold text-blue-600">{customerData.email}</p>
                </div>
              </div>

              {/* Próximos pasos */}
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

              {/* Tip */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold text-amber-800">Consejo</p>
                    <p className="text-amber-700 text-sm">Guarda tu número de pedido <strong>#{orderId}</strong> para consultar su estado</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
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

          {/* Header */}
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
            {/* Columna principal - Formulario */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handlePaymentSubmit}>
                {/* Métodos de Pago Mejorados */}
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
                          ? method.value === 'efectivo'
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg ring-2 ring-emerald-200'
                            : method.value === 'transferencia'
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200'
                              : method.value === 'tarjeta'
                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg ring-2 ring-orange-200'
                                : method.value === 'yape'
                                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg ring-2 ring-purple-200'
                                  : method.value === 'mercadopago'
                                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200'
                                    : 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg ring-2 ring-green-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        {paymentMethod === method.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`mb-2 ${paymentMethod === method.value
                          ? method.value === 'efectivo'
                            ? 'text-emerald-600'
                            : method.value === 'transferencia'
                              ? 'text-blue-600'
                              : method.value === 'tarjeta'
                                ? 'text-orange-600'
                                : method.value === 'yape'
                                  ? 'text-purple-600'
                                  : method.value === 'mercadopago'
                                    ? 'text-blue-600'
                                    : 'text-green-600'
                          : 'text-gray-600'
                          }`}>
                          {PaymentIcons[method.value as keyof typeof PaymentIcons]}
                        </div>
                        <div className={`font-semibold text-sm ${paymentMethod === method.value
                          ? method.value === 'efectivo'
                            ? 'text-emerald-700'
                            : method.value === 'transferencia'
                              ? 'text-blue-700'
                              : method.value === 'tarjeta'
                                ? 'text-orange-700'
                                : method.value === 'yape'
                                  ? 'text-purple-700'
                                  : method.value === 'mercadopago'
                                    ? 'text-blue-700'
                                    : 'text-green-700'
                          : 'text-gray-700'
                          }`}>
                          {method.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{method.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Información de Pago según método - Mejorada */}
                {paymentMethod !== 'efectivo' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      Datos para realizar el pago
                    </h2>

                    {paymentMethod === 'transferencia' && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            {PaymentIcons.transferencia}
                          </div>
                          <div>
                            <h3 className="font-bold text-blue-900">Transferencia Bancaria</h3>
                            <p className="text-sm text-blue-600">Banco de Crédito del Perú</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Cuenta Corriente</p>
                            <p className="font-mono font-bold text-lg text-gray-800">191-1234567-0-00</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">CCI</p>
                            <p className="font-mono font-bold text-lg text-gray-800">00219100123456700012</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Titular</p>
                            <p className="font-bold text-gray-800">PERUANA INFORMATICA</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">RUC</p>
                            <p className="font-mono font-bold text-gray-800">20123456789</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'yape' && (
                      <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                            {PaymentIcons.yape}
                          </div>
                          <div>
                            <h3 className="font-bold text-purple-900">Yape</h3>
                            <p className="text-sm text-purple-600">Pago móvil rápido</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-purple-100 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Número de Yape</p>
                          <p className="font-mono font-bold text-3xl text-purple-600">987 654 321</p>
                          <p className="mt-2 text-gray-600">Titular: <strong>PERUANA INFORMATICA</strong></p>
                        </div>
                        <p className="text-xs text-purple-700 mt-4 text-center">📱 Envía el pago y sube tu captura de pantalla</p>
                      </div>
                    )}

                    {paymentMethod === 'plin' && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white">
                            {PaymentIcons.plin}
                          </div>
                          <div>
                            <h3 className="font-bold text-green-900">Plin</h3>
                            <p className="text-sm text-green-600">Pago móvil interbancario</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-green-100 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Número de Plin</p>
                          <p className="font-mono font-bold text-3xl text-green-600">987 654 321</p>
                          <p className="mt-2 text-gray-600">Titular: <strong>PERUANA INFORMATICA</strong></p>
                        </div>
                        <p className="text-xs text-green-700 mt-4 text-center">💸 Envía el pago y sube tu captura de pantalla</p>
                      </div>
                    )}

                    {paymentMethod === 'tarjeta' && (
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white">
                            {PaymentIcons.tarjeta}
                          </div>
                          <div>
                            <h3 className="font-bold text-orange-900">Tarjeta de Crédito/Débito</h3>
                            <p className="text-sm text-orange-600">Ingresa los datos de tu tarjeta</p>
                          </div>
                        </div>

                        {/* Formulario de Tarjeta */}
                        <div className="bg-white rounded-xl p-6 border border-orange-100 space-y-4">
                          {/* Tarjetas aceptadas */}
                          <div className="flex items-center justify-center gap-3 pb-4 border-b border-gray-100">
                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${getCardType(cardData.number) === 'visa' ? 'bg-blue-600 text-white scale-110' : 'bg-gray-100 text-blue-800'}`}>
                              VISA
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${getCardType(cardData.number) === 'mastercard' ? 'bg-red-500 text-white scale-110' : 'bg-gray-100 text-red-600'}`}>
                              Mastercard
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${getCardType(cardData.number) === 'amex' ? 'bg-blue-500 text-white scale-110' : 'bg-gray-100 text-blue-600'}`}>
                              AMEX
                            </div>
                          </div>

                          {/* Número de tarjeta */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Número de Tarjeta *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                maxLength={19}
                                value={cardData.number}
                                onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-lg tracking-wider"
                                placeholder="1234 5678 9012 3456"
                              />
                              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Nombre del titular */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Nombre del Titular *
                            </label>
                            <input
                              type="text"
                              required
                              value={cardData.holder}
                              onChange={(e) => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all uppercase"
                              placeholder="JUAN PÉREZ"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tal como aparece en la tarjeta</p>
                          </div>

                          {/* Fecha y CVV */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Fecha de Expiración *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={5}
                                value={cardData.expiry}
                                onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-center text-lg"
                                placeholder="MM/YY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                CVV *
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  required
                                  maxLength={4}
                                  value={cardData.cvv}
                                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-center text-lg tracking-widest"
                                  placeholder="•••"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">3 o 4 dígitos</p>
                            </div>
                          </div>

                          {/* Seguridad */}
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-600">Tus datos están protegidos con encriptación SSL</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pago en efectivo */}
                {paymentMethod === 'efectivo' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                          {PaymentIcons.efectivo}
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-900">Pago en Efectivo</h3>
                          <p className="text-sm text-emerald-600">Paga al momento de recoger</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-6 border border-emerald-100">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-gray-700 font-medium mb-2">Pagarás al recoger tu pedido en nuestra tienda.</p>
                            <p className="text-sm text-gray-600">No es necesario subir un comprobante de pago.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipo de Comprobante Mejorado */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Tipo de Comprobante
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'boleta', label: 'Boleta', icon: '🧾', desc: 'Para personas naturales', color: 'blue' },
                      { value: 'factura', label: 'Factura', icon: '📋', desc: 'Para empresas con RUC', color: 'indigo' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setInvoiceType(type.value as InvoiceType)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${invoiceType === type.value
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                      >
                        {invoiceType === type.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <span className="text-3xl">{type.icon}</span>
                        <div className="mt-2">
                          <div className="font-bold text-gray-800">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Datos de Factura Mejorados */}
                {invoiceType === 'factura' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </span>
                      Datos de Facturación
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">RUC *</label>
                        <input
                          type="text"
                          required
                          maxLength={11}
                          value={invoiceData.ruc}
                          onChange={(e) => setInvoiceData({ ...invoiceData, ruc: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="20123456789"
                        />
                        <p className="text-xs text-gray-500 mt-1">Debe ser un RUC válido de 11 dígitos</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Razón Social *</label>
                          <input
                            type="text"
                            required
                            value={invoiceData.business_name}
                            onChange={(e) => setInvoiceData({ ...invoiceData, business_name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="MI EMPRESA S.A.C."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Fiscal *</label>
                          <input
                            type="text"
                            required
                            value={invoiceData.tax_address}
                            onChange={(e) => setInvoiceData({ ...invoiceData, tax_address: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Av. Principal 123, Lima"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload de Comprobante Mejorado - Solo para transferencia, yape y plin */}
                {paymentMethod !== 'efectivo' && paymentMethod !== 'tarjeta' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </span>
                      Comprobante de Pago
                    </h2>

                    <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${paymentProof
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                        className="hidden"
                        id="payment-proof"
                        required
                      />
                      <label htmlFor="payment-proof" className="cursor-pointer w-full h-full block">
                        {paymentProof ? (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-green-700 font-bold text-lg">{paymentProof.name}</p>
                              <p className="text-sm text-green-600">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB</p>
                              <p className="text-xs text-green-600 mt-2 underline">Clic para cambiar archivo</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold">Arrastra tu archivo aquí</p>
                              <p className="text-gray-500 text-sm">o haz clic para buscar</p>
                              <p className="text-xs text-gray-400 mt-2">JPG, PNG o PDF (máx. 5MB)</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('customer')}
                    className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (paymentMethod !== 'efectivo' && paymentMethod !== 'tarjeta' && !paymentProof) || (paymentMethod === 'tarjeta' && (!cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv))}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmar Pedido
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Columna lateral - Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Resumen
                </h3>

                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cliente</span>
                    <span className="font-medium text-gray-800">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Método</span>
                    <span className="font-medium text-gray-800 capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Comprobante</span>
                    <span className="font-medium text-gray-800 capitalize">{invoiceType}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-center text-white">
                  <p className="text-green-100 text-xs uppercase tracking-wide">Total a Pagar</p>
                  <p className="text-3xl font-bold mt-1">S/ {orderTotal.toFixed(2)}</p>
                  <p className="text-green-200 text-xs mt-1">IGV incluido</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Transacción segura</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Listo para sistema POS</span>
                  </div>
                </div>
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

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Datos del Cliente</h1>
            <p className="text-gray-600">Completa tu información para continuar</p>
          </div>

          {/* Auth Integration */}
          {status === 'unauthenticated' ? (
            <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg mb-1">¿Ya tienes una cuenta?</h3>
                  <p className="text-sm text-gray-600">Inicia sesión para autocompletar tus datos y agilizar tu compra.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => router.push('/account/login?callbackUrl=/cart')}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/account/register?callbackUrl=/cart')}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Registrarse
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-green-100 shadow-sm rounded-2xl p-4 mb-8 flex items-center gap-4 animate-fade-in-up">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl ring-4 ring-green-50">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Conectado como</p>
                <p className="font-bold text-green-900 text-lg">{session?.user?.email}</p>
                {session?.user?.name && <p className="text-sm text-gray-600">{session.user.name}</p>}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-r-xl mb-6 flex items-center gap-3 shadow-sm">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCustomerSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header del formulario */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información Personal
              </h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Nombre y Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                    placeholder="Juan Pérez García"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </span>
                    DNI / Carnet de Extranjería
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={customerData.document}
                    onChange={(e) => setCustomerData({ ...customerData, document: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                    placeholder="12345678"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                  placeholder="juan@ejemplo.com"
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Enviaremos tu comprobante y confirmación a este correo</span>
                </div>
              </div>

              {/* Teléfono */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+51</span>
                  <input
                    type="tel"
                    required
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                    placeholder="987 654 321"
                  />
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Tus datos están seguros</h3>
                    <p className="text-sm text-blue-700 mt-1">Utilizamos tu información solo para procesar tu pedido y enviarte tu comprobante.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Carrito
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    {checkoutMode === 'approval' ? 'Enviar Solicitud' : 'Continuar al Pago'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Vista del carrito (paso inicial)
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            {/* Ilustración del carrito vacío */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h1>
            <p className="text-gray-500 mb-8 text-lg">¡Explora nuestro catálogo y encuentra los mejores productos!</p>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Explorar Productos
            </Link>

            {/* Beneficios */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg mx-auto flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Compra Segura</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg mx-auto flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Múltiples Pagos</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg mx-auto flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Soporte 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <ProgressBar currentStep="cart" />

        {/* Header mejorado */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center lg:justify-start gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            Carrito de Compras
          </h1>
          <p className="text-gray-600">Revisa tus productos antes de continuar con el pago</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Productos - Diseño mejorado */}
          <div className="lg:col-span-2 space-y-4">
            {/* Contador de productos */}
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
              <span className="text-gray-600 font-medium">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu carrito
              </span>
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Vaciar carrito
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={item.product.id}
                className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                  {/* Imagen mejorada */}
                  <div className="w-full sm:w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex-shrink-0 border border-gray-200 overflow-hidden group relative">
                    <Image
                      src={getImageUrl(item.product.image)}
                      alt={item.product.name}
                      width={144}
                      height={144}
                      className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/144x144?text=Sin+Imagen';
                      }}
                    />
                    {/* Badge de cantidad en móvil */}
                    <div className="sm:hidden absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      x{item.quantity}
                    </div>
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {item.product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          S/ {Number(item.product.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">c/u</span>
                      </div>
                    </div>

                    {/* Controles de cantidad mejorados */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 shadow-sm font-bold text-xl border border-gray-200"
                          aria-label="Disminuir cantidad"
                        >
                          −
                        </button>
                        <span className="w-14 text-center font-bold text-lg text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-green-50 hover:text-green-600 transition-all duration-200 shadow-sm font-bold text-xl border border-gray-200"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal y eliminar */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            S/ {(Number(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                          aria-label="Eliminar producto"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón para seguir comprando */}
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 py-4 text-blue-600 hover:text-blue-800 font-semibold transition-colors bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:bg-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Seguir comprando
            </Link>
          </div>

          {/* Resumen mejorado */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden sticky top-4 border border-gray-100">
              {/* Header del resumen */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Resumen del Pedido
                </h2>
              </div>

              <div className="p-6">
                {/* Lista de productos resumida */}
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600 truncate flex-1 mr-2">{item.product.name}</span>
                      <span className="text-gray-400 text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Productos</span>
                    <span className="font-semibold text-gray-800">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      S/ {items.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Total destacado */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100 font-medium">Total a Pagar</span>
                    <span className="text-3xl font-bold text-white">
                      S/ {items.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-green-200 text-xs text-center mt-2">Precio incluye IGV</p>
                </div>

                {/* Botón de acción */}
                <button
                  onClick={() => setStep('customer')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Continuar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                {/* Información adicional */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Compra 100% segura</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    <span>Múltiples métodos de pago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                    </svg>
                    <span>Listo para POS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
