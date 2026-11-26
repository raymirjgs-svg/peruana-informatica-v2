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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst || disabled}
        className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Página <span className="font-semibold text-gray-900 dark:text-white">{page}</span> de {totalPages}
        <span className="hidden sm:inline"> · {total} {itemLabel}</span>
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={isLast || disabled}
        className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
