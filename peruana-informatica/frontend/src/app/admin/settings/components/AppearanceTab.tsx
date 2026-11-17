'use client';

interface AppearanceTabProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function AppearanceTab({ settings, onSettingChange }: AppearanceTabProps) {
  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Apariencia</h2>
        <p className="text-gray-500 dark:text-gray-400">Personaliza los colores y estilo visual de tu tienda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Primario</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.primary_color}
              onChange={(e) => onSettingChange('primary_color', e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.primary_color}
              onChange={(e) => onSettingChange('primary_color', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en botones principales, enlaces y encabezados.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color Secundario</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.secondary_color}
              onChange={(e) => onSettingChange('secondary_color', e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.secondary_color}
              onChange={(e) => onSettingChange('secondary_color', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg uppercase"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usado en acentos, bordes y elementos secundarios.</p>
        </div>
      </div>
    </div>
  );
}
