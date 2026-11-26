import { Bot, Star, Package } from 'lucide-react';
import { Button } from '@/components/admin/Button';
import { BlogPost } from '../types';
import { formatDate, getStatusColor } from '../utils';

interface BlogPostListProps {
  posts: BlogPost[];
  loadingDemo: boolean;
  onLoadDemo: () => void;
  onNew: () => void;
  onEdit: (post: BlogPost) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}

export function BlogPostList({
  posts,
  loadingDemo,
  onLoadDemo,
  onNew,
  onEdit,
  onUpdateStatus,
  onDelete,
}: BlogPostListProps) {
  return (
        <div className="dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-gray-100">Posts del Blog</h2>
            <div className="flex gap-3">
              <Button
                onClick={onLoadDemo}
                disabled={loadingDemo}
                className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                {loadingDemo ? "Cargando..." : "Cargar posts demo"}
              </Button>
              <Button onClick={onNew}>+ Nuevo Post</Button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border dark:border-gray-700 rounded-lg p-4 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold dark:text-gray-100">
                        {post.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </span>
                      {post.ai_generated && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          IA
                        </span>
                      )}
                      {post.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          Destacado
                        </span>
                      )}
                    </div>
                    <p className="text-sm dark:text-gray-400 mb-2 line-clamp-2">
                      {post.excerpt || post.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center gap-4 text-xs dark:text-gray-400">
                      <span>Por {post.author_name}</span>
                      <span>{post.word_count} palabras</span>
                      <span>{post.reading_time} min lectura</span>
                      <span>{post.views} vistas</span>
                      <span>{post.likes} likes</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                      onClick={() => onEdit(post)}
                    >
                      Editar
                    </Button>
                    {post.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onUpdateStatus(post.id, "published")}
                      >
                        Publicar
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button
                        size="sm"
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                        onClick={() => onUpdateStatus(post.id, "draft")}
                      >
                        Despublicar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => onDelete(post.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12 dark:text-gray-400">
                <p className="text-lg mb-4">No hay posts aún</p>
                <p className="text-sm mb-4">
                  ¡Crea tu primer post o carga datos de demostración!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={onNew}>+ Crear Post</Button>
                  <Button
                    onClick={onLoadDemo}
                    disabled={loadingDemo}
                    className="dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                  >
                    {loadingDemo ? "Cargando..." : "Cargar posts demo"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
  );
}
