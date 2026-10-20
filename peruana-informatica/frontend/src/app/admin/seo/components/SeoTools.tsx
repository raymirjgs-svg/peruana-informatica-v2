export function SeoTools({ onRefresh }: { onRefresh: () => void }) {
  return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Herramientas SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/sitemap.xml"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🗺️</div>
              <div className="font-semibold text-gray-800">Sitemap XML</div>
              <div className="text-xs text-gray-500 mt-1">
                Ver sitemap generado
              </div>
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold text-gray-800">Robots.txt</div>
              <div className="text-xs text-gray-500 mt-1">
                Ver archivo robots
              </div>
            </a>
            <button
              onClick={onRefresh}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">
                Actualizar Análisis
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Recalcular score SEO
              </div>
            </button>
          </div>
        </div>
  );
}
