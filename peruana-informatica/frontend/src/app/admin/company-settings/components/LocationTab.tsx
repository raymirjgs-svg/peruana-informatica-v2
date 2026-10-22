'use client';

import { Store, MapPin, Clock } from 'lucide-react';
import type { CompanySettingsForm } from './types';

interface LocationTabProps {
  formData: CompanySettingsForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function LocationTab({ formData, onChange }: LocationTabProps) {
  return (
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
              onChange={onChange}
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
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
            />
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
