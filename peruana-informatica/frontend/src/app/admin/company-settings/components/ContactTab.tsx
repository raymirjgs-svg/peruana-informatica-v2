'use client';

import { Phone, Mail, Globe } from 'lucide-react';
import type { CompanySettingsForm } from './types';

interface ContactTabProps {
  formData: CompanySettingsForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function ContactTab({ formData, onChange }: ContactTabProps) {
  return (
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
              onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="https://www.peruanainformatica.com"
            />
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
