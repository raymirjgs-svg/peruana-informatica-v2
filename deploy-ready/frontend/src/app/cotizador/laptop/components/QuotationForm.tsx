// src/app/cotizador/laptop/components/QuotationForm.tsx
'use client';

import { useState } from 'react';

interface Product {
  cod_producto: number;
  name: string;
  slug: string;
  description: string;
  price: number | string; // Accept both number and string
  stock: number;
  component_specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    screen_size?: string;
  };
}

interface QuotationFormData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  delivery_method: 'pickup';
  special_requirements?: string;
}

interface QuotationFormProps {
  laptop: Product;
  onSubmit: (data: QuotationFormData) => void;
}

export default function QuotationForm({ laptop, onSubmit }: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationFormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    client_ruc: '',
    client_address: '',
    delivery_method: 'pickup',
    special_requirements: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nombre es requerido';
    }
    
    if (!formData.client_email.trim()) {
      newErrors.client_email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Email no válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.client_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingresa tu nombre completo"
          />
          {errors.client_name && (
            <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico *
          </label>
          <input
            type="email"
            id="client_email"
            name="client_email"
            value={formData.client_email}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.client_email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
          />
          {errors.client_email && (
            <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>
          )}
        </div>

        <div>
          <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            id="client_phone"
            name="client_phone"
            value={formData.client_phone}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej. 999 888 777"
          />
        </div>

        <div>
          <label htmlFor="client_company" className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <input
            type="text"
            id="client_company"
            name="client_company"
            value={formData.client_company}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre de tu empresa"
          />
        </div>

        <div>
          <label htmlFor="client_ruc" className="block text-sm font-medium text-gray-700 mb-1">
            RUC
          </label>
          <input
            type="text"
            id="client_ruc"
            name="client_ruc"
            value={formData.client_ruc}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="11 dígitos"
          />
        </div>

        <div>
          <label htmlFor="client_address" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            id="client_address"
            name="client_address"
            value={formData.client_address}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dirección completa para facturación"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Método de entrega</h3>
        <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500 mr-3 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <label className="font-medium text-gray-800">Recojo en tienda</label>
              <p className="text-sm text-gray-600">Recoge tu pedido en nuestras instalaciones</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📍 Dirección de tienda: Av. Principal 123, Lima - Perú
        </p>
      </div>

      <div>
        <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700 mb-1">
          Requerimientos especiales
        </label>
        <textarea
          id="special_requirements"
          name="special_requirements"
          value={formData.special_requirements}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Horarios de entrega, configuraciones especiales, etc."
        ></textarea>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium text-lg"
        >
          Generar Cotización
        </button>
      </div>
    </form>
  );
}