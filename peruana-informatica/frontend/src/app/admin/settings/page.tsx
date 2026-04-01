'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminFetch } from '@/lib/adminApi';
import {

  Settings,
  DollarSign,
  Users,
  Globe,
  Percent,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  Palette,
  LayoutTemplate,
  Megaphone,
  Eye,
  EyeOff,
  ShoppingCart,
  CreditCard,
  Truck
} from 'lucide-react';

interface PriceOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const priceOptions: PriceOption[] = [
  {
    value: 'pre_cli',
    label: 'Precio Cliente (PVP)',
    description: 'Precio estándar de venta al público.',
    icon: <Users className="h-6 w-6" />,
    color: 'green'
  },
  {
    value: 'pre_web',
    label: 'Precio Web',
    description: 'Precio exclusivo para tienda online.',
    icon: <Globe className="h-6 w-6" />,
    color: 'purple'
  },
  {
    value: 'pre_dis',
    label: 'Precio Distribuidor',
    description: 'Precio mayorista más bajo. Ideal para campañas o promociones.',
    icon: <Percent className="h-6 w-6" />,
    color: 'amber'
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    // Pricing
    cotizador_price_type: 'pre_web',

    // Checkout
    checkout_mode: 'direct',

    // Appearance
    primary_color: '#2563eb', // blue-600 default
    secondary_color: '#4f46e5', // indigo-600 default

    // Home Sections Visibility
    home_section_new: 'true',
    home_section_featured: 'true',
    home_section_clearance: 'true',
    home_section_categories: 'true',
    home_section_brands: 'true',

    // Announcement Bar
    announcement_bar_enabled: 'false',
    announcement_bar_text: '¡Envío gratis en compras mayores a S/. 500!',
    announcement_bar_link: '/products',
    announcement_bar_color: '#1e40af', // blue-800

    // Payment Methods
    payment_bcp_account: '',
    payment_bcp_cci: '',
    payment_ibk_account: '',
    payment_ibk_cci: '',
    payment_holder: '',
    payment_yape_phone: '',
    payment_plin_phone: '',
    payment_methods_enabled: 'transferencia,yape,plin,tarjeta',

    // Shipping & Returns
    shipping_standard_title: 'Envío Estándar',
    shipping_standard_subtitle: '2–5 días hábiles · Lima y provincias',
    shipping_standard_badge: 'GRATIS',
    shipping_express_title: 'Envío Express',
    shipping_express_subtitle: '24–48 h · Solo Lima Metropolitana',
    shipping_express_badge: 'S/. 15',
    return_policy_lines: 'Producto en condiciones originales con embalaje y accesorios',
  });

  useEffect(() => {
    adminFetch('/admin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        setMessage({ type: 'error', text: 'Error al cargar configuración' });
      });
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Save all settings concurrently
      const promises = Object.entries(settings).map(([key, value]) =>
        adminFetch(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: String(value) })
        })
      );

      await Promise.all(promises);

      setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' });

      // Optional: Refresh page or context specifically if needed, likely not needed if global state updates or page reload
      // window.location.reload(); 
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error al guardar algunos cambios.' });
    } finally {
      setSaving(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { selected: string; hover: string; icon: string }> = {
      blue: {
        selected: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400',
        hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      green: {
        selected: 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400',
        hover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400'
      },
      purple: {
        selected: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400',
        hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400'
      },
      amber: {
        selected: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-400',
        hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400'
      }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando configuración...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'pricing', label: 'Precios', icon: DollarSign },
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'home', label: 'Home Page', icon: LayoutTemplate },
    { id: 'announcement', label: 'Anuncios', icon: Megaphone },
    { id: 'payment', label: 'Pagos', icon: CreditCard },
    { id: 'shipping', label: 'Envío', icon: Truck },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del Sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Personaliza el funcionamiento y apariencia de tu tienda</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
            }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[400px]">

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Configuración de Precios</h2>
                <p className="text-gray-500 dark:text-gray-400">Define qué precio base utilizará el sistema para cálculos y visualización.</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>💡 Consejo:</strong> Cambia a "Precio Distribuidor" durante campañas promocionales
                  para ofrecer los mejores precios a tus clientes.
                </p>
              </div>

              <div className="space-y-4">
                {priceOptions.map((option) => {
                  const isSelected = settings.cotizador_price_type === option.value;
                  const colorClasses = getColorClasses(option.color, isSelected);
                  const selectedClass = colorClasses?.selected ?? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30';
                  const hoverClass = colorClasses?.hover ?? 'hover:bg-blue-50 dark:hover:bg-blue-900/20';

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                        ? selectedClass
                        : `border-gray-200 dark:border-gray-600 ${hoverClass}`
                        }`}
                    >
                      <input
                        type="radio"
                        name="cotizador_price_type"
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => handleSettingChange('cotizador_price_type', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-3 rounded-lg ${isSelected ? (colorClasses?.icon ?? 'text-blue-600 dark:text-blue-400') : 'text-gray-400 dark:text-gray-500'} ${isSelected ? `bg-white dark:bg-gray-800` : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                        {option.icon}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {option.label}
                          </span>
                          <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {option.value}
                          </span>
                          {isSelected && (
                            <span className="ml-auto">
                              <CheckCircle className={`h-6 w-6 ${colorClasses?.icon ?? 'text-blue-600'}`} />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHECKOUT TAB */}
          {activeTab === 'checkout' && (
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
                    onChange={(e) => handleSettingChange('checkout_mode', e.target.value)}
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
                    onChange={(e) => handleSettingChange('checkout_mode', e.target.value)}
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
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Apariencia</h2>
                <p className="text-gray-500 dark:text-gray-400">Personaliza los colores y estilo visual de tu tienda.</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-8 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-1">¿Buscas cambiar el Logo?</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">La configuración de identidad visual (Logo y Favicon) se encuentra en la sección de Empresa.</p>
                </div>
                <a href="/admin/company-settings" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Ir a Empresa y Logos →
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Primario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en botones principales, enlaces y encabezados.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Secundario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en acentos, bordes y elementos secundarios.</p>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Apariencia</h2>
                <p className="text-gray-500 dark:text-gray-400">Personaliza los colores y estilo visual de tu tienda.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Primario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en botones principales, enlaces y encabezados.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Secundario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en acentos, bordes y elementos secundarios.</p>
                </div>
              </div>
            </div>
          )}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Página de Inicio</h2>
                <p className="text-gray-500 dark:text-gray-400">Controla qué secciones se muestran en la página principal.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'home_section_new', label: 'Sección Nuevos Productos (✨)', desc: 'Muestra los últimos productos agregados.' },
                  { key: 'home_section_featured', label: 'Sección Destacados (⭐)', desc: 'Muestra productos marcados como destacados.' },
                  { key: 'home_section_clearance', label: 'Sección Ofertas (🔥)', desc: 'Muestra productos en liquidación.' },
                  { key: 'home_section_categories', label: 'Sección Categorías', desc: 'Muestra las categorías principales.' },
                  { key: 'home_section_brands', label: 'Sección Marcas', desc: 'Carrusel de marcas asociadas.' }
                ].map((section) => (
                  <div key={section.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{section.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{section.desc}</div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(section.key, settings[section.key as keyof typeof settings] === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings[section.key as keyof typeof settings] === 'true' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[section.key as keyof typeof settings] === 'true' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENT TAB */}
          {activeTab === 'announcement' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Barra de Anuncios</h2>
                <p className="text-gray-500 dark:text-gray-400">Configura la barra superior para avisos importantes.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">Activar Barra</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Mostrar barra en la parte superior del sitio</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('announcement_bar_enabled', settings.announcement_bar_enabled === 'true' ? 'false' : 'true')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.announcement_bar_enabled === 'true' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.announcement_bar_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {settings.announcement_bar_enabled === 'true' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Texto del Anuncio</label>
                      <input
                        type="text"
                        value={settings.announcement_bar_text}
                        onChange={(e) => handleSettingChange('announcement_bar_text', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: ¡Envío gratis solo por hoy!"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enlace (Opcional)</label>
                      <input
                        type="text"
                        value={settings.announcement_bar_link}
                        onChange={(e) => handleSettingChange('announcement_bar_link', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: /products/ofertas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color de Fondo</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.announcement_bar_color}
                          onChange={(e) => handleSettingChange('announcement_bar_color', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <div
                          className="flex-1 px-4 py-2 rounded-lg text-white text-center font-medium shadow-sm transition-all"
                          style={{ backgroundColor: settings.announcement_bar_color }}
                        >
                          Vista Previa: {settings.announcement_bar_text}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENT TAB */}
          {activeTab === 'payment' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Métodos de Pago</h2>
                <p className="text-gray-500 dark:text-gray-400">Configura los datos bancarios y métodos disponibles para los clientes.</p>
              </div>

              {/* Enabled methods */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Métodos habilitados</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['transferencia', 'yape', 'plin', 'tarjeta'] as const).map((method) => {
                    const enabled = settings.payment_methods_enabled.split(',').map(m => m.trim()).includes(method);
                    const labels: Record<string, string> = { transferencia: 'Transferencia', yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta' };
                    const toggle = () => {
                      const current = settings.payment_methods_enabled.split(',').map(m => m.trim()).filter(Boolean);
                      const updated = enabled ? current.filter(m => m !== method) : [...current, method];
                      handleSettingChange('payment_methods_enabled', updated.join(','));
                    };
                    return (
                      <button
                        key={method}
                        onClick={toggle}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${enabled
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <span className="font-semibold">{labels[method]}</span>
                        {enabled ? <CheckCircle className="h-5 w-5 text-blue-600" /> : <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank transfer data */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos para Transferencia Bancaria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titular / Beneficiario</label>
                    <input
                      type="text"
                      value={settings.payment_holder}
                      onChange={(e) => handleSettingChange('payment_holder', e.target.value)}
                      placeholder="Nombre del titular"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">BCP</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° de Cuenta BCP</label>
                        <input
                          type="text"
                          value={settings.payment_bcp_account}
                          onChange={(e) => handleSettingChange('payment_bcp_account', e.target.value)}
                          placeholder="Ej: 193-12345678-0-12"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CCI BCP</label>
                        <input
                          type="text"
                          value={settings.payment_bcp_cci}
                          onChange={(e) => handleSettingChange('payment_bcp_cci', e.target.value)}
                          placeholder="Ej: 00219300123456780123"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Interbank</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° de Cuenta Interbank</label>
                        <input
                          type="text"
                          value={settings.payment_ibk_account}
                          onChange={(e) => handleSettingChange('payment_ibk_account', e.target.value)}
                          placeholder="Ej: 200-12345678-9"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CCI Interbank</label>
                        <input
                          type="text"
                          value={settings.payment_ibk_cci}
                          onChange={(e) => handleSettingChange('payment_ibk_cci', e.target.value)}
                          placeholder="Ej: 00320012345678901234"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yape / Plin */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos para Yape / Plin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Número Yape</label>
                    <input
                      type="text"
                      value={settings.payment_yape_phone}
                      onChange={(e) => handleSettingChange('payment_yape_phone', e.target.value)}
                      placeholder="Ej: 999 999 999"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Número Plin</label>
                    <input
                      type="text"
                      value={settings.payment_plin_phone}
                      onChange={(e) => handleSettingChange('payment_plin_phone', e.target.value)}
                      placeholder="Ej: 999 999 999"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING TAB */}
          {activeTab === 'shipping' && (
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Envío y Devoluciones</h2>
                <p className="text-gray-500 dark:text-gray-400">Configura los textos que se muestran en la ficha de cada producto.</p>
              </div>

              {/* Envío Estándar */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Envío Estándar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título</label>
                    <input type="text" value={settings.shipping_standard_title}
                      onChange={e => handleSettingChange('shipping_standard_title', e.target.value)}
                      placeholder="Envío Estándar"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
                    <input type="text" value={settings.shipping_standard_subtitle}
                      onChange={e => handleSettingChange('shipping_standard_subtitle', e.target.value)}
                      placeholder="2–5 días hábiles · Lima y provincias"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Badge (precio/etiqueta)</label>
                    <input type="text" value={settings.shipping_standard_badge}
                      onChange={e => handleSettingChange('shipping_standard_badge', e.target.value)}
                      placeholder="GRATIS"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Envío Express */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Envío Express</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título</label>
                    <input type="text" value={settings.shipping_express_title}
                      onChange={e => handleSettingChange('shipping_express_title', e.target.value)}
                      placeholder="Envío Express"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
                    <input type="text" value={settings.shipping_express_subtitle}
                      onChange={e => handleSettingChange('shipping_express_subtitle', e.target.value)}
                      placeholder="24–48 h · Solo Lima Metropolitana"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Badge (precio/etiqueta)</label>
                    <input type="text" value={settings.shipping_express_badge}
                      onChange={e => handleSettingChange('shipping_express_badge', e.target.value)}
                      placeholder="S/. 15"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Política de Devoluciones */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Política de Devoluciones</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Una línea por ítem. Cada línea aparece como un punto en la ficha del producto.</p>
                <textarea
                  value={settings.return_policy_lines}
                  onChange={e => handleSettingChange('return_policy_lines', e.target.value)}
                  rows={5}
                  placeholder={'Producto en condiciones originales con embalaje y accesorios\nDevolución dentro de los 7 días de recibido'}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
