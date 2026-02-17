"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/common/Navigation";
import { BlogService, type BlogPost } from "@/services/BlogService";
import Link from "next/link";
import Image from "next/image";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<{ text: string, id: string, level: number }[]>([]);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const response = await BlogService.getPostBySlug(slug);

        setPost(response.data || null);

        // Generar tabla de contenidos
        if (response.data?.content) {
          const headings = response.data.content
            .split('\n')
            .filter(line => line.startsWith('#'))
            .map((line, index) => {
              const level = line.match(/^#+/)?.[0].length || 2;
              const text = line.replace(/^#+\s/, '');
              const id = `heading-${index}`;
              return { text, id, level };
            });
          setTableOfContents(headings);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el post");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  // Barra de progreso de lectura
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      setReadProgress(Math.min(progress, 100));
      setShowScrollTop(scrolled > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPostImage = () => {
    if (post?.featured_image) {
      return post.featured_image;
    }
    return `https://placehold.co/1200x600?text=Imagen+no+disponible`;
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      await BlogService.likePost(post.id);
      setPost({ ...post, likes: post.likes + 1 });
    } catch (err) {
      console.error("Error al dar like:", err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = post?.title || '';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const url = window.location.href;
    const text = post?.title || '';
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('¡Enlace copiado al portapapeles!');
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando post...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">😕 Post no encontrado</h1>
            <p className="text-gray-600 mb-8">
              {error || "El post que buscas no existe o ha sido eliminado."}
            </p>
            <Link
              href="/blog"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              ← Volver al blog
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />

      {/* Barra de progreso de lectura */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <article className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 max-w-4xl py-3">
            <nav className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition">Inicio</Link>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium truncate max-w-md">{post.title}</span>
            </nav>
          </div>
        </div>

        {/* Header del post */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al blog
            </Link>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-blue-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  {(post.author_name?.[0] ?? 'A').toUpperCase()}
                </div>
                <span className="font-medium">{post.author_name}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(post.published_at || new Date().toISOString())}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.reading_time} min lectura
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {post.word_count} palabras
              </div>
            </div>
          </div>
        </div>

        {/* Imagen destacada */}
        <div className="container mx-auto px-4 max-w-4xl mt-8 mb-8">
          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-xl">
            <Image
              src={getPostImage()}
              alt={post.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Contenido del post con TOC */}
        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Tabla de contenidos - Solo en desktop */}
            {tableOfContents.length > 0 && (
              <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                <div className="sticky top-24 bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    En este artículo
                  </h3>
                  <nav className="space-y-2">
                    {tableOfContents.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm hover:text-blue-600 transition ${heading.level === 1 ? 'font-bold' : heading.level === 2 ? 'ml-0 font-semibold' : 'ml-4 text-gray-600'
                          }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
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
                          <li key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed list-disc" dangerouslySetInnerHTML={{ __html: processedContent }} />
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
                          dangerouslySetInnerHTML={{ __html: processedLine }}
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

              {/* Acciones del post */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition group"
                    >
                      <svg className="w-6 h-6 group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-semibold">{post.likes} Me gusta</span>
                    </button>

                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-semibold">{post.views} Vistas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 mr-2">Compartir:</span>
                    <button
                      onClick={shareOnTwitter}
                      className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition"
                      title="Compartir en Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </button>
                    <button
                      onClick={shareOnFacebook}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition"
                      title="Compartir en Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                      </svg>
                    </button>
                    <button
                      onClick={shareOnWhatsApp}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition"
                      title="Compartir en WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </button>
                    <button
                      onClick={copyLink}
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                      title="Copiar enlace"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA final */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">¿Te gustó este artículo?</h3>
                <p className="text-blue-100 mb-6">Descubre más contenido tecnológico en nuestro blog</p>
                <Link
                  href="/blog"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md hover:shadow-lg"
                >
                  Ver más posts →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Botón volver arriba */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110 z-40"
          aria-label="Volver arriba"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </>
  );
}
