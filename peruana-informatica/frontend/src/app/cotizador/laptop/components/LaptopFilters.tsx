import { Filters, SubCategory } from '../types';

interface LaptopFiltersProps {
  filters: Filters;
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onReset: () => void;
  subcategories: SubCategory[];
  processorOptions: string[];
  ramOptions: string[];
  storageOptions: string[];
}

export function LaptopFilters({
  filters,
  onFilterChange,
  onReset,
  subcategories,
  processorOptions,
  ramOptions,
  storageOptions,
}: LaptopFiltersProps) {
  return (
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Filtros</h2>

            <div className="space-y-4">
              {/* Search filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre o descripción"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="subcategory"
                  value={filters.subcategory}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.slug}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mínimo</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="S/. 0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="S/. 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procesador</label>
                <select
                  name="processor"
                  value={filters.processor}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los procesadores</option>
                  {processorOptions.map((processor, index) => (
                    <option key={index} value={processor}>
                      {processor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
                <select
                  name="ram"
                  value={filters.ram}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Toda la RAM</option>
                  {ramOptions.map((ram, index) => (
                    <option key={index} value={ram}>
                      {ram}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Almacenamiento</label>
                <select
                  name="storage"
                  value={filters.storage}
                  onChange={onFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todo el almacenamiento</option>
                  {storageOptions.map((storage, index) => (
                    <option key={index} value={storage}>
                      {storage}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={onReset}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition mt-4"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
  );
}
