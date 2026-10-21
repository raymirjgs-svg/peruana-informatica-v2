'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import { BlogPost, TitleSuggestion, BlogStats, PostFormData } from './types';
import { getApiBase } from '@/lib/apiBase';

export function useBlogAdmin() {
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
  const API_BASE = getApiBase();

  const getAuthHeaders = () => ({
    ...getAdminAuthHeaders(),
    "Content-Type": "application/json",
  });

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

  useEffect(() => {
    loadBlogData();
  }, [loadBlogData]);

  return {
    posts,
    titleSuggestions,
    stats,
    loading,
    error,
    setError,
    selectedPost,
    isModalOpen,
    setIsModalOpen,
    modalType,
    setModalType,
    generatingTitles,
    generatingContent,
    loadingDemo,
    savingPost,
    formData,
    setFormData,
    apiKey,
    setApiKey,
    savingApiKey,
    loadBlogData,
    generateTitles,
    generateContentFromTitle,
    manageTitleSuggestion,
    updatePostStatus,
    deletePost,
    loadDemoData,
    saveApiKey,
    savePost,
    resetForm,
    openNewPostModal,
    openEditPostModal,
  };
}
