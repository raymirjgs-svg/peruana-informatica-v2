'use client';

import type { BuildStep, Product } from './types';

interface ProductSelectionPanelProps {
  steps: BuildStep[];
  step: number;
  currentStepName: string;
  compatibilityError: string | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedSubcategory: number | null;
  onSubcategoryChange: (subcategoryId: number | null) => void;
  totalProducts: number;
  loading: boolean;
  products: Product[];
  currentSelection?: Product;
  onSelect: (product: Product) => void;
  onLoadAll: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  resolvePrice: (product: Product) => number;
}

export default function ProductSelectionPanel({
  steps,
  step,
  currentStepName,
  compatibilityError,
  searchQuery,
  onSearch,
  selectedSubcategory,
  onSubcategoryChange,
  totalProducts,
  loading,
  products,
  currentSelection,
  onSelect,
  onLoadAll,
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  canProceed,
  resolvePrice,
}: ProductSelectionPanelProps) {
  return (
    <div className="lg:col-span-3">
      {compatibilityError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <span className="text-yellow-500 text-xl mr-3">⚠️</span>
          <p className="text-yellow-700">{compatibilityError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">{steps[step - 1]!.icon}</span>
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
              onChange={(e) => onSearch(e.target.value)}
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
              onChange={(e) => onSubcategoryChange(e.target.value ? parseInt(e.target.value) : null)}
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
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-3xl">
              {steps[step - 1]!.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No encontramos {currentStepName} compatibles</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No hay productos disponibles en esta categoría que sean compatibles con tu selección actual.
            </p>
            <button
              onClick={onLoadAll}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Ver todo el catálogo de {currentStepName}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={`product-${product.cod_producto}`}
                onClick={() => onSelect(product)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                  ${currentSelection?.cod_producto === product.cod_producto ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
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
                      S/. {resolvePrice(product).toFixed(2)}
                    </span>
                    {(Number(product.priceDis || product.price_dis) > 0 || Number(product.priceCot || product.price_cot) > 0) && (
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
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
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
                  onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}


      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={isFirstStep}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLastStep ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
