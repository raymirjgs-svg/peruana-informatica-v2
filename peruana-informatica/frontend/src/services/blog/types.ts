export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name: string;
  reading_time: number;
  views: number;
  likes: number;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  is_featured: boolean;
  ai_generated: boolean;
  ai_prompt?: string;
  ai_model?: string;
  tags?: string;
  categories?: string;
  word_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTitleSuggestion {
  id: number;
  suggested_title: string;
  topic?: string;
  ai_prompt?: string;
  ai_model?: string;
  status: 'pending' | 'selected' | 'rejected' | 'used';
  blog_post_id?: number;
  generated_at: string;
  selected_at?: string;
  used_at?: string;
}

export interface BlogStats {
  totals: {
    posts: number;
    published: number;
    drafts: number;
    ai_generated: number;
    views: number;
    likes: number;
    pending_suggestions: number;
  };
  popular_posts: BlogPost[];
  recent_posts: BlogPost[];
  ai_configured: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BlogFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name?: string;
  author_email?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduled_at?: string;
  is_featured?: boolean;
  tags?: string;
  categories?: string;
}

export interface AIGenerationRequest {
  topic?: string;
  count?: number;
  model?: string;
}

export interface ContentGenerationRequest {
  title_suggestion_id: number;
  model?: string;
}
