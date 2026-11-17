'use client';

interface HomeTabProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function HomeTab({ settings, onSettingChange }: HomeTabProps) {
  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Página de Inicio</h2>
        <p className="text-gray-500 dark:text-gray-400">Controla qué secciones se muestran en la página principal.</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'home_section_new', label: 'Sección Nuevos Productos (✨)', desc: 'Muestra los últimos productos agregados.' },
          { key: 'home_section_featured', label: 'Sección Destacados (⭐)', desc: 'Muestra productos marcados como destacados.' },
          { key: 'home_section_clearance', label: 'Sección Ofertas (🔥)', desc: 'Muestra productos en liquidación.' },
          { key: 'home_section_categories', label: 'Sección Categorías', desc: 'Muestra las categorías principales.' },
          { key: 'home_section_brands', label: 'Sección Marcas', desc: 'Carrusel de marcas asociadas.' }
        ].map((section) => (
          <div key={section.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">{section.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{section.desc}</div>
            </div>
            <button
              onClick={() => onSettingChange(section.key, settings[section.key] === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings[section.key] === 'true' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[section.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
