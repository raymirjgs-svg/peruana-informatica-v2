import { BlogStats } from '../types';

export function BlogStatsGrid({ stats }: { stats: BlogStats }) {
  return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Total Posts</div>
              <div className="text-2xl font-bold dark:text-gray-100 mt-1">
                {stats.totals.posts}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Publicados</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.totals.published}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Generados por IA</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {stats.totals.ai_generated}
              </div>
            </div>
            <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
              <div className="text-sm dark:text-gray-400">Total Vistas</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totals.views}
              </div>
            </div>
          </div>
  );
}
