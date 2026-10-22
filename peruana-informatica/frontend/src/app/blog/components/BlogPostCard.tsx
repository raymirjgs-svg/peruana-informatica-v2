'use client';

import { BlogService, type BlogPost } from "@/services/BlogService";
import Link from "next/link";
import Image from "next/image";

interface BlogPostCardProps {
  post: BlogPost;
  onLike: (postId: number) => void;
  formatDate: (dateString: string) => string;
  getDefaultImage: (slug: string) => string;
}

export function BlogPostCard({
  post,
  onLike,
  formatDate,
  getDefaultImage,
}: BlogPostCardProps) {
  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
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
          {post.excerpt || BlogService.generateExcerpt(post.content)}
        </p>

        {/* Meta información */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <span>Por {post.author_name}</span>
            <span>{post.reading_time} min lectura</span>
            <span>{formatDate(post.published_at || post.createdAt)}</span>
          </div>
        </div>

        {/* Footer del card */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">👁️ {post.views}</span>
            <button
              onClick={() => onLike(post.id)}
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
  );
}
