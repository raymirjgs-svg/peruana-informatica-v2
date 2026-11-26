import { KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/admin/Button';

export function BlogAiNotConfigured({ onConfigure }: { onConfigure: () => void }) {
  return (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    IA no configurada (100% GRATIS)
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300">
                    Configura tu API Key de Google Gemini (gratuita) para usar
                    las funciones de IA
                  </p>
                </div>
              </div>
              <Button
                onClick={onConfigure}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                <KeyRound className="h-4 w-4" /> Configurar API Key
              </Button>
            </div>
          </div>
  );
}
