'use client';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function BlogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: BlogPaginationProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      {/* Info de paginación */}
      <div className="text-sm text-gray-600">
        Página <span className="font-semibold text-gray-900">{currentPage}</span> de{" "}
        <span className="font-semibold text-gray-900">{totalPages}</span>
      </div>

      {/* Botones de paginación */}
      <nav className="flex items-center gap-2 flex-wrap justify-center">
        {/* Botón Primera Página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Primera página"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex gap-2">
          {(() => {
            const pages = [];
            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            const endPage = Math.min(totalPages, startPage + maxVisible - 1);

            if (endPage - startPage < maxVisible - 1) {
              startPage = Math.max(1, endPage - maxVisible + 1);
            }

            // Primera página si no está visible
            if (startPage > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => onPageChange(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(<span key="dots1" className="px-2 py-2 text-gray-400">...</span>);
              }
            }

            // Páginas visibles
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`px-4 py-2 border rounded-lg font-medium transition ${
                    currentPage === i
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {i}
                </button>
              );
            }

            // Última página si no está visible
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(<span key="dots2" className="px-2 py-2 text-gray-400">...</span>);
              }
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => onPageChange(totalPages)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
        >
          Siguiente
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Botón Última Página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Última página"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
