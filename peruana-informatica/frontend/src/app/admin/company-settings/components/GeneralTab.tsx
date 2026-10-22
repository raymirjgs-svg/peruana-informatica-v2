'use client';

import { Building2, MapPin } from 'lucide-react';
import type { CompanySettingsForm } from './types';

interface GeneralTabProps {
  formData: CompanySettingsForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function GeneralTab({ formData, onChange }: GeneralTabProps) {
  return (
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
              onChange={onChange}
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
            onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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
  );
}
