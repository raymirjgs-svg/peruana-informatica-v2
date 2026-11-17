import { SeoService, type SeoAnalysis } from '@/services/SeoService';

export function SeoScoreCard({ analysis }: { analysis: SeoAnalysis }) {
  return (
          <div
            className={`bg-gradient-to-r ${SeoService.getScoreBackgroundColor(analysis.score)} rounded-xl p-8 mb-6 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Score SEO General</h2>
                <p className="text-white/90">
                  {analysis.score >= 80
                    ? "Excelente optimización SEO"
                    : analysis.score >= 60
                      ? "Buena optimización SEO"
                      : "Necesita mejoras en SEO"}
                </p>
              </div>
              <div className="text-6xl font-bold">{analysis.score}/100</div>
            </div>
          </div>
  );
}
