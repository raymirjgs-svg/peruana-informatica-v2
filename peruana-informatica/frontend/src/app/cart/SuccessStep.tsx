import Link from 'next/link';
import { CheckCircle, FileText, Home, Mail, Search } from 'lucide-react';
import { InvoiceType } from './types';
import { ProgressBar } from './ProgressBar';

interface SuccessStepProps {
  checkoutMode: 'direct' | 'approval';
  trackingCode: string | null;
  orderId: number | null;
  customerEmail: string;
  invoiceType: InvoiceType;
}

export function SuccessStep({ checkoutMode, trackingCode, orderId, customerEmail, invoiceType }: SuccessStepProps) {
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
                <p className="text-white/80 text-sm uppercase tracking-wide mb-1">Código de Seguimiento</p>
                <p className="text-4xl font-bold text-white">{trackingCode ?? `#${orderId}`}</p>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmación enviada a:</p>
                  <p className="font-semibold text-blue-600">{customerEmail}</p>
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
                    <p className="text-amber-700 text-sm">Guarda tu código de seguimiento <strong>{trackingCode ?? `#${orderId}`}</strong> para consultar su estado</p>
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
                  href={`/orders/track/${trackingCode ?? orderId}`}
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
