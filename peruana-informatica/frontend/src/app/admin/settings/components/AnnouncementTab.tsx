'use client';

import { Megaphone } from 'lucide-react';

interface AnnouncementTabProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function AnnouncementTab({ settings, onSettingChange }: AnnouncementTabProps) {
  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Barra de Anuncios</h2>
        <p className="text-gray-500 dark:text-gray-400">Configura la barra superior para avisos importantes.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">Activar Barra</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Mostrar barra en la parte superior del sitio</div>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('announcement_bar_enabled', settings.announcement_bar_enabled === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.announcement_bar_enabled === 'true' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.announcement_bar_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {settings.announcement_bar_enabled === 'true' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Texto del Anuncio</label>
              <input
                type="text"
                value={settings.announcement_bar_text}
                onChange={(e) => onSettingChange('announcement_bar_text', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: ¡Envío gratis solo por hoy!"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enlace (Opcional)</label>
              <input
                type="text"
                value={settings.announcement_bar_link}
                onChange={(e) => onSettingChange('announcement_bar_link', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: /products/ofertas"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color de Fondo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.announcement_bar_color}
                  onChange={(e) => onSettingChange('announcement_bar_color', e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <div
                  className="flex-1 px-4 py-2 rounded-lg text-white text-center font-medium shadow-sm transition-all"
                  style={{ backgroundColor: settings.announcement_bar_color }}
                >
                  Vista Previa: {settings.announcement_bar_text}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
