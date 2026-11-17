import { Product } from '../types';
import { LaptopCard } from './LaptopCard';

interface LaptopListProps {
  loading: boolean;
  laptops: Product[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  selectedLaptop: Product | null;
  onAdd: (laptop: Product) => void;
}

export function LaptopList({
  loading,
  laptops,
  currentPage,
  itemsPerPage,
  onPageChange,
  selectedLaptop,
  onAdd,
}: LaptopListProps) {
  const totalPages = Math.ceil(laptops.length / itemsPerPage);

  return (
    <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : laptops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron laptops que coincidan con los filtros.</p>
            </div>
          ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {laptops
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((laptop) => (
                <LaptopCard
                  key={laptop.id || laptop.cod_producto}
                  laptop={laptop}
                  isSelected={selectedLaptop?.id === laptop.id || selectedLaptop?.cod_producto === laptop.cod_producto}
                  onAdd={onAdd}
                />
              ))}
          </div>

              {/* Controles de paginación */}
              {laptops.length > itemsPerPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg ${currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Anterior
                    </button>

                    <span className="px-4 py-2 text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg ${currentPage === totalPages
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
  );
}
