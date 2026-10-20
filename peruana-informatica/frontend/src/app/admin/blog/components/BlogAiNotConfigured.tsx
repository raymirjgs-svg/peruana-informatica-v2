import { Button } from '@/components/admin/Button';

export function BlogAiNotConfigured({ onConfigure }: { onConfigure: () => void }) {
  return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    IA no configurada (100% GRATIS)
                  </h3>
                  <p className="text-yellow-700">
                    Configura tu API Key de Google Gemini (gratuita) para usar
                    las funciones de IA
                  </p>
                </div>
              </div>
              <Button
                onClick={onConfigure}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                🔑 Configurar API Key
              </Button>
            </div>
          </div>
  );
}
