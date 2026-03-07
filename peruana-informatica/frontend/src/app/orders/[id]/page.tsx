'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type PaymentMethod = 'transferencia' | 'yape' | 'plin' | 'tarjeta' | 'efectivo';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  invoice_type: string;
  invoice_number?: string;
  invoice_file?: string;
  payment_proof?: string;
  has_invoice: boolean;
  items: OrderItem[];
  createdAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Culqi.js for card payments
  useEffect(() => {
    const culqiPk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
    if (!culqiPk || document.getElementById('culqi-js')) return;
    const script = document.createElement('script');
    script.id = 'culqi-js';
    script.src = 'https://js.culqi.com/culqijs-1.0.8.js';
    script.onload = () => {
      if (typeof (window as any).Culqi !== 'undefined') {
        (window as any).Culqi.setPublicKey(culqiPk);
      }
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/client/orders/${orderId}`);
      if (!response.ok) throw new Error('Pedido no encontrado');
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      setDownloading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/client/orders/${orderId}/invoice`);
      if (!response.ok) throw new Error('Comprobante no disponible');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order?.invoice_file || `comprobante-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar comprobante');
    } finally {
      setDownloading(false);
    }
  };

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPaymentError(null);

    if (paymentMethod !== 'efectivo' && paymentMethod !== 'tarjeta' && !proofFile) {
      setPaymentError('Debes subir el comprobante de pago');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      if (paymentMethod === 'tarjeta') {
        const culqiPk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
        if (!culqiPk) { setPaymentError('Pago con tarjeta no habilitado'); setSubmitting(false); return; }
        const CulqiSDK = (window as any).Culqi;
        if (!CulqiSDK) { setPaymentError('Error al cargar la pasarela. Recargue la página.'); setSubmitting(false); return; }

        const cleanCard = cardData.number.replace(/\s/g, '');
        const [expMonth, expYear] = cardData.expiry.split('/');
        const culqiToken = await new Promise<string>((resolve, reject) => {
          CulqiSDK.createToken(
            { card_number: cleanCard, cvv: cardData.cvv, expiration_month: expMonth, expiration_year: `20${expYear}`, email: order.customer_email },
            (token: any) => {
              if (token.object === 'error') reject(new Error(token.user_message || 'Error al validar la tarjeta'));
              else resolve(token.id);
            }
          );
        });

        const res = await fetch(`${apiUrl}/api/payments/culqi/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, culqiToken, email: order.customer_email, invoiceType: order.invoice_type })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar el pago con tarjeta');
        setPaymentDone(true);
        fetchOrder();
        return;
      }

      const formData = new FormData();
      formData.append('payment_method', paymentMethod);
      if (proofFile) formData.append('payment_proof', proofFile);

      const res = await fetch(`${apiUrl}/api/payments/${order.id}/upload-proof`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el comprobante');
      setPaymentDone(true);
      fetchOrder();
    } catch (err: any) {
      setPaymentError(err.message || 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['bg-yellow-100 text-yellow-800', 'Pendiente'],
      pending_approval: ['bg-orange-100 text-orange-800', 'En revisión'],
      processed: ['bg-green-100 text-green-800', 'Aprobado'],
      cancelled: ['bg-red-100 text-red-800', 'Cancelado'],
    };
    const [cls, label] = map[status] ?? ['bg-yellow-100 text-yellow-800', 'Pendiente'];
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>{label}</span>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['bg-yellow-100 text-yellow-800', 'Pendiente'],
      verified: ['bg-green-100 text-green-800', 'Verificado'],
      rejected: ['bg-red-100 text-red-800', 'Rechazado'],
    };
    const [cls, label] = map[status] ?? ['bg-yellow-100 text-yellow-800', 'Pendiente'];
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando información del pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pedido no encontrado</h1>
        <p className="text-gray-600 mb-8">{error || 'No se pudo cargar la información del pedido'}</p>
        <Link href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const showPaymentForm = order.status === 'processed' && order.payment_status === 'pending' && !order.payment_proof && !paymentDone;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-800">Pedido #{order.id}</h1>
        <p className="text-gray-600">
          Realizado el {new Date(order.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Estado */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Estado del Pedido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado del Pedido</p>
            {getStatusBadge(order.status)}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado del Pago</p>
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </div>

        {/* En revisión */}
        {order.status === 'pending_approval' && (
          <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
            <p className="text-sm text-orange-800"><strong>🔍 En revisión:</strong> Tu pedido está siendo revisado. En breve recibirás confirmación para proceder con el pago.</p>
          </div>
        )}

        {/* Comprobante enviado, esperando verificación */}
        {((order.payment_proof && order.payment_status === 'pending') || paymentDone) && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-800"><strong>⏳ Comprobante recibido:</strong> Estamos verificando tu pago. Recibirás confirmación por email en breve.</p>
          </div>
        )}

        {/* Pago verificado */}
        {order.payment_status === 'verified' && !order.has_invoice && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800"><strong>✓ Pago verificado:</strong> Tu comprobante está siendo generado. Lo recibirás por email pronto.</p>
          </div>
        )}

        {/* Descargar comprobante */}
        {order.has_invoice && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-green-800 mb-3"><strong>✓ Comprobante disponible:</strong> Tu {order.invoice_type === 'factura' ? 'factura' : 'boleta'} está lista.</p>
            <button onClick={downloadInvoice} disabled={downloading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2">
              {downloading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Descargando...</> : <>📄 Descargar {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}{order.invoice_number && ` - ${order.invoice_number}`}</>}
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN DE PAGO — solo cuando el pedido está aprobado y sin pago */}
      {showPaymentForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="mb-5 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-green-800 font-semibold">✅ ¡Pedido aprobado! Selecciona cómo quieres pagar S/ {parseFloat(order.total_amount).toFixed(2)}</p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Selector de método */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Método de pago</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {([
                  { value: 'transferencia', label: 'Transferencia', desc: 'BCP / IBK' },
                  { value: 'yape', label: 'Yape', desc: 'Pago rápido' },
                  { value: 'plin', label: 'Plin', desc: 'Pago móvil' },
                  { value: 'tarjeta', label: 'Tarjeta', desc: 'Visa / MC' },
                  { value: 'efectivo', label: 'Efectivo', desc: 'En tienda' },
                ] as { value: PaymentMethod; label: string; desc: string }[]).map((m) => (
                  <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === m.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-bold text-sm text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Instrucciones por método */}
            {paymentMethod === 'transferencia' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <p className="font-semibold text-blue-900 mb-3">📋 Datos para transferencia bancaria</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="space-y-1">
                    <p className="font-semibold">BCP Soles</p>
                    <p>Cuenta: <span className="font-mono">191-1234567-0-00</span></p>
                    <p>CCI: <span className="font-mono">00219100123456700012</span></p>
                    <p>Titular: PERUANA INFORMATICA SAC</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Interbank Soles</p>
                    <p>Cuenta: <span className="font-mono">200-300456789-0</span></p>
                    <p>CCI: <span className="font-mono">00320000030045678900</span></p>
                    <p>Titular: PERUANA INFORMATICA SAC</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-blue-700 flex gap-6">
                  <span>Monto: <strong>S/ {parseFloat(order.total_amount).toFixed(2)}</strong></span>
                  <span>Referencia: <strong>Pedido #{order.id}</strong></span>
                </div>
              </div>
            )}

            {paymentMethod === 'yape' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                <p className="font-semibold text-purple-900 mb-2">📱 Datos para Yape</p>
                <p className="text-purple-800 text-sm">Número: <strong className="font-mono">987 654 321</strong></p>
                <p className="text-purple-800 text-sm">Nombre: <strong>PERUANA INFORMATICA SAC</strong></p>
                <p className="text-purple-700 text-sm mt-2">Monto exacto: <strong>S/ {parseFloat(order.total_amount).toFixed(2)}</strong> · Referencia: <strong>#{order.id}</strong></p>
              </div>
            )}

            {paymentMethod === 'plin' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="font-semibold text-green-900 mb-2">📱 Datos para Plin</p>
                <p className="text-green-800 text-sm">Número: <strong className="font-mono">987 654 321</strong></p>
                <p className="text-green-800 text-sm">Nombre: <strong>PERUANA INFORMATICA SAC</strong></p>
                <p className="text-green-700 text-sm mt-2">Monto exacto: <strong>S/ {parseFloat(order.total_amount).toFixed(2)}</strong> · Referencia: <strong>#{order.id}</strong></p>
              </div>
            )}

            {paymentMethod === 'efectivo' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <p className="font-semibold text-emerald-900 mb-2">💵 Pago en tienda</p>
                <p className="text-emerald-800 text-sm">Acércate a nuestra tienda con el <strong>número de pedido #{order.id}</strong> y realiza el pago en efectivo por <strong>S/ {parseFloat(order.total_amount).toFixed(2)}</strong>.</p>
                <p className="text-emerald-700 text-sm mt-1">Dirección: Av. Ejemplo 123, Lima · Horario: Lun–Sáb 9am–7pm</p>
              </div>
            )}

            {paymentMethod === 'tarjeta' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-orange-900">💳 Datos de tarjeta (Visa / Mastercard)</p>
                <input type="text" placeholder="Número de tarjeta" value={cardData.number}
                  onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                  maxLength={19}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM/YY" value={cardData.expiry}
                    onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                    maxLength={5}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" placeholder="CVV" value={cardData.cvv}
                    onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    maxLength={4}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <input type="text" placeholder="Nombre del titular" value={cardData.holder}
                  onChange={e => setCardData({ ...cardData, holder: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            )}

            {/* Upload comprobante (no tarjeta, no efectivo) */}
            {paymentMethod !== 'tarjeta' && paymentMethod !== 'efectivo' && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📎 Sube el comprobante de pago</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={e => setProofFile(e.target.files?.[0] || null)} className="hidden" id="proof-upload" />
                <label htmlFor="proof-upload"
                  className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${proofFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                  {proofFile
                    ? <span className="text-sm font-semibold text-green-700">{proofFile.name} — {(proofFile.size / 1024).toFixed(0)} KB · Clic para cambiar</span>
                    : <span className="text-sm text-gray-500">Clic para seleccionar imagen o PDF (JPG, PNG, PDF · máx. 5 MB)</span>
                  }
                </label>
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{paymentError}</div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Procesando...</>
                : paymentMethod === 'tarjeta' ? '💳 Pagar con tarjeta'
                : paymentMethod === 'efectivo' ? '✅ Confirmar pedido (pago en tienda)'
                : '📤 Enviar comprobante'}
            </button>
          </form>
        </div>
      )}

      {/* Info del cliente */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-600">Nombre</p><p className="font-medium">{order.customer_name}</p></div>
          <div><p className="text-sm text-gray-600">Email</p><p className="font-medium">{order.customer_email}</p></div>
          <div><p className="text-sm text-gray-600">Método de Pago</p><p className="font-medium capitalize">{order.payment_method || '—'}</p></div>
          <div><p className="text-sm text-gray-600">Tipo de Comprobante</p><p className="font-medium capitalize">{order.invoice_type}</p></div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">S/ {parseFloat(item.price).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Subtotal: S/ {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
          <p className="text-xl font-bold">Total</p>
          <p className="text-2xl font-bold text-green-600">S/ {parseFloat(order.total_amount).toFixed(2)}</p>
        </div>
      </div>

      {/* Ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
        <p className="text-sm text-blue-800">
          Contáctanos a{' '}
          <a href="mailto:ventas@peruanainformatica.com" className="underline font-medium">ventas@peruanainformatica.com</a>
          {' '}o llámanos al (01) 123-4567
        </p>
      </div>
    </div>
  );
}
