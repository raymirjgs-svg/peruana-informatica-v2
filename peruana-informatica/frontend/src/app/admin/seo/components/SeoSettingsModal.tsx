import { Button } from '@/components/admin/Button';
import {
  SeoService,
  type SeoSettings,
  type SeoFormData,
} from '@/services/SeoService';

interface SeoSettingsModalProps {
  selectedSetting: SeoSettings | null;
  formData: SeoFormData;
  formErrors: { [key: string]: string };
  isAiLoading: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAiSuggest: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function SeoSettingsModal({
  selectedSetting,
  formData,
  formErrors,
  isAiLoading,
  onChange,
  onAiSuggest,
  onSave,
  onClose,
}: SeoSettingsModalProps) {
  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedSetting
                    ? "Editar Configuración SEO"
                    : "Nueva Configuración SEO"}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onAiSuggest}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-3 w-3 border-b-2 border-gray-600 rounded-full"></span>
                        Pensando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        ✨ Sugerir con IA
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Página *
                    </label>
                    <select
                      name="page_type"
                      value={formData.page_type}
                      onChange={onChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.page_type ? "border-red-500" : "border-gray-300"}`}
                      disabled={!!selectedSetting}
                    >
                      <option value="">Selecciona un tipo</option>
                      {SeoService.getPageTypeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.page_type && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.page_type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Identificador de Página
                    </label>
                    <input
                      type="text"
                      name="page_identifier"
                      value={formData.page_identifier || ""}
                      onChange={onChange}
                      placeholder="ej: slug, id, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para páginas específicas (opcional)
                    </p>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Meta Tags</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Meta ({formData.meta_title?.length || 0}/60)
                    </label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={onChange}
                      maxLength={255}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.meta_title ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.meta_title && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.meta_title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Meta ({formData.meta_description?.length || 0}
                      /160)
                    </label>
                    <textarea
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={onChange}
                      rows={3}
                      maxLength={500}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${formErrors.meta_description ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.meta_description && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.meta_description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input
                      type="text"
                      name="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={onChange}
                      placeholder="palabra1, palabra2, palabra3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separa las palabras clave con comas
                    </p>
                  </div>
                </div>

                {/* Open Graph */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Open Graph (Facebook)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título OG
                      </label>
                      <input
                        type="text"
                        name="og_title"
                        value={formData.og_title}
                        onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen OG
                      </label>
                      <input
                        type="url"
                        name="og_image"
                        value={formData.og_image}
                        onChange={onChange}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción OG
                    </label>
                    <textarea
                      name="og_description"
                      value={formData.og_description}
                      onChange={onChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Twitter Cards</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título Twitter
                      </label>
                      <input
                        type="text"
                        name="twitter_title"
                        value={formData.twitter_title}
                        onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen Twitter
                      </label>
                      <input
                        type="url"
                        name="twitter_image"
                        value={formData.twitter_image}
                        onChange={onChange}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Twitter
                    </label>
                    <textarea
                      name="twitter_description"
                      value={formData.twitter_description}
                      onChange={onChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Configuración avanzada */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Configuración Avanzada
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Robots
                      </label>
                      <select
                        name="robots"
                        value={formData.robots}
                        onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {SeoService.getRobotsOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridad (0.0-1.0)
                      </label>
                      <input
                        type="number"
                        name="priority"
                        value={formData.priority}
                        onChange={onChange}
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        name="change_frequency"
                        value={formData.change_frequency}
                        onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {SeoService.getChangeFrequencyOptions().map(
                          (option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Canónica
                    </label>
                    <input
                      type="url"
                      name="canonical_url"
                      value={formData.canonical_url}
                      onChange={onChange}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schema Markup (JSON-LD)
                    </label>
                    <textarea
                      name="schema_markup"
                      value={formData.schema_markup}
                      onChange={onChange}
                      rows={4}
                      placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Personalizado (Head)
                    </label>
                    <textarea
                      name="custom_head"
                      value={formData.custom_head}
                      onChange={onChange}
                      rows={3}
                      placeholder='<meta name="..." content="..." />'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={onChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Configuración activa
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button onClick={onSave}>
                  {selectedSetting ? "Actualizar" : "Crear"} Configuración
                </Button>
              </div>
            </div>
          </div>
  );
}
