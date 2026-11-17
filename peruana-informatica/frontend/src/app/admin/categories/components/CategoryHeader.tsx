'use client';

interface CategoryHeaderProps {
  categoriesCount: number;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateCategory: () => void;
}

export function CategoryHeader({
  categoriesCount,
  searchTerm,
  onSearchChange,
  onCreateCategory,
}: CategoryHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías y Subcategorías</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categoriesCount} categoría{categoriesCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreateCategory}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-medium"
        >
          <span className="text-xl">+</span>
          Nueva Categoría
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <input
          type="text"
          placeholder="Buscar categorías o subcategorías..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </>
  );
}
