import { Button } from '@/components/admin/Button';
import { TitleSuggestion } from '../types';
import { formatDate } from '../utils';

interface TitleSuggestionsModalProps {
  suggestions: TitleSuggestion[];
  generatingContent: boolean;
  onGenerateContent: (id: number) => void;
  onManage: (id: number, action: 'select' | 'reject') => void;
  onClose: () => void;
}

export function TitleSuggestionsModal({
  suggestions,
  generatingContent,
  onGenerateContent,
  onManage,
  onClose,
}: TitleSuggestionsModalProps) {
  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  🤖 Sugerencias de Títulos de IA
                </h2>
                <p className="text-gray-600 mt-1">
                  Selecciona un título para generar el contenido completo
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {suggestion.suggested_title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Tema: {suggestion.topic || "General"}</span>
                            <span>•</span>
                            <span>Modelo: {suggestion.ai_model}</span>
                            <span>•</span>
                            <span>{formatDate(suggestion.generated_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => onGenerateContent(suggestion.id)}
                            disabled={generatingContent}
                          >
                            {generatingContent
                              ? "Generando..."
                              : "✨ Generar Post"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onManage(suggestion.id, "select")}
                          >
                            ✓ Marcar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onManage(suggestion.id, "reject")}
                          >
                            ✗ Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {suggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay sugerencias pendientes. Genera nuevos títulos con IA.
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
  );
}
