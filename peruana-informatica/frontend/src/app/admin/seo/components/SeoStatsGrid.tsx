import { type SeoAnalysis } from '@/services/SeoService';

export function SeoStatsGrid({ analysis }: { analysis: SeoAnalysis }) {
  return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Total Páginas</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {analysis.analysis.totalPages}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Optimizadas</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {analysis.analysis.optimizedPages}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Necesitan Atención</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {analysis.analysis.pagesNeedingAttention}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Recomendaciones</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {analysis.analysis.recommendations.length}
              </div>
            </div>
          </div>
  );
}
