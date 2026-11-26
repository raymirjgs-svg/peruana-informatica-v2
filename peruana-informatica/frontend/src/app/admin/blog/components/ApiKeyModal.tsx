import { Sparkles, FileText, Image as ImageIcon, Zap, Tags, Rocket, KeyRound } from 'lucide-react';
import { Button } from '@/components/admin/Button';

interface ApiKeyModalProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  savingApiKey: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function ApiKeyModal({ apiKey, onApiKeyChange, savingApiKey, onSave, onClose }: ApiKeyModalProps) {
  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="dark:bg-gray-900 rounded-xl max-w-2xl w-full">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-gray-100">
                  <KeyRound className="h-4 w-4" /> Configurar Google Gemini API Key (gratis)
                </h2>
                <p className="dark:text-gray-400 mt-1">
                  Ingresa tu API Key gratuita de Google Gemini para habilitar
                  las funciones de IA
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs dark:text-gray-400 mt-2">
                    Tu API Key se guardará de forma segura en el servidor.
                    Puedes obtenerla GRATIS en{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Google AI Studio (100% GRATIS)
                    </a>
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ¿Por qué Google Gemini es la mejor opción?
                  </h4>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li>
                      <strong>100% GRATUITO</strong> - Sin tarjeta de crédito
                    </li>
                    <li className="flex items-start gap-2"><Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />Generar títulos atractivos automáticamente</li>
                    <li className="flex items-start gap-2"><FileText className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />Crear contenido completo para posts (2000+ palabras)</li>
                    <li className="flex items-start gap-2"><ImageIcon className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />Imágenes destacadas gratis (Unsplash)</li>
                    <li className="flex items-start gap-2"><Tags className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />Sugerir tags y categorías relevantes</li>
                    <li className="flex items-start gap-2"><Rocket className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />Muy potente (similar a GPT-4)</li>
                    <li className="flex items-start gap-2"><Zap className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />60 solicitudes por minuto</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={onSave}
                  disabled={savingApiKey || !apiKey.trim()}
                >
                  {savingApiKey ? "Guardando..." : "💾 Guardar API Key"}
                </Button>
              </div>
            </div>
          </div>
  );
}
