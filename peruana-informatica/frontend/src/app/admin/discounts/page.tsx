'use client';

import { Percent, Plus, Search, Tag, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function DiscountsPage() {
  return (
    <AdminLayout>
    <div className="p-6">
      <PageHeader
        title="Descuentos y Promociones"
        description="Gestiona descuentos por categoría, producto o porcentaje"
        icon={Percent}
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Descuento
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatsCard
          title="Descuentos Activos"
          value="8"
          description="Promociones vigentes"
          icon={Percent}
          color="green"
        />
        <StatsCard
          title="Productos en Oferta"
          value="156"
          description="Con descuento aplicado"
          icon={Tag}
          color="blue"
        />
        <StatsCard
          title="Ahorro Total"
          value="S/. 12,340"
          description="En descuentos este mes"
          icon={TrendingDown}
          trend={{ value: '+8.5%', isPositive: true }}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Descuentos Activos</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar descuento..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">-30%</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoría: Laptops</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cyber Week</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">30% de descuento en todas las laptops</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Válido: 01/12 - 31/12</span>
              <span className="font-semibold text-red-600">45 productos</span>
            </div>
          </div>

          <div className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">-20%</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoría: Monitores</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Oferta Monitores</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">20% en monitores gaming</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Válido: 15/12 - 31/12</span>
              <span className="font-semibold text-blue-600">28 productos</span>
            </div>
          </div>

          <div className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold">-15%</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoría: Periféricos</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Combo Gamer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">15% en teclados y mouse</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Válido: 10/12 - 25/12</span>
              <span className="font-semibold text-green-600">83 productos</span>
            </div>
          </div>

          <div className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">-25%</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoría: Almacenamiento</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">SSD Sale</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">25% en discos SSD</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Válido: 05/12 - 20/12</span>
              <span className="font-semibold text-purple-600">34 productos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
