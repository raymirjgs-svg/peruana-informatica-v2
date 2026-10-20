import { Button } from '@/components/admin/Button';

interface BlogAiPanelProps {
  generatingTitles: boolean;
  onGenerateTitles: () => void;
  suggestionCount: number;
  onOpenSuggestions: () => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  savingApiKey: boolean;
  onSaveApiKey: () => void;
}

export function BlogAiPanel({
  generatingTitles,
  onGenerateTitles,
  suggestionCount,
  onOpenSuggestions,
  apiKey,
  onApiKeyChange,
  savingApiKey,
  onSaveApiKey,
}: BlogAiPanelProps) {
  return (
          <div className="space-y-4 mb-6">
            {/* Panel principal de IA */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    🤖 Herramientas de IA (ACTIVA ✅)
                  </h2>
                  <p className="text-white/90">
                    Genera contenido automáticamente con inteligencia artificial
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={onGenerateTitles}
                    disabled={generatingTitles}
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    {generatingTitles ? "Generando..." : "✨ Generar Títulos"}
                  </Button>
                  {suggestionCount > 0 && (
                    <Button
                      onClick={onOpenSuggestions}
                      className="bg-white/20 hover:bg-white/30 border-white/30"
                    >
                      Ver Sugerencias ({suggestionCount})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de configuración de API Key */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    🔑 API Key de Google Gemini
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => onApiKeyChange(e.target.value)}
                      placeholder="AIza... (Ingresa tu API Key aquí para cambiarla)"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Button
                      size="sm"
                      onClick={onSaveApiKey}
                      disabled={savingApiKey || !apiKey.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {savingApiKey ? "Guardando..." : "💾 Actualizar"}
                    </Button>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                    >
                      🔗 Obtener nueva
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 <strong>Tip:</strong> Si hay errores, genera una nueva
                    API Key en{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Google AI Studio
                    </a>{" "}
                    y pégala aquí. Luego reinicia el servidor.
                  </p>
                </div>
              </div>
            </div>
          </div>
  );
}
