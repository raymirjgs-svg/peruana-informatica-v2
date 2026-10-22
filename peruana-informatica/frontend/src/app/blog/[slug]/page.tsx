"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/common/Navigation";
import { BlogService, type BlogPost } from "@/services/BlogService";
import { ReadingProgressBar } from "./components/ReadingProgressBar";
import { PostBreadcrumbs } from "./components/PostBreadcrumbs";
import { PostHero } from "./components/PostHero";
import { PostFeaturedImage } from "./components/PostFeaturedImage";
import { PostTableOfContents } from "./components/PostTableOfContents";
import { PostArticleBody } from "./components/PostArticleBody";
import { PostActions } from "./components/PostActions";
import { PostCallToAction } from "./components/PostCallToAction";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { PostLoading } from "./components/PostLoading";
import { PostNotFound } from "./components/PostNotFound";
import type { TableOfContentsItem } from "./types";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading blog post with slug:', slug);

        const response = await BlogService.getPostBySlug(slug);
        console.log('✅ Post response:', response);

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
        console.error('❌ Error loading post:', err);
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
        <PostLoading />
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navigation />
        <PostNotFound error={error} />
      </>
    );
  }

  return (
    <>
      <Navigation />

      <ReadingProgressBar progress={readProgress} />

      <article className="min-h-screen bg-gray-50">
        <PostBreadcrumbs title={post.title} />

        <PostHero post={post} formatDate={formatDate} />

        <PostFeaturedImage image={getPostImage()} title={post.title} />

        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <PostTableOfContents items={tableOfContents} />

            <div className="flex-1 min-w-0">
              <PostArticleBody post={post} tableOfContents={tableOfContents} />

              <PostActions
                likes={post.likes}
                views={post.views}
                onLike={handleLike}
                onShareTwitter={shareOnTwitter}
                onShareFacebook={shareOnFacebook}
                onShareWhatsApp={shareOnWhatsApp}
                onCopyLink={copyLink}
              />

              <PostCallToAction />
            </div>
          </div>
        </div>
      </article>

      {showScrollTop && <ScrollToTopButton onClick={scrollToTop} />}
    </>
  );
}
