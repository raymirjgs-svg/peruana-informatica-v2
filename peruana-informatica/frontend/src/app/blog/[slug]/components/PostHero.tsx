import Link from "next/link";
import type { BlogPost } from "@/services/BlogService";

interface PostHeroProps {
  post: BlogPost;
  formatDate: (dateString: string) => string;
}

export function PostHero({ post, formatDate }: PostHeroProps) {
  return (
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
              {post.author_name.charAt(0).toUpperCase()}
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
  );
}
