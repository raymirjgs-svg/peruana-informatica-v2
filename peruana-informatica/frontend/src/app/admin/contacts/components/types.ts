export interface ContactFilters {
  status: string;
  asunto: string;
  search: string;
  page: number;
  limit: number;
}

export interface ContactPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ContactStatus = 'pending' | 'resolved' | 'spam';
