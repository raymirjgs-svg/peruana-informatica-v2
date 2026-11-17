import { Button } from '@/components/admin/Button';
import { SeoService, type SeoSettings } from '@/services/SeoService';

interface SeoSettingsListProps {
  settings: SeoSettings[];
  onNew: () => void;
  onEdit: (setting: SeoSettings) => void;
  onDelete: (id: number) => void;
}

export function SeoSettingsList({ settings, onNew, onEdit, onDelete }: SeoSettingsListProps) {
  return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Configuraciones SEO
            </h2>
            <Button onClick={onNew}>+ Nueva Configuración</Button>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {SeoService.getPageTypeOptions().find(
                          (opt) => opt.value === setting.page_type,
                        )?.label || setting.page_type}
                      </span>
                      {setting.page_identifier && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {setting.page_identifier}
                        </span>
                      )}
                      {!setting.is_active && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800">
                      {setting.meta_title || "Sin título"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {setting.meta_description || "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Robots: {setting.robots}</span>
                      <span>Prioridad: {setting.priority}</span>
                      <span>Frecuencia: {setting.change_frequency}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(setting)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(setting.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {settings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay configuraciones SEO. Crea la primera configuración.
              </div>
            )}
          </div>
        </div>
  );
}
