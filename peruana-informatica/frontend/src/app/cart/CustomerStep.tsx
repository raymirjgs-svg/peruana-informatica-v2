import { FormEvent } from 'react';
import { CustomerData } from './types';
import { ProgressBar } from './ProgressBar';

interface CustomerStepProps {
  status: string;
  onSubmit: (event: FormEvent) => void;
  onLogin: () => void;
  onBack: () => void;
  customerData: CustomerData;
  onCustomerDataChange: (data: CustomerData) => void;
  isLoading: boolean;
  checkoutMode: 'direct' | 'approval';
}

export function CustomerStep({
  status,
  onSubmit,
  onLogin,
  onBack,
  customerData,
  onCustomerDataChange,
  isLoading,
  checkoutMode,
}: CustomerStepProps) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <ProgressBar currentStep="customer" />
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Datos del Cliente</h1>
            {/* Auth Prompt */}
            {status === 'unauthenticated' && (
              <div className="bg-blue-50 p-4 rounded mb-6 flex justify-between items-center">
                <p>¿Ya tienes cuenta?</p>
                <button onClick={() => onLogin()} className="bg-blue-600 text-white px-4 py-2 rounded">Iniciar Sesión</button>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold mb-2">Nombre Completo</label>
                <input type="text" required value={customerData.name} onChange={e => onCustomerDataChange({ ...customerData, name: e.target.value })} className="w-full border p-3 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold mb-2">DNI / CE</label>
                <input type="text" required value={customerData.document} onChange={e => onCustomerDataChange({ ...customerData, document: e.target.value })} className="w-full border p-3 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-2">Email</label>
              <input type="email" required value={customerData.email} onChange={e => onCustomerDataChange({ ...customerData, email: e.target.value })} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block font-bold mb-2">Teléfono</label>
              <input type="tel" required value={customerData.phone} onChange={e => onCustomerDataChange({ ...customerData, phone: e.target.value })} className="w-full border p-3 rounded-lg" />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onBack} className="flex-1 border p-4 rounded-xl font-bold">Volver</button>
              <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold">
                {checkoutMode === 'approval' ? 'Enviar Solicitud' : 'Continuar al Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
