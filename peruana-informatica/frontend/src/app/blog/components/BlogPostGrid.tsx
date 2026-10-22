'use client';

import type { BlogPost } from "@/services/BlogService";
import { BlogPostCard } from "./BlogPostCard";

interface BlogPostGridProps {
  posts: BlogPost[];
  onLike: (postId: number) => void;
  formatDate: (dateString: string) => string;
  getDefaultImage: (slug: string) => string;
}

export function BlogPostGrid({
  posts,
  onLike,
  formatDate,
  getDefaultImage,
}: BlogPostGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          post={post}
          onLike={onLike}
          formatDate={formatDate}
          getDefaultImage={getDefaultImage}
        />
      ))}
    </div>
  );
}
