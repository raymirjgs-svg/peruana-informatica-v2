'use client';


import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';

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
  status: 'pending' | 'processed' | 'cancelled';
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
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      setError('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerifyPayment = async (orderId: number, verified: boolean) => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/payments/${orderId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
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

      const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/payments/${orderId}/upload-invoice`, {
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

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-amber-500 text-white',
      processed: 'bg-emerald-600 text-white',
      cancelled: 'bg-red-600 text-white'
    };
    const labels = {
      pending: 'Pendiente',
      processed: 'Procesado',
      cancelled: 'Cancelado'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-orange-500 text-white',
      verified: 'bg-blue-600 text-white',
      rejected: 'bg-red-600 text-white'
    };
    const labels = {
      pending: 'Pago Pendiente',
      verified: 'Pago Verificado',
      rejected: 'Pago Rechazado'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Pedidos</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">Administra los pedidos de tus clientes</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-300">Cargando pedidos...</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pedido #{order.id}</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleString('es-PE')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    {/* Datos del Cliente */}
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Datos del Cliente:</h4>
                      <div className="space-y-1.5 text-sm">
                        <p><span className="font-medium text-gray-600 dark:text-gray-400">Nombre:</span> <span className="text-gray-900 dark:text-white">{order.customer_name}</span></p>
                        <p><span className="font-medium text-gray-600 dark:text-gray-400">Email:</span> <span className="text-blue-600 dark:text-blue-400 font-medium">{order.customer_email}</span></p>
                        <p><span className="font-medium text-gray-600 dark:text-gray-400">Teléfono:</span> <span className="text-gray-900 dark:text-white">{order.customer_phone}</span></p>
                        {order.customer_document && (
                          <p><span className="font-medium text-gray-600 dark:text-gray-400">DNI:</span> <span className="text-gray-900 dark:text-white">{order.customer_document}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Datos de Pago */}
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Datos de Pago:</h4>
                      <div className="space-y-1.5 text-sm">
                        {order.payment_method && (
                          <p><span className="font-medium text-gray-600 dark:text-gray-400">Método:</span> <span className="text-gray-900 dark:text-white uppercase font-medium">{order.payment_method}</span></p>
                        )}
                        <p><span className="font-medium text-gray-600 dark:text-gray-400">Total:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">S/ {parseFloat(order.total_amount).toFixed(2)}</span></p>
                        <p><span className="font-medium text-gray-600 dark:text-gray-400">Comprobante:</span> <span className="text-gray-900 dark:text-white">{order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}</span></p>
                        {order.invoice_type === 'factura' && (
                          <>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">RUC:</span> <span className="text-gray-900 dark:text-white font-mono">{order.ruc}</span></p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Razón Social:</span> <span className="text-gray-900 dark:text-white">{order.business_name}</span></p>
                          </>
                        )}
                        {order.invoice_number && (
                          <p><span className="font-medium text-gray-600 dark:text-gray-400">N° Comprobante:</span> <span className="text-purple-600 dark:text-purple-400 font-semibold">{order.invoice_number}</span></p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Productos:</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-2 border-b dark:border-gray-600 last:border-0">
                            <span className="text-gray-900 dark:text-white">{item.product_name}</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {item.quantity} x S/ {parseFloat(item.price).toFixed(2)} =
                              S/ {(item.quantity * parseFloat(item.price)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones - Flujo de Trabajo Mejorado */}
                  <div className="mt-4 border-t dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Acciones del Pedido:</h4>

                    {/* Paso 1: Ver comprobante del cliente */}
                    {order.payment_proof && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          📎 Paso 1: Revisar Comprobante del Cliente
                        </p>
                        <a
                          href={`${API_CONFIG.API_BASE_URL}/payments/proofs/${order.payment_proof}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          👁️ Ver Comprobante de Pago
                        </a>
                      </div>
                    )}

                    {/* Paso 2: Verificar o rechazar pago */}
                    {order.payment_status === 'pending' && order.payment_proof && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-900 mb-2">
                          ⚠️ Paso 2: Validar el Pago
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyPayment(order.id, true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verificar Pago
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(order.id, false)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Rechazar Pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paso 3: Generar factura/boleta */}
                    {order.payment_status === 'verified' && !order.invoice_file && (
                      <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-2">
                          📄 Paso 3: Generar y Cargar Comprobante
                        </p>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                          </svg>
                          Generar {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}
                        </button>
                        <p className="text-xs text-purple-700 mt-2">
                          * Se generará el PDF y se enviará automáticamente al cliente por email
                        </p>
                      </div>
                    )}

                    {/* Paso 4: Comprobante generado */}
                    {order.invoice_file && (
                      <div className="mb-3 p-4 bg-emerald-600 rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Comprobante Generado y Enviado
                        </p>
                        <div className="flex gap-3 items-center">
                          <a
                            href={`${API_CONFIG.API_BASE_URL}/admin/payments/invoices/${order.invoice_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition text-sm font-semibold flex items-center gap-2 shadow"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Descargar {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}
                          </a>
                          <span className="px-3 py-1 bg-emerald-700 text-white rounded-full text-xs font-semibold">
                            N° {order.invoice_number}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Estado: Pago rechazado */}
                    {order.payment_status === 'rejected' && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-900">
                          ❌ Pago Rechazado
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          El cliente debe enviar un nuevo comprobante de pago
                        </p>
                      </div>
                    )}

                    {/* Estado: Sin comprobante */}
                    {!order.payment_proof && order.payment_status === 'pending' && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          ⏳ Esperando comprobante del cliente
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay pedidos registrados
              </div>
            )}
          </div>
        )}

        {/* Modal para cargar factura/boleta */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📄</div>
                <div>
                  <h3 className="text-xl font-bold">
                    Cargar {selectedOrder.invoice_type === 'factura' ? 'Factura' : 'Boleta'}
                  </h3>
                  <p className="text-sm text-gray-600">Pedido #{selectedOrder.id}</p>
                </div>
              </div>

              {/* Número de comprobante */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Comprobante *
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder={selectedOrder.invoice_type === 'factura' ? 'F001-00001' : 'B001-00001'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el número del comprobante generado en tu sistema de ventas
                </p>
              </div>

              {/* Upload de archivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo PDF del Comprobante *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${invoiceFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="invoice-upload"
                  />
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <div className="text-5xl mb-3">{invoiceFile ? '✅' : '📤'}</div>
                    {invoiceFile ? (
                      <div>
                        <p className="text-green-700 font-bold text-lg mb-1">{invoiceFile.name}</p>
                        <p className="text-sm text-green-600 mb-2">
                          {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-green-600 bg-green-100 inline-block px-3 py-1 rounded-full">
                          Clic para cambiar archivo
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 font-bold text-lg mb-1">Seleccionar PDF</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Arrastra el archivo aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-gray-400">Máximo 10MB • Solo archivos PDF</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📧 El comprobante se enviará a:
                </p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Cliente:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                  <p className="text-xs text-blue-700 mt-2 italic">
                    * El PDF se enviará automáticamente por correo electrónico
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setInvoiceNumber('');
                    setInvoiceFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleUploadInvoice(selectedOrder.id)}
                  disabled={isGeneratingInvoice || !invoiceFile || !invoiceNumber}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                >
                  {isGeneratingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Cargar Comprobante
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
