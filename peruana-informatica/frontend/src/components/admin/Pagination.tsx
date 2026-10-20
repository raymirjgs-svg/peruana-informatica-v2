'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
  itemLabel = 'registros',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center justify-between pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst || disabled}
        className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-300">
        Página {page} de {totalPages} ({total} {itemLabel})
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={isLast || disabled}
        className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
