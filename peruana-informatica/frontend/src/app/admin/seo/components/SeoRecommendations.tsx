import { type SeoAnalysis } from '@/services/SeoService';

export function SeoRecommendations({ analysis }: { analysis: SeoAnalysis }) {
  if (
    analysis.analysis.recommendations.length === 0 &&
    !(analysis.pagesWithIssues && analysis.pagesWithIssues.length > 0)
  ) {
    return null;
  }

  return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-4">
                ⚠️ Recomendaciones para llegar al 100%
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-yellow-900 mb-2">
                    General
                  </h4>
                  <ul className="space-y-2">
                    {analysis.analysis.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start text-sm text-yellow-700"
                      >
                        <span className="text-yellow-600 mr-2 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.pagesWithIssues &&
                  analysis.pagesWithIssues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-yellow-900 mb-2">
                        Páginas específicas
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {analysis.pagesWithIssues.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white/50 p-3 rounded border border-yellow-100"
                          >
                            <div className="font-semibold text-xs text-gray-800">
                              {p.page_type}: {p.page_identifier || "Global"}
                            </div>
                            <ul className="mt-1">
                              {p.issues.map((issue: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-[11px] text-red-600 flex items-center"
                                >
                                  <span className="mr-1">⚠</span> {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
  );
}
