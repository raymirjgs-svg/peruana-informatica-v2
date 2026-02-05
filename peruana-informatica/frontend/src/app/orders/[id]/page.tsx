'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/client/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Pedido no encontrado');
      }

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

      if (!response.ok) {
        throw new Error('Comprobante no disponible');
      }

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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      processed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Procesado' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    };
    const defaultBadge = { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' };
    const badge = badges[status] ?? defaultBadge;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verificado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
    };
    const defaultBadge = { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' };
    const badge = badges[status] ?? defaultBadge;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Pedido #{order.id}</h1>
        <p className="text-gray-600">
          Realizado el {new Date(order.createdAt).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Estado del Pedido */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Estado del Pedido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado del Pedido</p>
            {getStatusBadge(order.status)}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado del Pago</p>
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </div>

        {order.payment_status === 'pending' && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⏳ En espera:</strong> Tu pago está siendo verificado. Recibirás un email cuando sea confirmado.
            </p>
          </div>
        )}

        {order.payment_status === 'verified' && !order.has_invoice && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>✓ Pago verificado:</strong> Tu comprobante está siendo generado. Lo recibirás por email pronto.
            </p>
          </div>
        )}

        {order.has_invoice && (
          <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-green-800 mb-3">
              <strong>✓ Comprobante disponible:</strong> Tu {order.invoice_type === 'factura' ? 'factura' : 'boleta'} está lista para descargar.
            </p>
            <button
              onClick={downloadInvoice}
              disabled={downloading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Descargando...
                </>
              ) : (
                <>
                  📄 Descargar {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}
                  {order.invoice_number && ` - ${order.invoice_number}`}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Información del Cliente */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nombre</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{order.customer_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Método de Pago</p>
            <p className="font-medium capitalize">{order.payment_method}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo de Comprobante</p>
            <p className="font-medium capitalize">{order.invoice_type}</p>
          </div>
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
                <p className="text-sm text-gray-600">
                  Subtotal: S/ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold">Total</p>
            <p className="text-2xl font-bold text-green-600">
              S/ {parseFloat(order.total_amount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
        <p className="text-sm text-blue-800">
          Si tienes alguna pregunta sobre tu pedido, contáctanos a{' '}
          <a href="mailto:ventas@peruanainformatica.com" className="underline font-medium">
            ventas@peruanainformatica.com
          </a>
          {' '}o llámanos al (01) 123-4567
        </p>
      </div>
    </div>
  );
}
