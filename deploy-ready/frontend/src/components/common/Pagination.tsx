// ============================================
// 1. src/components/common/Pagination.tsx
// ============================================
'use client';

import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function Pagination({ currentPage, totalPages, basePath = '/products' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  
  // Lógica para mostrar páginas (1 ... 4 5 6 ... 10)
  if (totalPages <= 7) {
    // Mostrar todas las páginas si son pocas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Mostrar con puntos suspensivos
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  }

  return (
    <nav className="flex justify-center items-center gap-2 mt-12">
      {/* Botón Anterior */}
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition font-semibold"
        >
          ← Anterior
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed font-semibold"
        >
          ← Anterior
        </button>
      )}

      {/* Números de página */}
      <div className="flex gap-2">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={`${basePath}?page=${pageNum}`}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition font-semibold"
        >
          Siguiente →
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed font-semibold"
        >
          Siguiente →
        </button>
      )}
    </nav>
  );
}
