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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Categorías y Subcategorías</h1>
          <p className="text-sm dark:text-gray-400 mt-1">
            {categoriesCount} categoría{categoriesCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreateCategory}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center gap-2 font-medium"
        >
          <span className="text-xl">+</span>
          Nueva Categoría
        </button>
      </div>

      {/* Búsqueda */}
      <div className="dark:bg-gray-900 p-4 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
        <input
          type="text"
          placeholder="Buscar categorías o subcategorías..."
          className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </>
  );
}
