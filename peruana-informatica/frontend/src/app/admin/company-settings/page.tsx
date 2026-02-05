'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  LayoutGrid,
  Store,
  Share2
} from 'lucide-react';

interface CompanySettings {
  id: number;
  company_name: string;
  company_ruc: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_whatsapp?: string;
  company_website?: string;
  store_address?: string;
  store_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  logo_url?: string;
  show_distributor_price_in_detail?: boolean;
}

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
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/company-settings`);
      const data = await response.json();
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
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/company-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuración actualizada exitosamente' });
        setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar configuración' });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
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
            <div className="p-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Información Institucional
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Peruana Informática"
                    />
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    RUC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_ruc"
                    value={formData.company_ruc}
                    onChange={handleChange}
                    required
                    maxLength={11}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    placeholder="20123456789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección Fiscal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="company_address"
                      value={formData.company_address}
                      onChange={handleChange}
                      required
                      rows={2}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Av. Principal 123, Lima - Perú"
                    />
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración Adicional</h3>
                  <div className="flex items-center gap-4 p-4 border rounded-xl bg-orange-50 border-orange-200">
                    <input
                      type="checkbox"
                      id="show_distributor_price_in_detail"
                      name="show_distributor_price_in_detail"
                      checked={formData.show_distributor_price_in_detail}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    />
                    <label htmlFor="show_distributor_price_in_detail" className="cursor-pointer">
                      <div className="font-semibold text-gray-800">Mostrar Precio Distribuidor</div>
                      <div className="text-sm text-gray-600">
                        Habilita la visualización del precio de distribuidor en el detalle del producto.
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="p-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Medios de Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="company_phone"
                      value={formData.company_phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="(01) 123-4567"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="company_whatsapp"
                      value={formData.company_whatsapp}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="+51 999 888 777"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">W</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="company_email"
                      value={formData.company_email}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="ventas@peruanainformatica.com"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sitio Web</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="company_website"
                      value={formData.company_website}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="https://www.peruanainformatica.com"
                    />
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="p-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-600" />
                Tienda Física y Horarios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección de Tienda</label>
                  <div className="relative">
                    <textarea
                      name="store_address"
                      value={formData.store_address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Av. Principal 123, Lima - Perú"
                    />
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horario de Atención</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="store_hours"
                      value={formData.store_hours}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="p-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-pink-600" />
                Redes Sociales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="facebook_url"
                      value={formData.facebook_url}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                      placeholder="https://facebook.com/usuario"
                    />
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="instagram_url"
                      value={formData.instagram_url}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="https://instagram.com/usuario"
                    />
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter / X</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="twitter_url"
                      value={formData.twitter_url}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      placeholder="https://twitter.com/usuario"
                    />
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all"
                      placeholder="https://linkedin.com/company/usuario"
                    />
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>
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
