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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'orange';
}

const colorMap = {
  blue:   { gradient: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50 dark:bg-blue-950/30',     glow: 'shadow-blue-500/20' },
  green:  { gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', glow: 'shadow-emerald-500/20' },
  yellow: { gradient: 'from-amber-400 to-yellow-500',  bg: 'bg-amber-50 dark:bg-amber-950/30',   glow: 'shadow-amber-500/20' },
  red:    { gradient: 'from-red-500 to-rose-600',      bg: 'bg-red-50 dark:bg-red-950/30',       glow: 'shadow-red-500/20' },
  purple: { gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-950/30', glow: 'shadow-purple-500/20' },
  indigo: { gradient: 'from-indigo-500 to-blue-600',   bg: 'bg-indigo-50 dark:bg-indigo-950/30', glow: 'shadow-indigo-500/20' },
  orange: { gradient: 'from-orange-400 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', glow: 'shadow-orange-500/20' },
};

export function StatsCard({ title, value, description, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full ${c.bg} blur-2xl opacity-50 -translate-y-8 translate-x-8 group-hover:opacity-80 transition-opacity`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
          )}
          {trend && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800">
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[10px] text-gray-400">vs anterior</span>
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
