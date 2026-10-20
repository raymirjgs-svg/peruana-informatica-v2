import { Order } from '@/app/admin/orders/types';

interface InvoiceModalProps {
  selectedOrder: Order;
  invoiceNumber: string;
  invoiceFile: File | null;
  isGeneratingInvoice: boolean;
  handleUploadInvoice: (orderId: number) => void;
  setSelectedOrder: (order: Order | null) => void;
  setInvoiceNumber: (value: string) => void;
  setInvoiceFile: (file: File | null) => void;
}

export function InvoiceModal({
  selectedOrder,
  invoiceNumber,
  invoiceFile,
  isGeneratingInvoice,
  handleUploadInvoice,
  setSelectedOrder,
  setInvoiceNumber,
  setInvoiceFile,
}: InvoiceModalProps) {
  return (
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
  );
}
