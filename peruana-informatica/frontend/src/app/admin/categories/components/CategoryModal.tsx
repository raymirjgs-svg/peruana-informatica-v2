'use client';

import type { Category, CategoryFormData } from './types';

interface CategoryModalProps {
  editingCategory: Category | null;
  form: CategoryFormData;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAppearsInMenuChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeoTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeoDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function CategoryModal({
  editingCategory,
  form,
  onSubmit,
  onClose,
  onNameChange,
  onSlugChange,
  onAppearsInMenuChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: CategoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.name}
              onChange={onNameChange}
              placeholder="Ej: Laptops"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              value={form.slug}
              onChange={onSlugChange}
              placeholder="ej: laptops"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="appears_in_menu"
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              checked={form.appears_in_menu}
              onChange={onAppearsInMenuChange}
            />
            <label htmlFor="appears_in_menu" className="text-sm font-medium text-gray-700">
              Mostrar en menú
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título SEO
            </label>
            <input
              type="text"
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.seo_title}
              onChange={onSeoTitleChange}
              placeholder="Título para motores de búsqueda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción SEO
            </label>
            <textarea
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.seo_description}
              onChange={onSeoDescriptionChange}
              placeholder="Descripción para motores de búsqueda"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {editingCategory ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
