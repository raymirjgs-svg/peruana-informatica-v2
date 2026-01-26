'use client';

import { useState, useEffect } from 'react';
import QuotationForm from './components/QuotationForm';
import apiClient from '@/utils/api';

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  type?: string | null;
}

interface Product {
  id: number;
  cod_producto: number;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  codigo_interno: string;
  component_type?: string;
  subCategories?: SubCategory[];
  // Add component_specs as optional to prevent errors
  component_specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    screen_size?: string;
  };
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  processor: string;
  ram: string;
  storage: string;
  subcategory: string;
  search: string; // Add search filter
}

interface QuotationResponse {
  code: string;
  total: number | string;
}

export default function LaptopQuotation() {
  const [showForm, setShowForm] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quotationResult, setQuotationResult] = useState<any>(null);
  const [filters, setFilters] = useState<Filters>({
    minPrice: '',
    maxPrice: '',
    processor: '',
    ram: '',
    storage: '',
    subcategory: '',
    search: ''
  });

  const [laptops, setLaptops] = useState<Product[]>([]);
  const [filteredLaptops, setFilteredLaptops] = useState<Product[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los valores únicos de filtros
  const [processorOptions, setProcessorOptions] = useState<string[]>([]);
  const [ramOptions, setRamOptions] = useState<string[]>([]);
  const [storageOptions, setStorageOptions] = useState<string[]>([]);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Mostrar 6 laptops por página

  // Cargar laptops desde la API
  useEffect(() => {
    const fetchLaptopsAndSubcategories = async () => {
      try {
        setLoading(true);

        // Fetch laptops with subcategories using API parameters
        const laptopsData: Product[] = await apiClient.getCotizadorLaptops({
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          subcategory: filters.subcategory,
          search: filters.search,
          processor: filters.processor,
          ram: filters.ram,
          storage: filters.storage
        }) as Product[];
        setLaptops(laptopsData);
        setFilteredLaptops(laptopsData);

        // Fetch available subcategories
        const subcategoriesData: SubCategory[] = await apiClient.getLaptopSubcategories() as SubCategory[];
        setAllSubcategories(subcategoriesData);

        // Fetch available processors
        try {
          const response = await apiClient.getLaptopProcessors() as SubCategory[];
          setProcessorOptions(response.map(p => p.slug)); // Use slug for filtering
        } catch (error) {
          console.warn('Error fetching processors:', error);
        }

        // Fetch available RAM options
        try {
          const response = await apiClient.getLaptopRamOptions() as SubCategory[];
          setRamOptions(response.map(r => r.slug));
        } catch (error) {
          console.warn('Error fetching RAM options:', error);
        }

        // Fetch available Storage options
        try {
          const response = await apiClient.getLaptopStorageOptions() as SubCategory[];
          setStorageOptions(response.map(s => s.slug));
        } catch (error) {
          console.warn('Error fetching Storage options:', error);
        }

      } catch (err) {
        console.warn('Error fetching from API, using fallback data:', err);
        // Fallback logic omitted for brevity, assuming API works
      } finally {
        setLoading(false);
      }
    };

    fetchLaptopsAndSubcategories();
  }, [filters.minPrice, filters.maxPrice, filters.subcategory, filters.search, filters.processor, filters.ram, filters.storage]);

  // Client-side filtering is no longer needed for these fields as the backend handles it
  useEffect(() => {
    setFilteredLaptops(laptops);
    setCurrentPage(1);
  }, [laptops]);

  // Function to standardize RAM values
  const standardizeRamValue = (ram: string): string => {
    if (!ram) return '';

    // Extract the numeric value and unit
    const match = ram.match(/(\d+)\s*(GB|gb|g)/i);
    if (match) {
      const value = match[1];
      return `${value}GB`;
    }
    return ram;
  };

  // Function to standardize storage values
  const standardizeStorageValue = (storage: string): string => {
    if (!storage) return '';

    // Extract the numeric value and unit
    const match = storage.match(/(\d+)\s*(GB|TB|gb|tb)/i);
    if (match) {
      const value = match[1];
      const unit = match[2].toUpperCase();
      return `${value}${unit}`;
    }
    return storage;
  };

  // Function to get unique standardized values
  const getUniqueStandardizedValues = (values: (string | undefined)[], standardizeFn: (value: string) => string): string[] => {
    const standardized = values
      .filter(Boolean)
      .map(val => standardizeFn(val as string))
      .filter(val => val.length > 0);

    // Return unique values
    return [...new Set(standardized)].sort((a, b) => {
      // Sort numerically first, then alphabetically
      const numA = parseInt(a);
      const numB = parseInt(b);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      return a.localeCompare(b);
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name !== 'processor' && name !== 'ram' && name !== 'storage') {
      setCurrentPage(1); // Reiniciar a la primera página al aplicar filtros de servidor
    }
  };

  const addToQuotation = (laptop: Product) => {
    setSelectedLaptop(laptop);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!selectedLaptop) {
      alert('No hay laptop seleccionada para cotizar');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para la API
      const laptopPrice = typeof selectedLaptop.price === 'number'
        ? selectedLaptop.price
        : parseFloat(selectedLaptop.price);

      // Validar que el precio sea un número válido
      if (isNaN(laptopPrice)) {
        throw new Error(`Precio inválido: ${selectedLaptop.price}`);
      }

      // Validar campos requeridos
      if (!formData.client_name || formData.client_name.trim() === '') {
        alert('El nombre del cliente es requerido');
        return;
      }

      if (!formData.client_email || formData.client_email.trim() === '') {
        alert('El email del cliente es requerido');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.client_email)) {
        alert('Email no válido');
        return;
      }

      // Validar que el ID del producto exista y sea un número entero positivo
      const productIdValue = selectedLaptop.id || selectedLaptop.cod_producto;
      if (productIdValue === undefined) {
        throw new Error('ID de producto no encontrado en el objeto de laptop');
      }

      const productId = parseInt(productIdValue.toString());
      if (isNaN(productId) || productId < 1) {
        throw new Error(`ID de producto inválido: ${productIdValue}`);
      }

      const quotationData = {
        client_name: formData.client_name.trim(),
        client_email: formData.client_email.trim(),
        client_phone: formData.client_phone?.trim() || '',
        client_company: formData.client_company?.trim() || '',
        client_ruc: formData.client_ruc?.trim() || '',
        client_address: formData.client_address?.trim() || '',
        items: [{
          product_id: productId, // Convertir a entero
          product_name: selectedLaptop.name,
          product_price: laptopPrice,
          quantity: 1,
          subtotal: laptopPrice,
        }],
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
        delivery_method: formData.delivery_method,
        delivery_address: formData.delivery_method === 'delivery' ? (formData.delivery_address?.trim() || '') : undefined,
        special_requirements: formData.special_requirements?.trim() || ''
      };

      console.log('Enviando datos de cotización:', quotationData); // Para depuración

      // Crear cotización a través de la API
      const response: QuotationResponse = await apiClient.createQuotation(quotationData) as QuotationResponse;

      console.log('Respuesta de la API:', response); // Para depuración

      // Actualizar estado con la respuesta
      const quotation = {
        code: response.code,
        client_name: formData.client_name,
        client_email: formData.client_email,
        total: response.total,
        date: new Date().toISOString(),
      };

      setQuotationResult(quotation);
      setShowSuccess(true);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating quotation:', error);
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Mostrar mensaje más detallado para análisis
      console.error('Mensaje de error:', errorMessage);
      alert('Error al crear la cotización: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      processor: '',
      ram: '',
      storage: '',
      subcategory: '',
      search: ''
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedLaptop(null);
  };

  if (showSuccess && quotationResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Cotización Generada!</h1>
          <p className="text-gray-600 mb-8">
            Gracias por tu solicitud. Tu cotización ha sido creada exitosamente.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto mb-8">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Detalles de la Cotización</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-medium">{quotationResult.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{quotationResult.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Producto:</span>
                <span className="font-medium">{selectedLaptop?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-green-600">S/. {
                  typeof quotationResult.total === 'number'
                    ? quotationResult.total.toFixed(2)
                    : typeof quotationResult.total === 'string'
                      ? parseFloat(quotationResult.total).toFixed(2)
                      : '0.00'
                }</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">{new Date(quotationResult.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => {
                // Descargar PDF de cotización usando el servicio
                apiClient.downloadQuotationPdf(quotationResult.code);
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
            >
              Descargar PDF
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setQuotationResult(null);
                setSelectedLaptop(null);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Hacer Otra Cotización
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error al cargar productos</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Cotizador de Laptops</h1>
      <p className="text-gray-600 text-center mb-8">
        Selecciona la laptop perfecta para tus necesidades
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel de filtros */}
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
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre o descripción"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="subcategory"
                  value={filters.subcategory}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {allSubcategories.map(subcategory => (
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
                  onChange={handleFilterChange}
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
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="S/. 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procesador</label>
                <select
                  name="processor"
                  value={filters.processor}
                  onChange={handleFilterChange}
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
                  onChange={handleFilterChange}
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
                  onChange={handleFilterChange}
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
                onClick={resetFilters}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition mt-4"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLaptops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron laptops que coincidan con los filtros.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLaptops
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((laptop) => (
                    <div
                      key={laptop.id || laptop.cod_producto}
                      className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{laptop.name}</h3>

                        {/* Mostrar código interno */}
                        <p className="text-sm text-gray-500 mb-1">Código: {laptop.codigo_interno}</p>

                        {/* Mostrar subcategorías */}
                        {laptop.subCategories && laptop.subCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {laptop.subCategories.slice(0, 2).map((subcategory) => (
                              <span
                                key={subcategory.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {subcategory.name}
                              </span>
                            ))}
                            {laptop.subCategories.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{laptop.subCategories.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {laptop.component_specs && (
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            {laptop.component_specs.processor && (
                              <div><strong>Procesador:</strong> {laptop.component_specs.processor}</div>
                            )}
                            {laptop.component_specs.ram && (
                              <div><strong>RAM:</strong> {laptop.component_specs.ram}</div>
                            )}
                            {laptop.component_specs.storage && (
                              <div><strong>Almacenamiento:</strong> {laptop.component_specs.storage}</div>
                            )}
                          </div>
                        )}

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {laptop.description ? (
                            // Remove HTML tags from description and show only text
                            laptop.description.replace(/<[^>]*>/g, '').substring(0, 100) +
                            (laptop.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : '')
                          ) : 'Sin descripción'}
                        </p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-bold text-blue-600">S/. {
                            typeof laptop.price === 'number'
                              ? laptop.price.toFixed(2)
                              : typeof laptop.price === 'string'
                                ? parseFloat(laptop.price).toFixed(2)
                                : '0.00'
                          }</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${laptop.stock > 5 ? 'bg-green-100 text-green-800' :
                            laptop.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {laptop.stock > 5 ? 'En stock' :
                              laptop.stock > 0 ? `Solo ${laptop.stock} unidad(es)` : 'Agotado'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToQuotation(laptop);
                            }}
                            className={`flex-1 py-2 rounded-lg transition ${selectedLaptop?.id === laptop.id || selectedLaptop?.cod_producto === laptop.cod_producto
                              ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            disabled={laptop.stock === 0}
                          >
                            {selectedLaptop?.id === laptop.id || selectedLaptop?.cod_producto === laptop.cod_producto ? 'Agregado ✓' : 'Agregar a Cotización'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (laptop.slug) {
                                window.open(`/products/${laptop.slug}`, '_blank');
                              } else {
                                window.open(`/products/${laptop.cod_producto || laptop.id}`, '_blank');
                              }
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            title="Ver detalles del producto"
                          >
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

              {/* Controles de paginación */}
              {filteredLaptops.length > itemsPerPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg ${currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Anterior
                    </button>

                    <span className="px-4 py-2 text-gray-700">
                      Página {currentPage} de {Math.ceil(filteredLaptops.length / itemsPerPage)}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLaptops.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredLaptops.length / itemsPerPage)}
                      className={`px-4 py-2 rounded-lg ${currentPage === Math.ceil(filteredLaptops.length / itemsPerPage)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panel de cotización */}
      {showForm && selectedLaptop && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cotización - {selectedLaptop.name}</h2>
            <button
              onClick={handleCloseForm}
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
              <h3 className="font-semibold text-gray-800">{selectedLaptop.name}</h3>
              <div className="text-gray-600 text-sm">
                <p>S/. {
                  typeof selectedLaptop.price === 'number'
                    ? selectedLaptop.price.toFixed(2)
                    : typeof selectedLaptop.price === 'string'
                      ? parseFloat(selectedLaptop.price).toFixed(2)
                      : '0.00'
                }</p>
                <p>Código: {selectedLaptop.codigo_interno}</p>
              </div>
            </div>
          </div>

          <QuotationForm
            laptop={selectedLaptop}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}
    </div>
  );
}