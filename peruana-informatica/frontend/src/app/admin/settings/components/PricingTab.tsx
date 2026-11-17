'use client';

import { Users, Globe, Percent, CheckCircle } from 'lucide-react';

interface PriceOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const priceOptions: PriceOption[] = [
  {
    value: 'pre_cli',
    label: 'Precio Cliente (PVP)',
    description: 'Precio estándar de venta al público.',
    icon: <Users className="h-6 w-6" />,
    color: 'green'
  },
  {
    value: 'pre_web',
    label: 'Precio Web',
    description: 'Precio exclusivo para tienda online.',
    icon: <Globe className="h-6 w-6" />,
    color: 'purple'
  },
  {
    value: 'pre_dis',
    label: 'Precio Distribuidor',
    description: 'Precio mayorista más bajo. Ideal para campañas o promociones.',
    icon: <Percent className="h-6 w-6" />,
    color: 'amber'
  }
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { selected: string; hover: string; icon: string }> = {
    blue: {
      selected: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      selected: 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400',
      hover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400'
    },
    purple: {
      selected: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    amber: {
      selected: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-400',
      hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400'
    }
  };
  return colors[color] || colors.blue || { selected: '', hover: '', icon: '' };
};

interface PricingTabProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function PricingTab({ settings, onSettingChange }: PricingTabProps) {
  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Configuración de Precios</h2>
        <p className="text-gray-500 dark:text-gray-400">Define qué precio base utilizará el sistema para cálculos y visualización.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          <strong>💡 Consejo:</strong> Cambia a &quot;Precio Distribuidor&quot; durante campañas promocionales
          para ofrecer los mejores precios a tus clientes.
        </p>
      </div>

      <div className="space-y-4">
        {priceOptions.map((option) => {
          const isSelected = settings.cotizador_price_type === option.value;
          const colorClasses = getColorClasses(option.color);

          return (
            <label
              key={option.value}
              className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                ? colorClasses.selected
                : `border-gray-200 dark:border-gray-600 ${colorClasses.hover}`
                }`}
            >
              <input
                type="radio"
                name="cotizador_price_type"
                value={option.value}
                checked={isSelected}
                onChange={(e) => onSettingChange('cotizador_price_type', e.target.value)}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg ${isSelected ? colorClasses.icon : 'text-gray-400 dark:text-gray-500'} ${isSelected ? `bg-white dark:bg-gray-800` : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                {option.icon}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {option.label}
                  </span>
                  <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    {option.value}
                  </span>
                  {isSelected && (
                    <span className="ml-auto">
                      <CheckCircle className={`h-6 w-6 ${colorClasses.icon}`} />
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
