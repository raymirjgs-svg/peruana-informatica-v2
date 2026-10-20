'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/api';
import { cleanHtmlText } from '@/utils/text';
import { Product, SubCategory, Filters, QuotationResponse } from './types';
import { LaptopFilters } from './components/LaptopFilters';
import { LaptopList } from './components/LaptopList';
import { QuotationSuccess } from './components/QuotationSuccess';
import { QuotationPanel } from './components/QuotationPanel';

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
        const laptopsData: Product[] = (await apiClient.getCotizadorLaptops({
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          subcategory: filters.subcategory,
          search: filters.search,
          processor: filters.processor,
          ram: filters.ram,
          storage: filters.storage
        }) as Product[]).map((laptop) => ({
          ...laptop,
          short_description: cleanHtmlText(laptop.short_description),
        }));
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
        console.error('Error fetching laptops from API:', err);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las laptops. Intenta nuevamente.');
        setLaptops([]);
        setFilteredLaptops([]);
        setAllSubcategories([]);
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
      <QuotationSuccess
        result={quotationResult}
        productName={selectedLaptop?.name}
        onDownload={() => apiClient.downloadQuotationPdf(quotationResult.code)}
        onReset={() => {
          setShowSuccess(false);
          setQuotationResult(null);
          setSelectedLaptop(null);
        }}
      />
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
        <LaptopFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          subcategories={allSubcategories}
          processorOptions={processorOptions}
          ramOptions={ramOptions}
          storageOptions={storageOptions}
        />

        <LaptopList
          loading={loading}
          laptops={filteredLaptops}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          selectedLaptop={selectedLaptop}
          onAdd={addToQuotation}
        />
      </div>

      {showForm && selectedLaptop && (
        <QuotationPanel
          laptop={selectedLaptop}
          loading={loading}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
