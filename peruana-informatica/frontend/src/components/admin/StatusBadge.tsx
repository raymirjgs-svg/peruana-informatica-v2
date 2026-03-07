'use client';

type StatusVariant =
  | 'active' | 'inactive'
  | 'pending' | 'verified' | 'rejected'
  | 'processed' | 'cancelled'
  | 'low' | 'out'
  | 'featured' | 'new' | 'clearance'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const presets: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  active:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Activo' },
  inactive:  { dot: 'bg-gray-400',    bg: 'bg-gray-100 dark:bg-gray-800',         text: 'text-gray-500 dark:text-gray-400',      label: 'Inactivo' },
  pending:   { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/40',     text: 'text-amber-700 dark:text-amber-400',    label: 'Pendiente' },
  verified:  { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400',label: 'Verificado' },
  rejected:  { dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-700 dark:text-red-400',        label: 'Rechazado' },
  processed: { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-400',      label: 'Procesado' },
  cancelled: { dot: 'bg-red-400',     bg: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-600 dark:text-red-400',        label: 'Cancelado' },
  low:       { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/40',     text: 'text-amber-700 dark:text-amber-400',    label: 'Stock bajo' },
  out:       { dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-700 dark:text-red-400',        label: 'Sin stock' },
  featured:  { dot: 'bg-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/40',   text: 'text-purple-700 dark:text-purple-400',  label: 'Destacado' },
  new:       { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-400',      label: 'Nuevo' },
  clearance: { dot: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40',   text: 'text-orange-700 dark:text-orange-400',  label: 'Remate' },
};

const fallback = { dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: '' };

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const preset = presets[status] ?? fallback;
  const displayLabel = label ?? preset.label ?? status;
  const padding = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${padding} ${preset.bg} ${preset.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${preset.dot}`} />
      {displayLabel}
    </span>
  );
}
