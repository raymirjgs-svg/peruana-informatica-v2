'use client';

import type { Category, SubCategory } from './types';

interface CategoryListProps {
  loading: boolean;
  filteredCategories: Category[];
  expandedCategories: Set<number>;
  toggleCategory: (categoryId: number) => void;
  onCreateSubcategory: (categoryId: number) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: number) => void;
  onEditSubcategory: (subcategory: SubCategory) => void;
  onDeleteSubcategory: (id: number) => void;
}

export function CategoryList({
  loading,
  filteredCategories,
  expandedCategories,
  toggleCategory,
  onCreateSubcategory,
  onEditCategory,
  onDeleteCategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryListProps) {
  return (
    <>
      {/* Lista de Categorías */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron categorías</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const subcategories = category.subcategories || [];

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Categoría Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <span className={`transition-transform text-blue-600 ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
                        <p className="text-sm text-gray-600">
                          <code className="bg-blue-100 px-2 py-0.5 rounded">{category.slug}</code>
                          {" • "}
                          {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCreateSubcategory(category.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <span>+</span>
                        Subcategoría
                      </button>
                      <button
                        onClick={() => onEditCategory(category)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteCategory(category.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategorías */}
                {isExpanded && (
                  <div className="p-6 bg-gray-50">
                    {subcategories.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No hay subcategorías.
                        <button
                          onClick={() => onCreateSubcategory(category.id)}
                          className="text-blue-600 hover:underline ml-1"
                        >
                          Crear una ahora
                        </button>
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {subcategories.map(subcategory => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow border border-gray-200"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Slug: <code className="bg-gray-200 px-2 py-0.5 rounded">{subcategory.slug}</code>
                                {" • "}Orden: {subcategory.order}
                              </p>
                              {subcategory.description && (
                                <p className="text-sm text-gray-600 mt-1">{subcategory.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onEditSubcategory(subcategory)}
                                className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => onDeleteSubcategory(subcategory.id)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
