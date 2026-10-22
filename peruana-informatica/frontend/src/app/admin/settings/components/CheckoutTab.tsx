'use client';

import { DollarSign, Users, CheckCircle } from 'lucide-react';

interface CheckoutTabProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function CheckoutTab({ settings, onSettingChange }: CheckoutTabProps) {
  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Flujo de Compra</h2>
        <p className="text-gray-500 dark:text-gray-400">Define cómo se procesan los pedidos en la tienda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Mode */}
        <label className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${settings.checkout_mode === 'direct' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
          <input
            type="radio"
            name="checkout_mode"
            value="direct"
            checked={settings.checkout_mode === 'direct'}
            onChange={(e) => onSettingChange('checkout_mode', e.target.value)}
            className="sr-only"
          />
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full ${settings.checkout_mode === 'direct' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            {settings.checkout_mode === 'direct' && <CheckCircle className="w-6 h-6 text-blue-600" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Compra Directa</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El cliente agrega productos al carrito, ingresa sus datos y <strong>paga inmediatamente</strong>. Ideal para B2C y venta minorista estándar.
          </p>
        </label>

        {/* Approval Mode */}
        <label className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${settings.checkout_mode === 'approval' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 hover:border-amber-200 hover:bg-gray-50'}`}>
          <input
            type="radio"
            name="checkout_mode"
            value="approval"
            checked={settings.checkout_mode === 'approval'}
            onChange={(e) => onSettingChange('checkout_mode', e.target.value)}
            className="sr-only"
          />
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full ${settings.checkout_mode === 'approval' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
              <Users className="w-6 h-6" />
            </div>
            {settings.checkout_mode === 'approval' && <CheckCircle className="w-6 h-6 text-amber-600" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Requiere Aprobación</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El cliente envía una <strong>solicitud de pedido</strong>. El administrador revisa y aprueba antes de permitir el pago. Ideal para B2B o productos bajo cotización.
          </p>
        </label>
      </div>
    </div>
  );
}
