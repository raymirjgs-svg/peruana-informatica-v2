'use client';

import { Button } from '@/components/admin/Button';
import { ContactService } from '@/services/ContactService';
import type { ContactFilters } from './types';

interface ContactFiltersBarProps {
  filters: ContactFilters;
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ContactFiltersBar({
  filters,
  onFilterChange,
  onRefresh,
  loading,
}: ContactFiltersBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="resolved">Resueltos</option>
            <option value="spam">Spam</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asunto
          </label>
          <select
            value={filters.asunto}
            onChange={(e) => onFilterChange("asunto", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los asuntos</option>
            {ContactService.getSubjectOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Buscar por nombre, email o mensaje..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={onRefresh} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
