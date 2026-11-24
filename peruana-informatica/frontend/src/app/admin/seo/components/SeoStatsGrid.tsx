import { type SeoAnalysis } from '@/services/SeoService';

export function SeoStatsGrid({ analysis }: { analysis: SeoAnalysis }) {
  return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Total Páginas</div>
              <div className="text-2xl font-bold dark:text-gray-100 mt-1">
                {analysis.analysis.totalPages}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Optimizadas</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {analysis.analysis.optimizedPages}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Necesitan Atención</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {analysis.analysis.pagesNeedingAttention}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Recomendaciones</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {analysis.analysis.recommendations.length}
              </div>
            </div>
          </div>
  );
}
