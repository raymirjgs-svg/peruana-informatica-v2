import type { BlogPost } from "@/services/BlogService";
import { sanitizeHtml } from "@/lib/sanitize";
import type { TableOfContentsItem } from "../types";

interface PostArticleBodyProps {
  post: BlogPost;
  tableOfContents: TableOfContentsItem[];
}

export function PostArticleBody({ post, tableOfContents }: PostArticleBodyProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      {/* Excerpt */}
      {post.excerpt && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
          <p className="text-lg text-gray-700 italic leading-relaxed">{post.excerpt}</p>
        </div>
      )}

      {/* Contenido principal en Markdown */}
      {post.content ? (
        <div className="blog-content">
          {post.content.split('\n').map((line, index) => {
            const headingId = tableOfContents[tableOfContents.findIndex(h => h.text === line.replace(/^#+\s/, ''))]?.id;

            // Títulos H1
            if (line.startsWith('# ')) {
              return (
                <h1 key={index} id={headingId} className="text-3xl font-bold text-gray-900 mb-6 mt-8 pb-3 border-b-2 border-blue-600 scroll-mt-24">
                  {line.replace('# ', '')}
                </h1>
              );
            }
            // Títulos H2
            if (line.startsWith('## ')) {
              return (
                <h2 key={index} id={headingId} className="text-2xl font-bold text-gray-800 mb-4 mt-8 flex items-center scroll-mt-24">
                  <span className="bg-blue-600 w-1.5 h-8 mr-3 rounded"></span>
                  {line.replace('## ', '')}
                </h2>
              );
            }
            // Títulos H3
            if (line.startsWith('### ')) {
              return (
                <h3 key={index} id={headingId} className="text-xl font-bold text-gray-800 mb-3 mt-6 scroll-mt-24">
                  {line.replace('### ', '')}
                </h3>
              );
            }
            // Items de lista con guion
            if (line.trim().startsWith('- ')) {
              const content = line.replace(/^- /, '');
              const processedContent = content
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
              return (
                <li key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedContent) }} />
              );
            }
            // Líneas vacías
            if (line.trim() === '') {
              return <div key={index} className="h-2"></div>;
            }
            // Párrafos normales
            const processedLine = line
              .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
              .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
              .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">$1</code>');

            return (
              <p
                key={index}
                className="text-gray-700 leading-relaxed mb-4 text-lg"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedLine) }}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">Contenido no disponible</p>
      )}

      {/* Tags y categorías */}
      <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
        {post.tags && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Etiquetas
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {post.categories && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Categorías
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.categories.split(',').map((category, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-4 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                >
                  {category.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
