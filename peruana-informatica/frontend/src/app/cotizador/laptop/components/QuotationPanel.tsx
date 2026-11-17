import QuotationForm from './QuotationForm';
import { Product } from '../types';

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

interface QuotationPanelProps {
  laptop: Product;
  loading: boolean;
  onSubmit: (formData: unknown) => void;
  onClose: () => void;
}

export function QuotationPanel({ laptop, loading, onSubmit, onClose }: QuotationPanelProps) {
  return (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cotización - {laptop.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-600"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3V5m0 0V12m0-9h9m-9 0a2 2 0 01-2-2V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{laptop.name}</h3>
              <div className="text-gray-600 text-sm">
                <p>S/. {
                  typeof laptop.price === 'number'
                    ? laptop.price.toFixed(2)
                    : typeof laptop.price === 'string'
                      ? parseFloat(laptop.price).toFixed(2)
                      : '0.00'
                }</p>
                <p>Código: {laptop.codigo_interno}</p>
              </div>
            </div>
          </div>

          <QuotationForm
            laptop={laptop}
            onSubmit={onSubmit}
          />
        </div>
  );
}
