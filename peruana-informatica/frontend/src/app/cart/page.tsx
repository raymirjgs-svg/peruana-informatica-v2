'use client';

import { useCart } from '@/hooks/useCart';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Coupon } from '@/services/CouponService';
import { PaymentMethod, InvoiceType, CustomerData, InvoiceData, CardData } from './types';
import { getCardType } from './helpers';
import { SuccessStep } from './SuccessStep';
import { PaymentStep } from './PaymentStep';
import { CustomerStep } from './CustomerStep';
import { CartStep } from './CartStep';
import apiClient from '@/utils/api';

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'cart' | 'customer' | 'payment' | 'success'>('cart');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [checkoutMode, setCheckoutMode] = useState<'direct' | 'approval'>('direct');

  // Coupon State
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Fetch Checkout Mode
  useEffect(() => {
    const fetchCheckoutMode = async () => {
      try {
        const data = await apiClient.request<{ mode: 'direct' | 'approval' }>('/api/settings/checkout-mode');
        setCheckoutMode(data.mode);
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
  const [customerData, setCustomerData] = useState<CustomerData>({
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
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    ruc: '',
    business_name: '',
    tax_address: ''
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  // Datos de tarjeta
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

      const data = await apiClient.request<{ order_id: number; tracking_code?: string | null; status?: string }>('/api/orders', {
        method: 'POST',
        body: payload
      });

      setOrderId(data.order_id);
      setTrackingCode(data.tracking_code ?? null);
      setOrderTotal(finalTotal);

      if (data.status === 'pending_approval' || checkoutMode === 'approval') {
        setStep('success');
      } else {
        setStep('payment');
      }
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Por favor intente de nuevo.');
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

    try {
      const formData = new FormData();
      formData.append('payment_method', paymentMethod);
      formData.append('invoice_type', invoiceType);

      if (trackingCode) {
        formData.append('tracking_code', trackingCode);
      }

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

      await apiClient.request(`/api/payments/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData
      });

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Por favor intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <SuccessStep
        checkoutMode={checkoutMode}
        trackingCode={trackingCode}
        orderId={orderId}
        customerEmail={customerData.email}
        invoiceType={invoiceType}
      />
    );
  }

  if (step === 'payment') {
    return (
      <PaymentStep
        error={error}
        onSubmit={handlePaymentSubmit}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        cardData={cardData}
        onCardDataChange={setCardData}
        invoiceType={invoiceType}
        onInvoiceTypeChange={setInvoiceType}
        invoiceData={invoiceData}
        onInvoiceDataChange={setInvoiceData}
        paymentProof={paymentProof}
        onPaymentProofChange={setPaymentProof}
        isLoading={isLoading}
        finalTotal={finalTotal}
        onBack={() => setStep('customer')}
      />
    );
  }

  if (step === 'customer') {
    return (
      <CustomerStep
        status={status}
        onSubmit={handleCustomerSubmit}
        onLogin={() => router.push('/account/login')}
        onBack={() => setStep('cart')}
        customerData={customerData}
        onCustomerDataChange={setCustomerData}
        isLoading={isLoading}
        checkoutMode={checkoutMode}
      />
    );
  }

  return (
    <CartStep
      items={items}
      updateQuantity={updateQuantity}
      removeItem={removeItem}
      totalPrice={totalPrice}
      discountAmount={discountAmount}
      finalTotal={finalTotal}
      coupon={coupon}
      onCouponApplied={setCoupon}
      onContinue={() => setStep('customer')}
    />
  );
}
