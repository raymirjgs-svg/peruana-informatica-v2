"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/common/Navigation";
import { BlogService, type BlogPost } from "@/services/BlogService";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Cargar posts
  const loadPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Loading blog posts...");
      
      const response = await BlogService.getPublishedPosts({
        page,
        limit: 9,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
      });

      setPosts(response.data);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      
      console.log("✅ Blog posts loaded successfully");
    } catch (err: any) {
      console.error("❌ Error loading blog posts:", err);
      const errorMessage = err.message || "Error al cargar los posts. Por favor, verifica que el servidor backend esté ejecutándose.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Obtener imagen por defecto
  const getDefaultImage = (slug: string) => {
    return `https://placehold.co/400x240?text=Imagen+no+disponible`;
  };

  // Dar like a un post
  const handleLike = async (postId: number) => {
    try {
      await BlogService.likePost(postId);
      // Actualizar el post en la lista
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: post.likes + 1 } : post,
        ),
      );
    } catch (err) {
      console.error("Error al dar like:", err);
    }
  };

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPosts(1);
  };

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadPosts(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header del Blog */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">Blog de Tecnología</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Mantente al día con las últimas noticias, reviews y guías sobre
                tecnología
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar artículos..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                  loadPosts(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                <option value="Laptops">Laptops</option>
                <option value="Gaming">Gaming</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Reviews">Reviews</option>
                <option value="Guías">Guías</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Grid de Posts */}
          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Imagen */}
                  <div className="relative overflow-hidden h-48">
                    <Image
                      src={post.featured_image || getDefaultImage(post.slug)}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.is_featured && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                          ⭐ Destacado
                        </span>
                      </div>
                    )}
                    {post.ai_generated && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded">
                          🤖 IA
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Categorías y Tags */}
                    {post.categories && (
                      <div className="mb-3">
                        {BlogService.getCategoriesArray(post.categories)
                          .slice(0, 2)
                          .map((category, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mr-2"
                            >
                              {category}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Título */}
                    <h2 className="font-bold text-xl mb-3 text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {/* Extracto */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt ||
                        BlogService.generateExcerpt(post.content)}
                    </p>

                    {/* Meta información */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <span>Por {post.author_name}</span>
                        <span>{post.reading_time} min lectura</span>
                        <span>
                          {formatDate(post.published_at || post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Footer del card */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          👁️ {post.views}
                        </span>
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1 hover:text-red-500 transition"
                        >
                          ❤️ {post.likes}
                        </button>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                      >
                        Leer más →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && posts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay artículos disponibles
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory
                  ? "No se encontraron artículos con los filtros seleccionados."
                  : "Aún no hay artículos publicados. ¡Vuelve pronto!"}
              </p>
            </div>
          )}

          {/* Paginación Mejorada */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-12">
              {/* Info de paginación */}
              <div className="text-sm text-gray-600">
                Página <span className="font-semibold text-gray-900">{currentPage}</span> de{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </div>

              {/* Botones de paginación */}
              <nav className="flex items-center gap-2 flex-wrap justify-center">
                {/* Botón Primera Página */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Primera página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                {/* Botón Anterior */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex gap-2">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    // Primera página si no está visible
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="dots1" className="px-2 py-2 text-gray-400">...</span>);
                      }
                    }

                    // Páginas visibles
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-4 py-2 border rounded-lg font-medium transition ${
                            currentPage === i
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Última página si no está visible
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="dots2" className="px-2 py-2 text-gray-400">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
                >
                  Siguiente
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Botón Última Página */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
