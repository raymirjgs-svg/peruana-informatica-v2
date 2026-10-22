'use client';

interface BlogFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: (event: React.FormEvent) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}

export function BlogFilters({
  searchTerm,
  onSearchTermChange,
  onSearch,
  selectedCategory,
  onCategoryChange,
}: BlogFiltersProps) {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={onSearch} className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Buscar artículos..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Buscar
            </button>
          </div>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todas las categorías</option>
          <option value="Laptops">Laptops</option>
          <option value="Gaming">Gaming</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Reviews">Reviews</option>
          <option value="Guías">Guías</option>
        </select>
      </div>
    </div>
  );
}
