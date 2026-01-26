'use client';

import { Ticket, Plus, Search, Calendar, Percent } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function CouponsPage() {
  return (
    <AdminLayout>
    <div className="p-6">
      <PageHeader
        title="Cupones de Descuento"
        description="Gestiona cupones y códigos promocionales"
        icon={Ticket}
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Cupón
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatsCard
          title="Cupones Activos"
          value="15"
          description="Disponibles para uso"
          icon={Ticket}
          color="green"
        />
        <StatsCard
          title="Cupones Usados"
          value="342"
          description="Este mes"
          icon={Ticket}
          trend={{ value: '+45', isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Descuento Total"
          value="S/. 8,450"
          description="En descuentos aplicados"
          icon={Percent}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lista de Cupones</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cupón..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-mono font-bold">VERANO2024</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Activo</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">20% de descuento en toda la tienda</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Válido hasta: 31/12/2024
                  </span>
                  <span>Usos: 45/100</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">Editar</button>
                <button className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Eliminar</button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-mono font-bold">PRIMERACOMPRA</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Activo</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">S/. 50 de descuento en primera compra</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Válido hasta: 31/12/2024
                  </span>
                  <span>Usos: 128/∞</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">Editar</button>
                <button className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
