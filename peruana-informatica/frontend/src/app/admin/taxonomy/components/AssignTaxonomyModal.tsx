'use client';

import type { Product } from '@/models/Product';
import type { TaxonomyForm } from './types';

interface AssignTaxonomyModalProps {
  product: Product;
  formData: TaxonomyForm;
  onChange: (data: TaxonomyForm) => void;
  onCancel: () => void;
  onAssign: () => void;
  assigning: boolean;
}

export function AssignTaxonomyModal({
  product,
  formData,
  onChange,
  onCancel,
  onAssign,
  assigning,
}: AssignTaxonomyModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Asignar Taxonomía: {product.name}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => onChange({ ...formData, brandName: e.target.value })}
              placeholder="Nombre de la marca..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) => onChange({ ...formData, categoryName: e.target.value })}
              placeholder="Nombre de la categoría..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías (separadas por comas)</label>
            <input
              type="text"
              value={formData.subCategoryNames.join(', ')}
              onChange={(e) => onChange({
                ...formData,
                subCategoryNames: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              placeholder="Subcategoría 1, Subcategoría 2..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onAssign}
            disabled={assigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {assigning ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}
