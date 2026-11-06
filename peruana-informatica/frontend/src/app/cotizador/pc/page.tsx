'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/api';
import QuotationSummary from '@/components/quotation/QuotationSummary';
import Link from 'next/link';

interface Product {
  cod_producto: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceWeb?: number;
  priceCot?: number;
  priceDis?: number;
  stock: number;
  codigo_interno: string;
  component_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component_specs?: any;
  socket_type?: string;
  ram_type?: string;
  form_factor?: string;
  has_integrated_graphics?: boolean;
  tdp_watts?: number;
  [key: string]: string | number | boolean | undefined | object;
}

interface PCBuild {
  motherboard?: Product;
  cpu?: Product;
  ram?: Product;
  storage?: Product;
  gpu?: Product;
  case?: Product;
  psu?: Product;
}

export default function PCBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Motherboard, 2: CPU, 3: RAM, etc.
  const [pcBuild, setPcBuild] = useState<PCBuild>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibleProducts, setCompatibleProducts] = useState<Product[]>([]);
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Estados para filtros y paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Tipos de componentes en orden
  type ComponentStep = { type: string; name: string; icon: string };
  const defaultStep: ComponentStep = { type: 'motherboard', name: 'Placa Madre', icon: '🔌' };
  const componentSteps: ComponentStep[] = [
    defaultStep,
    { type: 'processor', name: 'Procesador', icon: '🧠' },
    { type: 'ram', name: 'Memoria RAM', icon: '💾' },
    { type: 'storage', name: 'Almacenamiento', icon: '📦' },
    { type: 'gpu', name: 'Tarjeta Gráfica', icon: '🎮' },
    { type: 'case', name: 'Gabinete', icon: '🖥️' },
    { type: 'power_supply', name: 'Fuente de Poder', icon: '⚡' },
  ];

  // Helper para obtener el paso actual de forma segura
  const getStep = (index: number): ComponentStep => componentSteps[index] ?? defaultStep;

  // Cargar productos al iniciar
  useEffect(() => {
    // Cargar productos compatibles para el primer paso (motherboard)
    loadCompatibleProducts('motherboard', null);
  }, []);

  // Cargar productos compatibles usando el backend
  const loadCompatibleProducts = async (
    componentType: string,
    parentId: number | null, // Deprecated but kept for signature compatibility
    page: number = 1,
    search: string = '',
    subcategoryId: number | null = null
  ) => {
    try {
      setLoading(true);
      setCompatibilityError(null);

      // 1. Obtener IDs de productos seleccionados actualmente
      const selectedProductIds: number[] = Object.values(pcBuild)
        .filter(p => p !== undefined && p !== null)
        .map(p => (p as Product).cod_producto);

      let params: any = {
        page: page.toString(),
        limit: '12',
      };

      if (search) params.search = search;
      if (subcategoryId) params.subcategory = subcategoryId;

      // Optimización: Si no hay nada seleccionado (Paso 1), no filtramos por compatibilidad
      // Simplemente traemos todos los de ese tipo.
      if (selectedProductIds.length === 0) {
        params.component_type = componentType;
      } else {
        // 2. Pedir al backend los IDs compatibles
        const compatibilityResult = await apiClient.filterCompatibleProducts(componentType, selectedProductIds) as any;
        const validIds = compatibilityResult.data?.compatibleProductIds || [];

        console.log(`🔍 Compatibility for ${componentType}:`, validIds.length, 'valid IDs found');

        if (validIds.length === 0) {
          setCompatibleProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        // Si son demasiados IDs (riesgo de URL overflow), y la compatibilidad devolvió "todos",
        // idealmente deberíamos detectar eso. 
        // Por ahora, asumimos que si hay filtro, usaremos IDs.
        // TODO: Mejorar esto para usar POST en getProducts o detectar si validIds == allProducts
        params.ids = validIds.join(',');
      }

      const response = await apiClient.getProducts(params) as any;
      const fetchedProducts = Array.isArray(response.products) ? response.products : response.data || response;

      // Actualizar estados
      setTotalPages(response.totalPages || 1);
      setTotalProducts(response.total || 0);
      setCurrentPage(page);
      setCompatibleProducts(fetchedProducts);

    } catch (err) {
      console.error(`Error loading compatible ${componentType} products:`, err);
      setCompatibleProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección de un componente
  const selectComponent = async (product: Product) => {
    const currentStepType = getStep(step - 1).type;
    const stepKey = currentStepType.toLowerCase() as keyof PCBuild;

    // Ya no es necesario verificar compatibilidad individualmente aquí
    // porque la lista mostrada YA está filtrada por compatibilidad estricta.
    // Solo actualizamos el estado.

    setPcBuild(prev => ({
      ...prev,
      [stepKey]: product
    }));

    // Si hay más pasos, continuar al siguiente
    if (step < componentSteps.length) {
      const nextStep = step + 1;
      const nextType = getStep(nextStep - 1).type;
      setStep(nextStep);

      // Determinar el ID del componente padre para la compatibilidad
      // Generalmente la Motherboard es el padre de CPU, RAM, GPU (slot), Storage (slot)
      // Pero para Case, la Motherboard es el hijo (form factor) o viceversa.
      // Usaremos la Motherboard como pivote principal si existe.
      let parentId = null;
      if (stepKey === 'motherboard') {
        parentId = product.cod_producto;
      } else if (pcBuild.motherboard) {
        parentId = pcBuild.motherboard.cod_producto;
      }

      loadCompatibleProducts(nextType, parentId);
    } else {
      // Si es el último paso, mostrar resumen
      setShowSummary(true);
    }
  };

  // Obtener el componente actualmente seleccionado para el paso actual
  const getCurrentSelection = () => {
    const currentType = getStep(step - 1).type;
    const stepKey = currentType.toLowerCase() as keyof PCBuild;
    return pcBuild[stepKey];
  };

  // Generar items para el resumen
  const getQuotationItems = () => {
    const items: any[] = [];
    Object.entries(pcBuild).forEach(([key, product]) => {
      if (product) {
        items.push({
          product_id: product.cod_producto,
          product_name: product.name,
          product_price: Math.ceil(Number((product as any).priceDis || (product as any).price_dis || (product as any).priceCot || (product as any).price_cot || (product as any).priceWeb || (product as any).price_web || product.price)),
          quantity: 1,
          subtotal: Math.ceil(Number((product as any).priceDis || (product as any).price_dis || (product as any).priceCot || (product as any).price_cot || (product as any).priceWeb || (product as any).price_web || product.price)),
          product: product
        });
      }
    });
    return items;
  };

  // Manejar búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset a primera página al buscar
    const currentType = getStep(step - 1).type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, 1, query, selectedSubcategory);
  };

  // Cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const currentType = getStep(step - 1).type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, newPage, searchQuery, selectedSubcategory);
  };

  // Cambiar subcategoría
  const handleSubcategoryChange = (subcategoryId: number | null) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentPage(1);
    const currentType = getStep(step - 1).type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, 1, searchQuery, subcategoryId);
  };

  // Navegar a un paso específico
  const goToStep = (stepIndex: number) => {
    if (stepIndex < step) {
      setStep(stepIndex + 1);
      const type = getStep(stepIndex).type;
      // Recargar productos para ese paso (usando motherboard como padre si existe y no es motherboard)
      const parentId = type.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
      loadCompatibleProducts(type, parentId);
    }
  };

  const handleCreateQuotation = () => {
    // Redirigir a la página de resumen final con los datos
    // En una implementación real, podríamos guardar en localStorage o Context
    // Por ahora, simulamos yendo a una página de resumen (que deberíamos crear o reutilizar)
    // O simplemente usamos el componente QuotationSummary aquí mismo para finalizar.

    // Guardar en localStorage para persistencia simple
    localStorage.setItem('pcBuild', JSON.stringify(pcBuild));
    router.push('/cotizador/resumen');
  };

  const currentStepName = componentSteps[step - 1]?.name || '';

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-4 py-2 rounded">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Arma tu PC</h1>
        <Link href="/cotizador" className="text-blue-600 hover:underline">Volver al inicio</Link>
      </div>

      {/* Barra de progreso */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex min-w-max">
          {componentSteps.map((comp, index) => (
            <div
              key={comp.type}
              className={`flex items-center ${index < componentSteps.length - 1 ? 'mr-4' : ''}`}
              onClick={() => goToStep(index)}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors
                ${index < step - 1 ? 'bg-green-500 text-white' : index === step - 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {index < step - 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${index === step - 1 ? 'text-blue-600' : 'text-gray-600'}`}>
                {comp.name}
              </span>
              {index < componentSteps.length - 1 && (
                <div className="w-12 h-1 bg-gray-200 ml-4 hidden md:block">
                  <div className={`h-full ${index < step - 1 ? 'bg-green-500' : ''}`} style={{ width: index < step - 1 ? '100%' : '0%' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel Principal de Selección */}
        <div className="lg:col-span-3">
          {compatibilityError && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <span className="text-yellow-500 text-xl mr-3">⚠️</span>
              <p className="text-yellow-700">{compatibilityError}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">{getStep(step - 1).icon}</span>
              Selecciona {currentStepName}
            </h2>

            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Buscar ${currentStepName.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filtro de subcategorías (preparado para futuro) */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Subcategoría:</label>
                <select
                  value={selectedSubcategory || ''}
                  onChange={(e) => handleSubcategoryChange(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {/* Las subcategorías se cargarán dinámicamente cuando existan */}
                </select>
                <span className="text-sm text-gray-500">
                  {totalProducts} productos encontrados
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : compatibleProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-3xl">
                  {getStep(step - 1).icon}
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No encontramos {currentStepName} compatibles</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No hay productos disponibles en esta categoría que sean compatibles con tu selección actual.
                </p>
                <button
                  onClick={() => loadCompatibleProducts(getStep(step - 1).type, null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Ver todo el catálogo de {currentStepName}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {compatibleProducts.map((product) => (
                  <div
                    key={`product-${product.cod_producto}`}
                    onClick={() => selectComponent(product)}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                      ${getCurrentSelection()?.cod_producto === product.cod_producto ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 line-clamp-2 h-12">{product.name}</h3>
                    </div>

                    <div className="text-sm text-gray-500 mb-3 space-y-1">
                      {product.socket_type && <div>Socket: {product.socket_type}</div>}
                      {product.ram_type && <div>Tipo: {product.ram_type}</div>}
                      {product.form_factor && <div>Forma: {product.form_factor}</div>}
                    </div>

                    <div className="flex justify-between items-center mt-auto">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-blue-600">
                          S/. {Math.ceil(Number((product as any).priceDis || (product as any).price_dis || (product as any).priceCot || (product as any).price_cot || (product as any).priceWeb || (product as any).price_web || product.price)).toFixed(2)}
                        </span>
                        {(Number((product as any).priceDis || (product as any).price_dis) > 0 || Number((product as any).priceCot || (product as any).price_cot) > 0) && (
                          <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Precio Especial</span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock > 0 ? 'Stock' : 'Agotado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paginación */}
          {!loading && compatibleProducts.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg ${currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          )}


          <div className="flex justify-between">
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={() => {
                if (step < componentSteps.length) {
                  setStep(prev => prev + 1);
                  // Cargar siguientes
                  const nextType = getStep(step).type;
                  const parentId = pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
                  loadCompatibleProducts(nextType, parentId);
                } else {
                  setShowSummary(true);
                }
              }}
              disabled={!getCurrentSelection()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {step === componentSteps.length ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>

        {/* Panel Lateral de Resumen */}
        <div className="lg:col-span-1">
          <QuotationSummary
            items={getQuotationItems()}
            onRemoveItem={(index) => {
              // Lógica para remover item (resetear el paso correspondiente)
              const item = getQuotationItems()[index];
              const type = item.product?.component_type?.toLowerCase();
              if (type) {
                setPcBuild(prev => ({ ...prev, [type]: undefined }));
                // Volver al paso de ese componente
                const stepIdx = componentSteps.findIndex(s => s.type.toLowerCase() === type);
                if (stepIdx >= 0) goToStep(stepIdx);
              }
            }}
            onCreateQuotation={handleCreateQuotation}
          />
        </div>
      </div>
    </div>
  );
}