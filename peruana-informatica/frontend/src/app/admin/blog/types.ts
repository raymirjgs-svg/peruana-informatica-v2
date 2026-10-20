export interface BlogPost {
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

export interface TitleSuggestion {
  id: number;
  suggested_title: string;
  topic: string;
  ai_model: string;
  status: string;
  generated_at: string;
}

export interface BlogStats {
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

export interface PostFormData {
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
