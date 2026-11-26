'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'red';
}

// Paleta del admin: azul de marca para los indicadores; verde, ambar y rojo
// solo cuando el color significa algo (alerta, error, dinero).
const colorMap = {
  blue:    { gradient: 'from-blue-500 to-blue-600',      glow: 'shadow-blue-500/20' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
  amber:   { gradient: 'from-amber-400 to-amber-500',    glow: 'shadow-amber-500/20' },
  red:     { gradient: 'from-red-500 to-red-600',        glow: 'shadow-red-500/20' },
};

export function StatsCard({ title, value, description, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-5 overflow-hidden">
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
          )}
          {trend && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800">
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {trend.isPositive ? '↑' : '•'} {trend.value}
              </span>
            </div>
          )}
        </div>

        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg ${c.glow} shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
