'use client';

import type { ContactStats } from '@/services/ContactService';

interface ContactStatsCardsProps {
  stats: ContactStats;
}

export function ContactStatsCards({ stats }: ContactStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
        <div className="text-sm dark:text-gray-400">Mensajes Pendientes</div>
        <div className="text-2xl font-bold text-yellow-600 mt-1">
          {stats.totals.pending}
        </div>
      </div>
      <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
        <div className="text-sm dark:text-gray-400">Resueltos</div>
        <div className="text-2xl font-bold text-green-600 mt-1">
          {stats.totals.resolved}
        </div>
      </div>
      <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
        <div className="text-sm dark:text-gray-400">Hoy</div>
        <div className="text-2xl font-bold text-blue-600 mt-1">
          {stats.periods.today}
        </div>
      </div>
      <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
        <div className="text-sm dark:text-gray-400">Total Mensajes</div>
        <div className="text-2xl font-bold dark:text-gray-100 mt-1">
          {stats.totals.total}
        </div>
      </div>
    </div>
  );
}
