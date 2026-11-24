'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminFetch } from '@/lib/adminApi';
import {
  CreditCard, Eye, EyeOff, Save, CheckCircle, AlertCircle,
  Loader2, Wifi, WifiOff, TestTube, Info,
} from 'lucide-react';

interface PaymentSettings {
  mp_access_token: string;
}

const DEFAULTS: PaymentSettings = {
  mp_access_token: '',
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [mpStatus, setMpStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    adminFetch('/admin/payment-settings')
      .then(r => r.json())
      .then(d => { if (d.success) setSettings({ ...DEFAULTS, ...d.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await adminFetch('/admin/payment-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (d.success) showToast('success', 'Configuración guardada correctamente');
      else showToast('error', d.error || 'Error al guardar');
    } catch {
      showToast('error', 'Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  const testMercadoPago = async () => {
    setTesting(true);
    setMpStatus(null);
    try {
      const r = await adminFetch('/admin/payment-settings/test-mercadopago', { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        setMpStatus({ ok: true, msg: d.message });
        showToast('success', d.message);
      } else {
        setMpStatus({ ok: false, msg: d.error || 'Prueba fallida' });
        showToast('error', d.error || 'Prueba fallida');
      }
    } catch {
      setMpStatus({ ok: false, msg: 'No se pudo conectar con Mercado Pago' });
      showToast('error', 'No se pudo conectar con Mercado Pago');
    } finally {
      setTesting(false);
    }
  };

  const set = (key: keyof PaymentSettings, val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CreditCard className="h-7 w-7 text-blue-600" />
              Pasarelas de Pago
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Todo el cobro de la tienda se realiza con Mercado Pago.
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-6 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        <div className="space-y-6">

          {/* Mercado Pago */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                <span className="text-sky-600 font-bold text-sm">MP</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Mercado Pago</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tarjetas, debito, credito y saldo en cuenta</p>
              </div>
              {mpStatus && (
                <span className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  mpStatus.ok
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {mpStatus.ok ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  {mpStatus.ok ? 'Conectado' : 'Sin conexion'}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Token <span className="text-gray-400 font-normal">(APP_USR-... o PROD-...)</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={settings.mp_access_token}
                    onChange={e => set('mp_access_token', e.target.value)}
                    placeholder="APP_USR-xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:hover:text-gray-400"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Solo el servidor la usa. Nunca se muestra completa una vez guardada.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={testMercadoPago}
                  disabled={testing}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {testing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <TestTube className="h-4 w-4" />}
                  Probar conexion con Mercado Pago
                </button>
                <a
                  href="https://www.mercadopago.com.pe/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 dark:hover:text-gray-400 underline ml-auto"
                >
                  Ir al panel de Mercado Pago →
                </a>
              </div>

              {mpStatus && !mpStatus.ok && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {mpStatus.msg}
                </div>
              )}
            </div>
          </div>

          {/* Metodo de pago */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Metodo de pago</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Todo el cobro se realiza por <strong>Mercado Pago</strong>. Los metodos manuales
              (transferencia con comprobante, pago contra entrega) se retiraron del sitio.
            </p>
          </div>

          {/* Cómo obtener el token */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              ¿Cómo obtener el Access Token?
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>Entra a <strong>mercadopago.com.pe/developers/panel/app</strong> con tu cuenta</li>
              <li>Crea una aplicación o usa la existente y asocia tu cuenta cobradora</li>
              <li>En <strong>Credenciales</strong> copia el <strong>Access Token de producción</strong> (empieza con <strong>APP_USR-</strong> o <strong>PROD-</strong>)</li>
              <li>Pégalo aquí, presiona <strong>Guardar</strong> y luego <strong>Probar conexión</strong></li>
              <li>Sin un token válido la tienda no puede cobrar: el checkout se rechaza</li>
            </ol>
          </div>

        </div>

        {/* Botón guardar flotante */}
        <div className="sticky bottom-6 flex justify-end mt-6">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar configuración
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
