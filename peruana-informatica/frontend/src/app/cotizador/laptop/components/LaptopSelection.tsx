// src/app/cotizador/laptop/components/LaptopSelection.tsx
import { useState, useEffect } from 'react';
import { ProductService } from '@/services/ProductService';

interface Laptop {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  specifications?: {
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    screen?: string;
  };
}

interface LaptopSelectionProps {
  onSelect: (laptop: Laptop) => void;
  selectedLaptop: Laptop | null;
}

export default function LaptopSelection({ onSelect, selectedLaptop }: LaptopSelectionProps) {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [filteredLaptops, setFilteredLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    processor: '',
    ram: '',
    storage: ''
  });

  // Cargar laptops al iniciar
  useEffect(() => {
    const fetchLaptops = async () => {
      try {
        setLoading(true);
        const productService = new ProductService();
        const response = await productService.getProducts(
          1,
          50,
          {}
        );

        // Filtrar productos que contengan "laptop" en el nombre o descripción
        const laptopProducts = response.products
          .filter((product: any) =>
            product.name.toLowerCase().includes('laptop') ||
            product.name.toLowerCase().includes('notebook') ||
            product.name.toLowerCase().includes('macbook')
          )
          .map((product: any) => ({
            id: product.cod_producto,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            stock: product.stock || 0,
            specifications: {
              processor: product.specs?.processor || product.component_specs?.processor,
              ram: `${product.specs?.ram || product.component_specs?.ram || 'N/A'} RAM`,
              storage: product.specs?.storage || product.component_specs?.storage || 'N/A',
              graphics: product.specs?.graphics || product.component_specs?.graphics || 'N/A',
              screen: product.specs?.screen || product.component_specs?.screen || 'N/A'
            }
          }));

        setLaptops(laptopProducts);
        setFilteredLaptops(laptopProducts);
      } catch (error) {
        console.error('Error fetching laptops:', error);
        // Datos de ejemplo para mostrar en caso de error
        const mockLaptops: Laptop[] = [
          {
            id: 1,
            name: 'Laptop Dell Inspiron 15',
            slug: 'laptop-dell-inspiron-15',
            description: 'Laptop Dell Inspiron 15 con Intel Core i5, 8GB RAM, 256GB SSD',
            price: 2499.00,
            stock: 15,
            specifications: {
              processor: 'Intel Core i5-1135G7',
              ram: '8GB DDR4',
              storage: '256GB SSD',
              graphics: 'Intel Iris Xe',
              screen: '15.6" Full HD'
            }
          },
          {
            id: 2,
            name: 'Laptop HP Pavilion Gaming',
            slug: 'laptop-hp-pavilion-gaming',
            description: 'Laptop HP Pavilion Gaming con AMD Ryzen 5, 16GB RAM, GTX 1650',
            price: 3299.00,
            stock: 8,
            specifications: {
              processor: 'AMD Ryzen 5 5600H',
              ram: '16GB DDR4',
              storage: '512GB SSD',
              graphics: 'NVIDIA GTX 1650 4GB',
              screen: '15.6" Full HD 144Hz'
            }
          },
          {
            id: 3,
            name: 'MacBook Air M2',
            slug: 'macbook-air-m2',
            description: 'MacBook Air con chip M2, 8GB RAM, 256GB SSD',
            price: 5499.00,
            stock: 5,
            specifications: {
              processor: 'Apple M2 Chip',
              ram: '8GB unified memory',
              storage: '256GB SSD',
              graphics: '8-core GPU',
              screen: '13.6" Retina'
            }
          }
        ];
        setLaptops(mockLaptops);
        setFilteredLaptops(mockLaptops);
      } finally {
        setLoading(false);
      }
    };

    fetchLaptops();
  }, []);

  //Aplicar filtros
  useEffect(() => {
    let result = [...laptops];

    // Filtrar por precio
    if (filters.minPrice) {
      result = result.filter(laptop => laptop.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(laptop => laptop.price <= parseFloat(filters.maxPrice));
    }

    // Filtrar por procesador
    if (filters.processor) {
      result = result.filter(laptop =>
        laptop.specifications?.processor?.toLowerCase().includes(filters.processor.toLowerCase())
      );
    }

    // Filtrar por RAM
    if (filters.ram) {
      result = result.filter(laptop =>
        laptop.specifications?.ram?.toLowerCase().includes(filters.ram.toLowerCase())
      );
    }

    // Filtrar por almacenamiento
    if (filters.storage) {
      result = result.filter(laptop =>
        laptop.specifications?.storage?.toLowerCase().includes(filters.storage.toLowerCase())
      );
    }

    setFilteredLaptops(result);
  }, [filters, laptops]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Panel de filtros */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filtros</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mínimo</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="S/. 0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="S/. 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procesador</label>
              <input
                type="text"
                name="processor"
                value={filters.processor}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej. i5, Ryzen 5..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
              <input
                type="text"
                name="ram"
                value={filters.ram}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej. 8GB, 16GB..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Almacenamiento</label>
              <input
                type="text"
                name="storage"
                value={filters.storage}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej. 256GB SSD..."
              />
            </div>

            <button
              onClick={() => setFilters({ minPrice: '', maxPrice: '', processor: '', ram: '', storage: '' })}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de laptops */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredLaptops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron laptops que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLaptops.map((laptop) => (
              <div key={laptop.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{laptop.name}</h3>

                  {laptop.specifications && (
                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <div><strong>Procesador:</strong> {laptop.specifications.processor}</div>
                      <div><strong>RAM:</strong> {laptop.specifications.ram}</div>
                      <div><strong>Almacenamiento:</strong> {laptop.specifications.storage}</div>
                    </div>
                  )}

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{laptop.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-blue-600">S/. {laptop.price.toFixed(2)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${laptop.stock > 5 ? 'bg-green-100 text-green-800' :
                      laptop.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {laptop.stock > 5 ? 'En stock' :
                        laptop.stock > 0 ? `Solo ${laptop.stock} unidad(es)` : 'Agotado'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelect(laptop)}
                      className={`flex-1 py-2 rounded-lg transition ${selectedLaptop?.id === laptop.id
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      disabled={laptop.stock === 0}
                    >
                      {selectedLaptop?.id === laptop.id ? 'Seleccionado ✓' : 'Seleccionar'}
                    </button>

                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}