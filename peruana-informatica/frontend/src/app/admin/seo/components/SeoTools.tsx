export function SeoTools({ onRefresh }: { onRefresh: () => void }) {
  return (
        <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold dark:text-gray-100 mb-4">
            Herramientas SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/sitemap.xml"
              target="_blank"
              className="p-4 border-2 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🗺️</div>
              <div className="font-semibold dark:text-gray-100">Sitemap XML</div>
              <div className="text-xs dark:text-gray-400 mt-1">
                Ver sitemap generado
              </div>
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              className="p-4 border-2 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold dark:text-gray-100">Robots.txt</div>
              <div className="text-xs dark:text-gray-400 mt-1">
                Ver archivo robots
              </div>
            </a>
            <button
              onClick={onRefresh}
              className="p-4 border-2 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold dark:text-gray-100">
                Actualizar Análisis
              </div>
              <div className="text-xs dark:text-gray-400 mt-1">
                Recalcular score SEO
              </div>
            </button>
          </div>
        </div>
  );
}
