"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/admin/Button";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name: string;
  author_email?: string;
  status: "draft" | "published" | "scheduled" | "archived";
  published_at?: string;
  scheduled_at?: string;
  is_featured: boolean;
  views: number;
  likes: number;
  tags?: string;
  categories?: string;
  word_count: number;
  reading_time: number;
  ai_generated: boolean;
  ai_prompt?: string;
  ai_model?: string;
  createdAt: string;
  updatedAt: string;
}

interface TitleSuggestion {
  id: number;
  suggested_title: string;
  topic: string;
  ai_model: string;
  status: string;
  generated_at: string;
}

interface BlogStats {
  totals: {
    posts: number;
    published: number;
    drafts: number;
    ai_generated: number;
    views: number;
    likes: number;
  };
  ai_configured: boolean;
}

interface PostFormData {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  author_name: string;
  author_email: string;
  status: "draft" | "published" | "scheduled" | "archived";
  is_featured: boolean;
  tags: string;
  categories: string;
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>(
    [],
  );
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "post" | "ai" | "suggestions" | "apikey"
  >("post");
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    excerpt: "",
    content: "",
    featured_image: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    author_name: "Peruana Informática",
    author_email: "",
    status: "draft",
    is_featured: false,
    tags: "",
    categories: "",
  });

  // Estado para API Key
  const [apiKey, setApiKey] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Configuración de la API
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const getAuthHeaders = () => {
    const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    const credentials = btoa(`${username}:${password}`);

    return {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
  };

  // Cargar datos del blog
  const loadBlogData = useCallback(async () => {
    try {
      setLoading(true);
      const [postsResponse, statsResponse, suggestionsResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/blog/admin?limit=20`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE}/api/blog/admin/stats`, {
            headers: getAuthHeaders(),
          }),
          fetch(
            `${API_BASE}/api/blog/admin/ai/title-suggestions?status=pending`,
            {
              headers: getAuthHeaders(),
            },
          ),
        ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.data || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setTitleSuggestions(suggestionsData.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos del blog");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Generar títulos con IA
  const generateTitles = async () => {
    try {
      setGeneratingTitles(true);
      const response = await fetch(
        `${API_BASE}/api/blog/admin/ai/generate-titles`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            topic: "tecnología",
            count: 5,
            model: "gemini-2.0-flash-exp",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error generando títulos");
      }

      await loadBlogData();
      setModalType("suggestions");
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Error generando títulos con IA");
    } finally {
      setGeneratingTitles(false);
    }
  };

  // Generar contenido desde título
  const generateContentFromTitle = async (suggestionId: number) => {
    try {
      setGeneratingContent(true);
      const response = await fetch(
        `${API_BASE}/api/blog/admin/ai/generate-content`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title_suggestion_id: suggestionId,
            model: "gemini-2.0-flash-exp",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error generando contenido");
      }

      const result = await response.json();
      await loadBlogData();

      // Abrir el post generado para edición
      setSelectedPost(result.data.post);
      loadFormData(result.data.post);
      setModalType("post");
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Error generando contenido con IA");
    } finally {
      setGeneratingContent(false);
    }
  };

  // Gestionar sugerencia de título
  const manageTitleSuggestion = async (
    id: number,
    action: "select" | "reject",
  ) => {
    try {
      await fetch(`${API_BASE}/api/blog/admin/ai/title-suggestions/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
      });

      await loadBlogData();
    } catch (err: any) {
      setError(err.message || "Error gestionando sugerencia");
    }
  };

  // Actualizar estado del post
  const updatePostStatus = async (id: number, status: string) => {
    try {
      await fetch(`${API_BASE}/api/blog/admin/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      await loadBlogData();
    } catch (err: any) {
      setError(err.message || "Error actualizando post");
    }
  };

  // Eliminar post
  const deletePost = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este post?")) return;

    try {
      await fetch(`${API_BASE}/api/blog/admin/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      await loadBlogData();
    } catch (err: any) {
      setError(err.message || "Error eliminando post");
    }
  };

  // Cargar datos de demo
  const loadDemoData = async () => {
    if (
      !confirm(
        "¿Deseas cargar posts de demostración? Esto creará varios posts de ejemplo.",
      )
    )
      return;

    try {
      setLoadingDemo(true);
      const response = await fetch(`${API_BASE}/api/blog/admin/demo`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error cargando datos demo");
      }

      await loadBlogData();
      alert("✅ Posts de demostración cargados exitosamente");
    } catch (err: any) {
      setError(err.message || "Error cargando datos demo");
    } finally {
      setLoadingDemo(false);
    }
  };

  // Guardar API Key
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      alert("Por favor ingresa una API Key válida");
      return;
    }

    try {
      setSavingApiKey(true);
      const response = await fetch(`${API_BASE}/api/blog/admin/config/gemini`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error guardando API Key");
      }

      await loadBlogData();
      setIsModalOpen(false);
      setApiKey("");
      alert(
        "✅ API Key configurada exitosamente. Las funciones de IA están ahora disponibles.",
      );
    } catch (err: any) {
      setError(err.message || "Error guardando API Key");
    } finally {
      setSavingApiKey(false);
    }
  };

  // Cargar datos del formulario desde un post
  const loadFormData = (post: BlogPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      meta_keywords: post.meta_keywords || "",
      author_name: post.author_name,
      author_email: post.author_email || "",
      status: post.status,
      is_featured: post.is_featured,
      tags: post.tags || "",
      categories: post.categories || "",
    });
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      featured_image: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      author_name: "Peruana Informática",
      author_email: "",
      status: "draft",
      is_featured: false,
      tags: "",
      categories: "",
    });
    setSelectedPost(null);
  };

  // Guardar post (crear o actualizar)
  const savePost = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("El título y contenido son obligatorios");
      return;
    }

    try {
      setSavingPost(true);

      const url = selectedPost
        ? `${API_BASE}/api/blog/admin/${selectedPost.id}`
        : `${API_BASE}/api/blog/admin`;

      const method = selectedPost ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error guardando post");
      }

      await loadBlogData();
      setIsModalOpen(false);
      resetForm();
      alert(
        selectedPost
          ? "✅ Post actualizado exitosamente"
          : "✅ Post creado exitosamente",
      );
    } catch (err: any) {
      setError(err.message || "Error guardando post");
    } finally {
      setSavingPost(false);
    }
  };

  // Abrir modal para nuevo post
  const openNewPostModal = () => {
    resetForm();
    setModalType("post");
    setIsModalOpen(true);
  };

  // Abrir modal para editar post
  const openEditPostModal = (post: BlogPost) => {
    setSelectedPost(post);
    loadFormData(post);
    setModalType("post");
    setIsModalOpen(true);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      scheduled: "bg-blue-100 text-blue-700",
      archived: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  useEffect(() => {
    loadBlogData();
  }, [loadBlogData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión del Blog</h1>
          <p className="text-gray-500 mt-1">
            Administra contenido con IA integrada
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Total Posts</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {stats.totals.posts}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Publicados</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.totals.published}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Generados por IA</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {stats.totals.ai_generated}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Total Vistas</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totals.views}
              </div>
            </div>
          </div>
        )}

        {/* Herramientas de IA */}
        {stats?.ai_configured && (
          <div className="space-y-4 mb-6">
            {/* Panel principal de IA */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    🤖 Herramientas de IA (ACTIVA ✅)
                  </h2>
                  <p className="text-white/90">
                    Genera contenido automáticamente con inteligencia artificial
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={generateTitles}
                    disabled={generatingTitles}
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    {generatingTitles ? "Generando..." : "✨ Generar Títulos"}
                  </Button>
                  {titleSuggestions.length > 0 && (
                    <Button
                      onClick={() => {
                        setModalType("suggestions");
                        setIsModalOpen(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 border-white/30"
                    >
                      Ver Sugerencias ({titleSuggestions.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de configuración de API Key */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    🔑 API Key de Google Gemini
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza... (Ingresa tu API Key aquí para cambiarla)"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Button
                      size="sm"
                      onClick={saveApiKey}
                      disabled={savingApiKey || !apiKey.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {savingApiKey ? "Guardando..." : "💾 Actualizar"}
                    </Button>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                    >
                      🔗 Obtener nueva
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 <strong>Tip:</strong> Si hay errores, genera una nueva
                    API Key en{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Google AI Studio
                    </a>{" "}
                    y pégala aquí. Luego reinicia el servidor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!stats?.ai_configured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    IA no configurada (100% GRATIS)
                  </h3>
                  <p className="text-yellow-700">
                    Configura tu API Key de Google Gemini (gratuita) para usar
                    las funciones de IA
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setModalType("apikey");
                  setIsModalOpen(true);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                🔑 Configurar API Key
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Posts */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Posts del Blog</h2>
            <div className="flex gap-3">
              <Button
                onClick={loadDemoData}
                disabled={loadingDemo}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                {loadingDemo ? "Cargando..." : "📦 Cargar Posts Demo"}
              </Button>
              <Button onClick={openNewPostModal}>+ Nuevo Post</Button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {post.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </span>
                      {post.ai_generated && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          🤖 IA
                        </span>
                      )}
                      {post.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          ⭐ Destacado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {post.excerpt || post.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                      onClick={() => openEditPostModal(post)}
                    >
                      Editar
                    </Button>
                    {post.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updatePostStatus(post.id, "published")}
                      >
                        Publicar
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button
                        size="sm"
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                        onClick={() => updatePostStatus(post.id, "draft")}
                      >
                        Despublicar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => deletePost(post.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-4">No hay posts aún</p>
                <p className="text-sm mb-4">
                  ¡Crea tu primer post o carga datos de demostración!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={openNewPostModal}>+ Crear Post</Button>
                  <Button
                    onClick={loadDemoData}
                    disabled={loadingDemo}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {loadingDemo ? "Cargando..." : "📦 Cargar Posts Demo"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para configurar API Key */}
        {isModalOpen && modalType === "apikey" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  🔑 Configurar Google Gemini API Key (GRATIS 🎉)
                </h2>
                <p className="text-gray-600 mt-1">
                  Ingresa tu API Key gratuita de Google Gemini para habilitar
                  las funciones de IA
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tu API Key se guardará de forma segura en el servidor.
                    Puedes obtenerla GRATIS en{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Google AI Studio (100% GRATIS)
                    </a>
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    🎉 ¿Por qué Google Gemini es la mejor opción?
                  </h4>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li>
                      ✅ <strong>100% GRATUITO</strong> - Sin tarjeta de crédito
                    </li>
                    <li>✨ Generar títulos atractivos automáticamente</li>
                    <li>
                      📝 Crear contenido completo para posts (2000+ palabras)
                    </li>
                    <li>🖼️ Imágenes destacadas gratis (Unsplash)</li>
                    <li>🏷️ Sugerir tags y categorías relevantes</li>
                    <li>🚀 Muy potente (similar a GPT-4)</li>
                    <li>⚡ 60 solicitudes por minuto</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setApiKey("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveApiKey}
                  disabled={savingApiKey || !apiKey.trim()}
                >
                  {savingApiKey ? "Guardando..." : "💾 Guardar API Key"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para sugerencias de títulos */}
        {isModalOpen && modalType === "suggestions" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  🤖 Sugerencias de Títulos de IA
                </h2>
                <p className="text-gray-600 mt-1">
                  Selecciona un título para generar el contenido completo
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {titleSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {suggestion.suggested_title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Tema: {suggestion.topic || "General"}</span>
                            <span>•</span>
                            <span>Modelo: {suggestion.ai_model}</span>
                            <span>•</span>
                            <span>{formatDate(suggestion.generated_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              generateContentFromTitle(suggestion.id)
                            }
                            disabled={generatingContent}
                          >
                            {generatingContent
                              ? "Generando..."
                              : "✨ Generar Post"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              manageTitleSuggestion(suggestion.id, "select")
                            }
                          >
                            ✓ Marcar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              manageTitleSuggestion(suggestion.id, "reject")
                            }
                          >
                            ✗ Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {titleSuggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay sugerencias pendientes. Genera nuevos títulos con IA.
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de crear/editar post */}
        {isModalOpen && modalType === "post" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full my-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPost ? "📝 Editar Post" : "✨ Nuevo Post"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedPost
                    ? "Modifica los campos que desees actualizar"
                    : "Completa la información del post"}
                </p>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Título del post"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Extracto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extracto
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Breve descripción del post"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Contenido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Contenido completo del post (Markdown soportado)"
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  {/* Imagen destacada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Imagen Destacada
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featured_image: e.target.value,
                        })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Autor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Autor
                      </label>
                      <input
                        type="text"
                        value={formData.author_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            author_name: e.target.value,
                          })
                        }
                        placeholder="Nombre del autor"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email del Autor
                      </label>
                      <input
                        type="email"
                        value={formData.author_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            author_email: e.target.value,
                          })
                        }
                        placeholder="email@ejemplo.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Tags y Categorías */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) =>
                          setFormData({ ...formData, tags: e.target.value })
                        }
                        placeholder="tag1, tag2, tag3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separados por comas
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categorías
                      </label>
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categories: e.target.value,
                          })
                        }
                        placeholder="categoría1, categoría2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separadas por comas
                      </p>
                    </div>
                  </div>

                  {/* SEO Meta */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      🔍 SEO & Metadatos
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Título
                        </label>
                        <input
                          type="text"
                          value={formData.meta_title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              meta_title: e.target.value,
                            })
                          }
                          placeholder="Título para SEO (si es diferente al título del post)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Descripción
                        </label>
                        <textarea
                          value={formData.meta_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              meta_description: e.target.value,
                            })
                          }
                          placeholder="Descripción para motores de búsqueda"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.meta_keywords}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              meta_keywords: e.target.value,
                            })
                          }
                          placeholder="palabra1, palabra2, palabra3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ⚙️ Opciones
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as
                                | "draft"
                                | "published"
                                | "scheduled"
                                | "archived",
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="draft">Borrador</option>
                          <option value="published">Publicado</option>
                          <option value="scheduled">Programado</option>
                          <option value="archived">Archivado</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_featured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="is_featured"
                          className="text-sm font-medium text-gray-700"
                        >
                          ⭐ Marcar como destacado
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={savePost}
                  disabled={
                    savingPost ||
                    !formData.title.trim() ||
                    !formData.content.trim()
                  }
                >
                  {savingPost
                    ? "Guardando..."
                    : selectedPost
                      ? "💾 Actualizar Post"
                      : "✨ Crear Post"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
