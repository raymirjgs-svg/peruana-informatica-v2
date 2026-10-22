'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import {
  Settings,
  DollarSign,
  ShoppingCart,
  Palette,
  LayoutTemplate,
  Megaphone,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import apiClient from '@/utils/api';
import { PricingTab } from './components/PricingTab';
import { CheckoutTab } from './components/CheckoutTab';
import { AppearanceTab } from './components/AppearanceTab';
import { HomeTab } from './components/HomeTab';
import { AnnouncementTab } from './components/AnnouncementTab';

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
    announcement_bar_color: '#1e40af' // blue-800
  });


  useEffect(() => {
    apiClient.request<Record<string, unknown>>('/api/admin/settings', { headers: { ...getAdminAuthHeaders() } })
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
        apiClient.request(`/api/admin/settings/${key}`, {
          method: 'PUT',
          headers: { ...getAdminAuthHeaders() },
          body: { value: String(value) }
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando configuración...</p>
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
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Configuración del Sistema
              </h1>
              <p className="text-gray-500 dark:text-gray-300 mt-1">
                Personaliza el funcionamiento y apariencia de tu tienda
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">

          {activeTab === 'pricing' && (
            <PricingTab settings={settings} onSettingChange={handleSettingChange} />
          )}

          {activeTab === 'checkout' && (
            <CheckoutTab settings={settings} onSettingChange={handleSettingChange} />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab settings={settings} onSettingChange={handleSettingChange} />
          )}

          {activeTab === 'home' && (
            <HomeTab settings={settings} onSettingChange={handleSettingChange} />
          )}

          {activeTab === 'announcement' && (
            <AnnouncementTab settings={settings} onSettingChange={handleSettingChange} />
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
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
