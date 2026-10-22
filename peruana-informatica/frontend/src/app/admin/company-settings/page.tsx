'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import apiClient from '@/utils/api';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import {
  Building2,
  Phone,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Store,
  Share2
} from 'lucide-react';
import { GeneralTab } from './components/GeneralTab';
import { ContactTab } from './components/ContactTab';
import { LocationTab } from './components/LocationTab';
import { SocialTab } from './components/SocialTab';
import type { CompanySettings } from './components/types';

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    company_ruc: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_whatsapp: '',
    company_website: '',
    store_address: '',
    store_hours: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    logo_url: '',
    show_distributor_price_in_detail: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<CompanySettings>('/api/admin/company-settings', {
        headers: { ...getAdminAuthHeaders() },
      });
      setSettings(data);
      setFormData({
        company_name: data.company_name || '',
        company_ruc: data.company_ruc || '',
        company_address: data.company_address || '',
        company_phone: data.company_phone || '',
        company_email: data.company_email || '',
        company_whatsapp: data.company_whatsapp || '',
        company_website: data.company_website || '',
        store_address: data.store_address || '',
        store_hours: data.store_hours || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        twitter_url: data.twitter_url || '',
        linkedin_url: data.linkedin_url || '',
        logo_url: data.logo_url || '',
        show_distributor_price_in_detail: data.show_distributor_price_in_detail || false,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const data = await apiClient.request<{ settings: CompanySettings }>('/api/admin/company-settings', {
        method: 'PUT',
        headers: { ...getAdminAuthHeaders() },
        body: formData,
      });

      setMessage({ type: 'success', text: 'Configuración actualizada exitosamente' });
      setSettings(data.settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'location', label: 'Ubicación', icon: Store },
    { id: 'social', label: 'Redes Sociales', icon: Share2 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600 font-medium">Cargando configuración...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Configuración de Empresa
              </h1>
              <p className="text-gray-500 mt-1">
                Administra la información pública de tu negocio
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
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
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
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">

          {/* General Tab */}
          {activeTab === 'general' && (
            <GeneralTab formData={formData} onChange={handleChange} />
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <ContactTab formData={formData} onChange={handleChange} />
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <LocationTab formData={formData} onChange={handleChange} />
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <SocialTab formData={formData} onChange={handleChange} />
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={fetchSettings}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2 border border-gray-300 shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Resetear
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
