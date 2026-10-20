import { Order } from '@/app/admin/orders/types';
import { getPaymentStatusBadge, getStatusBadge } from './statusBadges';

interface OrderCardProps {
  order: Order;
  handleViewProof: (orderId: number) => void;
  handleVerifyPayment: (orderId: number, verified: boolean) => void;
  setSelectedOrder: (order: Order) => void;
  handleDownloadInvoice: (filename: string) => void;
}

export function OrderCard({
  order,
  handleViewProof,
  handleVerifyPayment,
  setSelectedOrder,
  handleDownloadInvoice,
}: OrderCardProps) {
  return (
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
                        <button
                          onClick={() => handleViewProof(order.id)}
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          👁️ Ver Comprobante de Pago
                        </button>
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
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order.invoice_file!)}
                            className="px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition text-sm font-semibold flex items-center gap-2 shadow"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Descargar {order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}
                          </button>
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
  );
}
