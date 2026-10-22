'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { type QueryParams } from '@/utils/api';
import BuildHeader from './components/BuildHeader';
import ProductSelectionPanel from './components/ProductSelectionPanel';
import BuildSummaryPanel from './components/BuildSummaryPanel';
import type { BuildStep, PCBuild, Product, QuotationItem } from './components/types';

interface ProductsResponse {
  products?: Product[];
  data?: Product[];
  total?: number;
  totalPages?: number;
}

const resolvePrice = (product: Product) =>
  Math.ceil(
    Number(
      product.priceDis ||
      product.price_dis ||
      product.priceCot ||
      product.price_cot ||
      product.priceWeb ||
      product.price_web ||
      product.price
    )
  );

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
  const componentSteps: BuildStep[] = [
    { type: 'motherboard', name: 'Placa Madre', icon: '🔌' },
    { type: 'processor', name: 'Procesador', icon: '🧠' },
    { type: 'ram', name: 'Memoria RAM', icon: '💾' },
    { type: 'storage', name: 'Almacenamiento', icon: '📦' },
    { type: 'gpu', name: 'Tarjeta Gráfica', icon: '🎮' },
    { type: 'case', name: 'Gabinete', icon: '🖥️' },
    { type: 'power_supply', name: 'Fuente de Poder', icon: '⚡' },
  ];

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

      const params: QueryParams = {
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
        const compatibilityResult = await apiClient.filterCompatibleProducts(componentType, selectedProductIds) as { data?: { compatibleProductIds?: number[] } };
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

      const response = await apiClient.getProducts(params) as ProductsResponse | Product[];
      const fetchedProducts = Array.isArray(response) ? response : response.products || response.data || [];

      // Actualizar estados
      setTotalPages(Array.isArray(response) ? 1 : response.totalPages || 1);
      setTotalProducts(Array.isArray(response) ? response.length : response.total || 0);
      setCurrentPage(page);
      setCompatibleProducts(fetchedProducts);

    } catch (err) {
      console.error(`Error loading compatible ${componentType} products:`, err);
      setCompatibilityError(err instanceof Error ? err.message : 'No se pudieron cargar los productos. Intenta nuevamente.');
      setCompatibleProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección de un componente
  const selectComponent = async (product: Product) => {
    const currentStepType = componentSteps[step - 1]!.type;
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
      const nextType = componentSteps[nextStep - 1]!.type;
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
    const currentType = componentSteps[step - 1]!.type;
    const stepKey = currentType.toLowerCase() as keyof PCBuild;
    return pcBuild[stepKey];
  };

  // Generar items para el resumen
  const getQuotationItems = () => {
    const items: QuotationItem[] = [];
    Object.entries(pcBuild).forEach(([key, product]) => {
      if (product) {
        items.push({
          product_id: product.cod_producto,
          product_name: product.name,
          product_price: resolvePrice(product),
          quantity: 1,
          subtotal: resolvePrice(product),
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
    const currentType = componentSteps[step - 1]!.type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, 1, query, selectedSubcategory);
  };

  // Cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const currentType = componentSteps[step - 1]!.type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, newPage, searchQuery, selectedSubcategory);
  };

  // Cambiar subcategoría
  const handleSubcategoryChange = (subcategoryId: number | null) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentPage(1);
    const currentType = componentSteps[step - 1]!.type;
    const parentId = currentType.toLowerCase() !== 'motherboard' && pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
    loadCompatibleProducts(currentType, parentId, 1, searchQuery, subcategoryId);
  };

  // Navegar a un paso específico
  const goToStep = (stepIndex: number) => {
    if (stepIndex < step) {
      setStep(stepIndex + 1);
      const type = componentSteps[stepIndex]!.type;
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

  const handlePrevious = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    if (step < componentSteps.length) {
      setStep(prev => prev + 1);
      // Cargar siguientes
      const nextType = componentSteps[step]!.type;
      const parentId = pcBuild.motherboard ? pcBuild.motherboard.cod_producto : null;
      loadCompatibleProducts(nextType, parentId);
    } else {
      setShowSummary(true);
    }
  };

  const handleLoadAll = () => {
    loadCompatibleProducts(componentSteps[step - 1]!.type, null);
  };

  const handleRemoveItem = (index: number) => {
    // Lógica para remover item (resetear el paso correspondiente)
    const item = getQuotationItems()[index];
    if (!item) return;
    const type = item.product.component_type?.toLowerCase();
    if (type) {
      setPcBuild(prev => ({ ...prev, [type]: undefined }));
      // Volver al paso de ese componente
      const stepIdx = componentSteps.findIndex(s => s.type.toLowerCase() === type);
      if (stepIdx >= 0) goToStep(stepIdx);
    }
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
      <BuildHeader steps={componentSteps} currentStep={step} onStepClick={goToStep} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel Principal de Selección */}
        <ProductSelectionPanel
          steps={componentSteps}
          step={step}
          currentStepName={currentStepName}
          compatibilityError={compatibilityError}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={handleSubcategoryChange}
          totalProducts={totalProducts}
          loading={loading}
          products={compatibleProducts}
          currentSelection={getCurrentSelection()}
          onSelect={selectComponent}
          onLoadAll={handleLoadAll}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isFirstStep={step === 1}
          isLastStep={step === componentSteps.length}
          canProceed={!!getCurrentSelection()}
          resolvePrice={resolvePrice}
        />

        {/* Panel Lateral de Resumen */}
        <BuildSummaryPanel
          items={getQuotationItems()}
          onRemoveItem={handleRemoveItem}
          onCreateQuotation={handleCreateQuotation}
        />
      </div>
    </div>
  );
}