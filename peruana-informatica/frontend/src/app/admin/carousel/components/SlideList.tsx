'use client';

import { Button } from '@/components/admin/Button';
import { Pagination } from '@/components/admin/Pagination';
import type { Slide } from './types';

interface SlideListProps {
  slides: Slide[];
  loading: boolean;
  deletingId: number | null;
  onEdit: (slide: Slide) => void;
  onDelete: (id: number) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function SlideList({
  slides,
  loading,
  deletingId,
  onEdit,
  onDelete,
  page,
  totalPages,
  total,
  onPageChange,
}: SlideListProps) {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {slides.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">No hay slides para mostrar</div>
        )}
        {slides.map((s) => (
          <div key={s.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-2">
              <div className="font-semibold text-gray-800">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.description}</div>
            </div>
            <div className="text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {s.isActive ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Orden: {s.order}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                ✏️ Editar
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(s.id)} isLoading={deletingId === s.id}>
                🗑️ Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        disabled={loading}
        itemLabel="slides"
      />
    </>
  );
}
