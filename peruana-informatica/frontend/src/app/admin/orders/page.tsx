'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { API_CONFIG } from '@/config/api';
import { adminFetch } from '@/lib/adminApi';
import { ShoppingCart } from 'lucide-react';

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
  customer_phone: string;
  customer_document?: string;
  total_amount: string;
  status: 'pending' | 'pending_approval' | 'processed' | 'cancelled';
  payment_method?: string;
  payment_status: 'pending' | 'verified' | 'rejected';
  payment_proof?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  invoice_type: 'boleta' | 'factura';
  invoice_number?: string;
  invoice_file?: string;
  ruc?: string;
  business_name?: string;
  tax_address?: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await adminFetch('/admin/orders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Error al cargar pedidos');
      }

      // Asegurar que data sea un array
      setOrders(Array.isArray(data) ? data : (data?.orders || data?.data || []));
    } catch (error: any) {
      setError(error.message || 'Error al cargar pedidos');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApproveOrder = async (orderId: number) => {
    if (!confirm('¿Aprobar este pedido y permitir al cliente realizar el pago?')) return;
    try {
      const response = await adminFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'processed' })
      });
      if (response.ok) {
        fetchOrders();
      } else {
        alert('Error al aprobar pedido');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      const response = await adminFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (response.ok) {
        fetchOrders();
      } else {
        alert('Error al cancelar pedido');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleVerifyPayment = async (orderId: number, verified: boolean) => {
    try {
      const response = await adminFetch(`/admin/payments/${orderId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verified, verified_by: 'Admin' })
      });

      if (response.ok) {
        alert(verified ? 'Pago verificado correctamente' : 'Pago rechazado');
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert('Error al verificar pago');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleUploadInvoice = async (orderId: number) => {
    if (!invoiceNumber) {
      alert('Ingrese el número de comprobante');
      return;
    }

    if (!invoiceFile) {
      alert('Debe seleccionar un archivo PDF');
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('invoice_file', invoiceFile);
      formData.append('invoice_number', invoiceNumber);

      const response = await adminFetch(`/admin/payments/${orderId}/upload-invoice`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Comprobante cargado exitosamente');
        fetchOrders();
        setSelectedOrder(null);
        setInvoiceNumber('');
        setInvoiceFile(null);
      } else {
        alert(data.error || 'Error al cargar comprobante');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const inp = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
  const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <ShoppingCart className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No hay pedidos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Order header */}
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Pedido #{order.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString('es-PE')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status === 'pending_approval' ? 'pending' : order.status} label={{ pending: 'Pendiente', pending_approval: 'Por aprobar', processed: 'Aprobado', cancelled: 'Cancelado' }[order.status]} size="md" />
                    <StatusBadge status={order.payment_status} label={{ pending: 'Pago pendiente', verified: 'Pago verificado', rejected: 'Pago rechazado' }[order.payment_status]} size="md" />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Info grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer_name}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{order.customer_email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer_phone}</p>
                      {order.customer_document && <p className="text-sm text-gray-500 dark:text-gray-400">DNI: {order.customer_document}</p>}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pago</p>
                      {order.payment_method && <p className="text-sm text-gray-500 dark:text-gray-400">Método: <span className="font-medium text-gray-900 dark:text-white uppercase">{order.payment_method}</span></p>}
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">S/ {parseFloat(order.total_amount).toFixed(2)}</span></p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tipo: {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}</p>
                      {order.invoice_type === 'factura' && <><p className="text-sm text-gray-500 dark:text-gray-400">RUC: <span className="font-mono">{order.ruc}</span></p><p className="text-sm text-gray-500 dark:text-gray-400">{order.business_name}</p></>}
                      {order.invoice_number && <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">N° {order.invoice_number}</p>}
                    </div>
                  </div>

                  {/* Productos */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Productos</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-0">
                            <span className="text-gray-700 dark:text-gray-300">{item.product_name}</span>
                            <span className="text-gray-500 dark:text-gray-400 shrink-0 ml-4">
                              {item.quantity} × S/ {parseFloat(item.price).toFixed(2)} = <span className="font-semibold text-gray-900 dark:text-white">S/ {(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Paso 1: admin debe aprobar antes de que el cliente pueda pagar */}
                    {(order.status === 'pending_approval' || order.status === 'pending') && (
                      <>
                        <button onClick={() => handleApproveOrder(order.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Aprobar pedido
                        </button>
                        <button onClick={() => handleCancelOrder(order.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          Cancelar pedido
                        </button>
                      </>
                    )}
                    {/* Paso 2: pedido aprobado, esperando pago del cliente */}
                    {order.status === 'processed' && !order.payment_proof && order.payment_status !== 'verified' && (
                      <span className="px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl">Esperando comprobante del cliente</span>
                    )}
                    {/* Ver comprobante */}
                    {order.payment_proof && (
                      <a href={`${API_CONFIG.API_BASE_URL}/api/payments/proofs/${order.payment_proof}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 rounded-xl transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver comprobante
                      </a>
                    )}
                    {/* Paso 3: verificar pago */}
                    {order.payment_status === 'pending' && order.payment_proof && (
                      <>
                        <button onClick={() => handleVerifyPayment(order.id, true)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-xl transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Verificar pago
                        </button>
                        <button onClick={() => handleVerifyPayment(order.id, false)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          Rechazar pago
                        </button>
                      </>
                    )}
                    {/* Paso 4: cargar boleta/factura */}
                    {order.payment_status === 'verified' && !order.invoice_file && (
                      <button onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 rounded-xl transition-colors">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
                        Cargar {order.invoice_type === 'factura' ? 'factura' : 'boleta'}
                      </button>
                    )}
                    {order.invoice_file && (
                      <a href={`${API_CONFIG.API_BASE_URL}/api/admin/payments/invoices/${order.invoice_file}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Descargar {order.invoice_type === 'factura' ? 'factura' : 'boleta'} · N° {order.invoice_number}
                      </a>
                    )}
                    {order.payment_status === 'rejected' && (
                      <span className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl">Pago rechazado · Cliente debe enviar nuevo comprobante</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal cargar comprobante */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => { setSelectedOrder(null); setInvoiceNumber(''); setInvoiceFile(null); }}
        title={`Cargar ${selectedOrder?.invoice_type === 'factura' ? 'Factura' : 'Boleta'} — Pedido #${selectedOrder?.id}`}
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Número de comprobante *</label>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inp} placeholder={selectedOrder.invoice_type === 'factura' ? 'F001-00001' : 'B001-00001'} />
              <p className="text-xs text-gray-400 mt-1">Número del comprobante de tu sistema de ventas</p>
            </div>
            <div>
              <label className={lbl}>Archivo PDF *</label>
              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${invoiceFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'}`}>
                <input type="file" accept=".pdf" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} className="hidden" id="invoice-upload" />
                <label htmlFor="invoice-upload" className="cursor-pointer">
                  {invoiceFile ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{invoiceFile.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{(invoiceFile.size / 1024 / 1024).toFixed(2)} MB · Clic para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Seleccionar PDF</p>
                      <p className="text-xs text-gray-400 mt-1">Máx. 10 MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-semibold">{selectedOrder.customer_name}</p>
              <p className="text-xs mt-0.5">{selectedOrder.customer_email}</p>
              <p className="text-xs mt-1 text-blue-500 dark:text-blue-500">El PDF se enviará automáticamente al cliente</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setSelectedOrder(null); setInvoiceNumber(''); setInvoiceFile(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleUploadInvoice(selectedOrder.id)} disabled={isGeneratingInvoice || !invoiceFile || !invoiceNumber}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isGeneratingInvoice ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Cargando...</> : 'Cargar comprobante'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
