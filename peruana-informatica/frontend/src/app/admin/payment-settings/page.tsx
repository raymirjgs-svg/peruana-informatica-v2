'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminFetch } from '@/lib/adminApi';
import {
  CreditCard, Eye, EyeOff, Save, CheckCircle, AlertCircle,
  Loader2, Wifi, WifiOff, TestTube, Info,
} from 'lucide-react';

interface PaymentSettings {
  payment_culqi_enabled: string;
  culqi_public_key: string;
  culqi_secret_key: string;
  payment_niubiz_enabled: string;
  niubiz_merchant_id: string;
  niubiz_secret_key: string;
  payment_transfer_enabled: string;
  payment_cod_enabled: string;
  payment_mode: string;
}

const DEFAULTS: PaymentSettings = {
  payment_culqi_enabled: '0',
  culqi_public_key: '',
  culqi_secret_key: '',
  payment_niubiz_enabled: '0',
  niubiz_merchant_id: '',
  niubiz_secret_key: '',
  payment_transfer_enabled: '1',
  payment_cod_enabled: '1',
  payment_mode: 'test',
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showCulqiSecret, setShowCulqiSecret] = useState(false);
  const [showNiubizSecret, setShowNiubizSecret] = useState(false);
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

  const testCulqi = async () => {
    setTesting(true);
    try {
      const r = await adminFetch('/admin/payment-settings/test-culqi', { method: 'POST' });
      const d = await r.json();
      if (d.success) showToast('success', d.message);
      else showToast('error', d.error || 'Prueba fallida');
    } catch {
      showToast('error', 'No se pudo conectar con Culqi');
    } finally {
      setTesting(false);
    }
  };

  const set = (key: keyof PaymentSettings, val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const toggle = (key: keyof PaymentSettings) =>
    set(key, settings[key] === '1' ? '0' : '1');

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
              Configura los métodos de pago disponibles en la tienda. Las claves secretas se guardan cifradas.
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

          {/* Modo test/producción */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Modo de operación</h2>
            <div className="flex gap-3">
              {[
                { val: 'test', label: 'Pruebas', desc: 'No se cobra dinero real', color: 'amber' },
                { val: 'live', label: 'Producción', desc: 'Cobros reales activados', color: 'green' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set('payment_mode', opt.val)}
                  className={`flex-1 p-4 rounded-lg border-2 text-left transition ${
                    settings.payment_mode === opt.val
                      ? opt.val === 'live'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            {settings.payment_mode === 'live' && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                En modo Producción los cobros son reales. Asegúrate de haber probado antes en modo Pruebas.
              </div>
            )}
          </div>

          {/* Culqi */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">CQ</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Culqi</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pagos con tarjeta — empresa peruana</p>
                </div>
              </div>
              <button
                onClick={() => toggle('payment_culqi_enabled')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.payment_culqi_enabled === '1' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.payment_culqi_enabled === '1' ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {settings.payment_culqi_enabled === '1' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clave Pública <span className="text-gray-400 font-normal">(pk_live_... o pk_test_...)</span>
                  </label>
                  <input
                    type="text"
                    value={settings.culqi_public_key}
                    onChange={e => set('culqi_public_key', e.target.value)}
                    placeholder="pk_live_xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Visible en el navegador — no es secreta.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clave Secreta <span className="text-gray-400 font-normal">(sk_live_... o sk_test_...)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCulqiSecret ? 'text' : 'password'}
                      value={settings.culqi_secret_key}
                      onChange={e => set('culqi_secret_key', e.target.value)}
                      placeholder="sk_live_xxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCulqiSecret(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCulqiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Solo el servidor la usa. Nunca se muestra completa una vez guardada.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={testCulqi}
                    disabled={testing}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {testing
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <TestTube className="h-4 w-4" />}
                    Probar conexión con Culqi
                  </button>
                  <a
                    href="https://culqi.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
                  >
                    Ir al panel de Culqi →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Niubiz */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">NB</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Niubiz (VisaNet)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requiere contrato con banco emisor</p>
                </div>
              </div>
              <button
                onClick={() => toggle('payment_niubiz_enabled')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.payment_niubiz_enabled === '1' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.payment_niubiz_enabled === '1' ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {settings.payment_niubiz_enabled === '1' && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300 text-xs">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  La integración de Niubiz requiere desarrollo adicional. Guarda tus credenciales aquí para cuando esté lista.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={settings.niubiz_merchant_id}
                    onChange={e => set('niubiz_merchant_id', e.target.value)}
                    placeholder="123456789"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clave Secreta
                  </label>
                  <div className="relative">
                    <input
                      type={showNiubizSecret ? 'text' : 'password'}
                      value={settings.niubiz_secret_key}
                      onChange={e => set('niubiz_secret_key', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNiubizSecret(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNiubizSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Métodos manuales */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Otros métodos de pago</h2>
            <div className="space-y-3">
              {[
                { key: 'payment_transfer_enabled' as const, label: 'Transferencia bancaria', desc: 'El cliente sube comprobante y espera confirmación manual' },
                { key: 'payment_cod_enabled' as const, label: 'Pago contra entrega', desc: 'El cliente paga en efectivo al recibir el pedido' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => toggle(item.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      settings[item.key] === '1' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      settings[item.key] === '1' ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo obtener las claves */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              ¿Cómo obtener las claves de Culqi?
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>Ingresa a <strong>culqi.com</strong> y crea una cuenta comercial</li>
              <li>Verifica tu RUC y sube los documentos requeridos (DNI del representante, cuenta bancaria)</li>
              <li>Una vez aprobado (2-5 días hábiles), ve a <strong>Desarrolladores → API Keys</strong></li>
              <li>Copia la <strong>Clave Pública</strong> (pk_...) y la <strong>Clave Secreta</strong> (sk_...)</li>
              <li>Pégalas aquí, activa el modo <strong>Producción</strong> y guarda</li>
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
