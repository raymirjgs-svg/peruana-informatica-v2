
'use client';

import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSettings } from '@/context/SettingsContext';
import { API_CONFIG } from '@/config/api';
import { adminFetch } from '@/lib/adminApi';
import { toast } from 'sonner';
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
  Store,
  Share2,
  Image as ImageIcon,
  Upload
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
  favicon_url?: string;
  show_distributor_price_in_detail?: boolean;
}

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanySettings>({
    id: 1,
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
    favicon_url: '',
    show_distributor_price_in_detail: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminFetch('/admin/company-settings');
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          ...data
        });

        // Set previews
        if (data.logo_url) setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.logo_url}`);
        if (data.favicon_url) setFaviconPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.favicon_url}`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error al cargar configuración');
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFaviconPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Update text fields first
      const res = await adminFetch('/admin/company-settings', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al guardar datos');

      // 2. Upload Logo if selected
      const logoFile = logoInputRef.current?.files?.[0];
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('logo', logoFile);

        const resLogo = await adminFetch('/admin/company-settings/upload-logo', {
          method: 'POST',
          body: logoData,
        });

        if (resLogo.ok) {
          const data = await resLogo.json();
          setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.url}`);
        }
      }

      // 3. Upload Favicon if selected
      const faviconFile = faviconInputRef.current?.files?.[0];
      if (faviconFile) {
        const favData = new FormData();
        favData.append('favicon', faviconFile);

        const resFav = await adminFetch('/admin/company-settings/upload-favicon', {
          method: 'POST',
          body: favData,
        });

        if (resFav.ok) {
          const data = await resFav.json();
          setFaviconPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.url}`);
        }
      }

      toast.success('Configuración actualizada exitosamente');
      await refreshSettings();

    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'identity', label: 'Identidad Visual', icon: ImageIcon },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'location', label: 'Ubicación', icon: Store },
    { id: 'social', label: 'Redes Sociales', icon: Share2 },
  ];

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

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración de Empresa</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administra la información pública de tu negocio</p>
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

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[400px]">

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

          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="p-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                Identidad Visual
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">Logo del Sitio</label>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Visible en Header y Footer</span>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors group relative">
                    <input
                      type="file"
                      id="logo-upload"
                      ref={logoInputRef}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleLogoChange}
                    />

                    {logoPreview ? (
                      <div className="relative h-32 w-full flex items-center justify-center">
                        <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <span className="text-white font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Cambiar imagen</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="bg-blue-100 p-4 rounded-full mb-3 text-blue-600">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                        <p className="text-gray-500 font-medium">Arrastra o selecciona un logo</p>
                        <p className="text-xs text-gray-400 mt-1">PNG transparente recomendado</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">Icono de Pestaña (Favicon)</label>
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Icono del navegador</span>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors group relative">
                    <input
                      type="file"
                      id="favicon-upload"
                      ref={faviconInputRef}
                      accept="image/x-icon,image/png,image/svg+xml"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFaviconChange}
                    />

                    {faviconPreview ? (
                      <div className="relative h-16 w-16 mx-auto mb-3">
                        <img src={faviconPreview} alt="Favicon Preview" className="h-full w-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="bg-purple-100 p-4 rounded-full mb-3 text-purple-600">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                        <p className="text-gray-500 font-medium">Selecciona un icono</p>
                        <p className="text-xs text-gray-400 mt-1">.ico o .png 32x32px</p>
                      </div>
                    )}
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
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
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
