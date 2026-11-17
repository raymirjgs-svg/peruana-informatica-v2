'use client';

import type { BulkTaxonomyForm } from './types';

interface BulkAssignmentPanelProps {
  bulkFormData: BulkTaxonomyForm;
  onChange: (data: BulkTaxonomyForm) => void;
  onAssign: () => void;
  assigning: boolean;
}

export function BulkAssignmentPanel({
  bulkFormData,
  onChange,
  onAssign,
  assigning,
}: BulkAssignmentPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Asignación Masiva</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
          <input
            type="text"
            value={bulkFormData.brandName}
            onChange={(e) => onChange({ ...bulkFormData, brandName: e.target.value })}
            placeholder="Nombre de la marca..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <input
            type="text"
            value={bulkFormData.categoryName}
            onChange={(e) => onChange({ ...bulkFormData, categoryName: e.target.value })}
            placeholder="Nombre de la categoría..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías (separadas por comas)</label>
          <input
            type="text"
            value={bulkFormData.subCategoryNames.join(', ')}
            onChange={(e) => onChange({
              ...bulkFormData,
              subCategoryNames: e.target.value.split(',').map(s => s.trim()).filter(s => s)
            })}
            placeholder="Subcategoría 1, Subcategoría 2..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={onAssign}
        disabled={assigning || bulkFormData.productIds.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {assigning ? 'Asignando...' : `Asignar a ${bulkFormData.productIds.length} productos seleccionados`}
      </button>
    </div>
  );
}
