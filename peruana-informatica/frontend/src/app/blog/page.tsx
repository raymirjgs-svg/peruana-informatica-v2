"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/common/Navigation";
import { BlogService, type BlogPost } from "@/services/BlogService";
import { BlogHeader } from "./components/BlogHeader";
import { BlogFilters } from "./components/BlogFilters";
import { BlogPostGrid } from "./components/BlogPostGrid";
import { BlogEmptyState } from "./components/BlogEmptyState";
import { BlogLoading } from "./components/BlogLoading";
import { BlogPagination } from "./components/BlogPagination";

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
        <BlogHeader />

        <div className="container mx-auto px-4 py-12">
          <BlogFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
              loadPosts(1);
            }}
          />

          {error && (
            <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading && <BlogLoading />}

          {!loading && posts.length > 0 && (
            <BlogPostGrid
              posts={posts}
              onLike={handleLike}
              formatDate={formatDate}
              getDefaultImage={getDefaultImage}
            />
          )}

          {!loading && posts.length === 0 && (
            <BlogEmptyState hasFilters={Boolean(searchTerm || selectedCategory)} />
          )}

          {!loading && totalPages > 1 && (
            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
