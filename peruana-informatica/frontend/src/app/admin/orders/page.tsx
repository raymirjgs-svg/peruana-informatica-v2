'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { API_CONFIG } from '@/config/api';
import { adminFetch } from '@/lib/adminApi';
import { ShoppingCart, Search, Eye, FileText, Check, X, MessageCircle, Download } from 'lucide-react';

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
  tracking_code?: string;
  invoice_number?: string;
  invoice_file?: string;
  ruc?: string;
  business_name?: string;
  tax_address?: string;
  createdAt: string;
  items?: OrderItem[];
}

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Pendiente',
  pending_approval: 'Por aprobar',
  processed: 'Aprobado',
  cancelled: 'Cancelado',
};

const PAYMENT_LABEL: Record<Order['payment_status'], string> = {
  pending: 'Pago pendiente',
  verified: 'Pago verificado',
  rejected: 'Pago rechazado',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingInvoiceOrder, setPendingInvoiceOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    try {
      const response = await adminFetch('/admin/orders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Error al cargar pedidos');
      }

      setOrders(Array.isArray(data) ? data : (data?.orders || data?.data || []));
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter && o.payment_status !== paymentFilter) return false;
      if (!q) return true;
      return [
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.tracking_code,
        o.invoice_number,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter]);

  const refresh = () => fetchOrders();

  const handleApproveOrder = async (orderId: number) => {
    if (!confirm('¿Aprobar este pedido y permitir al cliente realizar el pago?')) return;
    try {
      const response = await adminFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'processed' })
      });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        refresh();
        // El email automatico depende de que SMTP este operativo; por eso se
        // muestra el enlace para compartirlo con el cliente.
        if (data?.tracking_url) {
          setShareLink(data.tracking_url);
        }
      } else {
        alert('Error al aprobar pedido');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const buildWhatsAppLink = (order: Order) => {
    const phone = (order.customer_phone || '').replace(/\D/g, '');
    const code = order.tracking_code || '';
    const message = `Hola ${order.customer_name || ''}, tu pedido de Peruana Informatica fue aprobado. `
      + `Puedes ver el estado y completar el pago aqui: ${code ? `https://peruanadeinformatica.com.pe/seguimiento/${code}` : 'https://peruanadeinformatica.com.pe/track-order'}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      const response = await adminFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (response.ok) {
        refresh();
        setSelectedOrder(null);
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
        refresh();
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
        refresh();
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
        <PageHeader
          title="Pedidos"
          description={`${orders.length} pedido${orders.length !== 1 ? 's' : ''} registrado${orders.length !== 1 ? 's' : ''}`}
          icon={ShoppingCart}
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {shareLink && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">Pedido aprobado. Comparte este enlace con el cliente para que pueda pagar:</p>
              <div className="flex items-center gap-2">
                <input readOnly value={shareLink} className="flex-1 min-w-[260px] rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-mono dark:bg-gray-800" onFocus={(e) => e.currentTarget.select()} />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(shareLink); }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Copiar
                </button>
                <button type="button" onClick={() => setShareLink(null)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por N° de pedido, cliente, email, telefono o codigo de seguimiento..."
                className={`${inp} pl-10`}
              />
            </div>
            <div className="flex gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inp} aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="pending_approval">Por aprobar</option>
                <option value="processed">Aprobado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={inp} aria-label="Filtrar por pago">
                <option value="">Todos los pagos</option>
                <option value="pending">Pago pendiente</option>
                <option value="verified">Pago verificado</option>
                <option value="rejected">Pago rechazado</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span>
              {filtered.length !== orders.length && <> de {orders.length}</>} pedidos
            </span>
            {(search || statusFilter || paymentFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <ShoppingCart className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No hay pedidos registrados</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Search className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Ningun pedido coincide con los filtros</p>
          </div>
        ) : (
          <>
            {/* Tabla */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Pago</th>
                      <th className="px-4 py-3 text-right text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">#{order.id}</p>
                          {order.tracking_code && (
                            <p className="text-xs font-mono text-gray-400">{order.tracking_code}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[220px]">{order.customer_name}</p>
                          <p className="text-xs dark:text-gray-400 truncate max-w-[220px]">{order.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                          S/ {parseFloat(order.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status === 'pending_approval' ? 'pending' : order.status} label={STATUS_LABEL[order.status]} size="md" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.payment_status} label={PAYMENT_LABEL[order.payment_status]} size="md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              title="Ver detalle"
                              className="p-2 rounded-lg dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {(order.status === 'pending_approval' || order.status === 'pending') && (
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                title="Aprobar pedido"
                                className="p-2 rounded-lg dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {(order.status === 'pending_approval' || order.status === 'pending') && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                title="Cancelar pedido"
                                className="p-2 rounded-lg dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              onPageChange={setPage}
              itemLabel="pedidos"
            />
          </>
        )}
      </div>

      {/* Detalle del pedido */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Pedido #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedOrder.status === 'pending_approval' ? 'pending' : selectedOrder.status} label={STATUS_LABEL[selectedOrder.status]} size="md" />
              <StatusBadge status={selectedOrder.payment_status} label={PAYMENT_LABEL[selectedOrder.payment_status]} size="md" />
              {selectedOrder.tracking_code && (
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{selectedOrder.tracking_code}</span>
              )}
              <span className="ml-auto text-xs text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString('es-PE')}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-medium dark:text-gray-400 mb-2">Cliente</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedOrder.customer_name}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 break-all">{selectedOrder.customer_email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.customer_phone}</p>
                {selectedOrder.customer_document && <p className="text-sm text-gray-500 dark:text-gray-400">DNI: {selectedOrder.customer_document}</p>}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-medium dark:text-gray-400 mb-2">Pago</p>
                {selectedOrder.payment_method && <p className="text-sm text-gray-500 dark:text-gray-400">Metodo: <span className="font-medium text-gray-900 dark:text-white uppercase">{selectedOrder.payment_method}</span></p>}
                <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-bold text-gray-900 dark:text-white">S/ {parseFloat(selectedOrder.total_amount).toFixed(2)}</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tipo: {selectedOrder.invoice_type === 'factura' ? 'Factura' : 'Boleta'}</p>
                {selectedOrder.invoice_type === 'factura' && <><p className="text-sm text-gray-500 dark:text-gray-400">RUC: <span className="font-mono">{selectedOrder.ruc}</span></p><p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.business_name}</p></>}
                {selectedOrder.invoice_number && <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">N° {selectedOrder.invoice_number}</p>}
              </div>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs font-medium dark:text-gray-400 mb-3">Productos</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
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

            <div className="flex flex-wrap gap-2 pt-1">
              {/* Paso 1: admin debe aprobar antes de que el cliente pueda pagar */}
              {(selectedOrder.status === 'pending_approval' || selectedOrder.status === 'pending') && (
                <>
                  <button onClick={() => handleApproveOrder(selectedOrder.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                    <Check className="w-3.5 h-3.5" />
                    Aprobar pedido
                  </button>
                  <button onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors">
                    <X className="w-3.5 h-3.5" />
                    Cancelar pedido
                  </button>
                </>
              )}
              {/* Paso 2: pedido aprobado, esperando pago del cliente */}
              {selectedOrder.status === 'processed' && !selectedOrder.payment_proof && selectedOrder.payment_status !== 'verified' && (
                <>
                  <span className="px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl">Esperando pago del cliente</span>
                  <a
                    href={buildWhatsAppLink(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Compartir con cliente
                  </a>
                </>
              )}
              {/* Ver comprobante */}
              {selectedOrder.payment_proof && (
                <a href={`${API_CONFIG.API_BASE_URL}${selectedOrder.payment_proof}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  Ver comprobante
                </a>
              )}
              {/* Paso 3: verificar pago */}
              {selectedOrder.payment_status === 'pending' && selectedOrder.payment_proof && (
                <>
                  <button onClick={() => handleVerifyPayment(selectedOrder.id, true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
                    <Check className="w-3.5 h-3.5" />
                    Verificar pago
                  </button>
                  <button onClick={() => handleVerifyPayment(selectedOrder.id, false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors">
                    <X className="w-3.5 h-3.5" />
                    Rechazar pago
                  </button>
                </>
              )}
              {/* Paso 4: cargar boleta/factura */}
              {selectedOrder.payment_status === 'verified' && !selectedOrder.invoice_file && (
                <button onClick={() => { setSelectedOrder(null); setInvoiceNumber(''); setInvoiceFile(null); setPendingInvoiceOrder(selectedOrder); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  Cargar {selectedOrder.invoice_type === 'factura' ? 'factura' : 'boleta'}
                </button>
              )}
              {selectedOrder.invoice_file && (
                <a href={`${API_CONFIG.API_BASE_URL}/api/admin/payments/invoices/${selectedOrder.invoice_file}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Descargar {selectedOrder.invoice_type === 'factura' ? 'factura' : 'boleta'} · N° {selectedOrder.invoice_number}
                </a>
              )}
              {selectedOrder.payment_status === 'rejected' && (
                <span className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl">Pago rechazado · Cliente debe enviar nuevo comprobante</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal cargar comprobante */}
      <Modal
        isOpen={!!pendingInvoiceOrder}
        onClose={() => { setPendingInvoiceOrder(null); setInvoiceNumber(''); setInvoiceFile(null); }}
        title={`Cargar ${pendingInvoiceOrder?.invoice_type === 'factura' ? 'Factura' : 'Boleta'} — Pedido #${pendingInvoiceOrder?.id}`}
        size="sm"
      >
        {pendingInvoiceOrder && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Número de comprobante *</label>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inp} placeholder={pendingInvoiceOrder.invoice_type === 'factura' ? 'F001-00001' : 'B001-00001'} />
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
              <p className="font-semibold">{pendingInvoiceOrder.customer_name}</p>
              <p className="text-xs mt-0.5">{pendingInvoiceOrder.customer_email}</p>
              <p className="text-xs mt-1 text-blue-500 dark:text-blue-500">El PDF se enviará automáticamente al cliente</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setPendingInvoiceOrder(null); setInvoiceNumber(''); setInvoiceFile(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleUploadInvoice(pendingInvoiceOrder.id)} disabled={isGeneratingInvoice || !invoiceFile || !invoiceNumber}
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
