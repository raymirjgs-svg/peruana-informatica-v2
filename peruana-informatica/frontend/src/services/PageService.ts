import apiClient from '../utils/api';

export interface Page {
    id: number;
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePageData {
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    meta_title?: string;
    meta_description?: string;
}

interface PageListResponse {
    data: Page[];
    pagination: {
        totalPages: number;
        [key: string]: unknown;
    };
}

interface PageResponse {
    success?: boolean;
    data: Page;
    message?: string;
}

interface PageMutationResponse {
    success?: boolean;
    data?: Page;
    message?: string;
}

class PageService {
    /**
     * Get all pages (Admin)
     */
    async getAllPages(page: number = 1, limit: number = 10, search?: string, token?: string) {
        try {
            let url = `/api/admin/pages?page=${page}&limit=${limit}`;
            if (search) {
                url += `&search=${search}`;
            }

            return await apiClient.request<PageListResponse>(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw error;
        }
    }

    /**
     * Get page by ID (Admin)
     */
    async getPageById(id: number, token?: string) {
        try {
            return await apiClient.request<PageResponse>(`/api/admin/pages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error;
        }
    }

    /**
     * Create page (Admin)
     */
    async createPage(data: CreatePageData, token?: string) {
        try {
            return await apiClient.request<PageMutationResponse>('/api/admin/pages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });
        } catch (error) {
            console.error('Error creating page:', error);
            throw error;
        }
    }

    /**
     * Update page (Admin)
     */
    async updatePage(id: number, data: Partial<CreatePageData>, token?: string) {
        try {
            return await apiClient.request<PageMutationResponse>(`/api/admin/pages/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });
        } catch (error) {
            console.error('Error updating page:', error);
            throw error;
        }
    }

    /**
     * Delete page (Admin)
     */
    async deletePage(id: number, token?: string) {
        try {
            return await apiClient.request<PageMutationResponse>(`/api/admin/pages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error deleting page:', error);
            throw error;
        }
    }

    /**
     * Get page by slug (Public)
     */
    async getPageBySlug(slug: string) {
        try {
            const options = { method: 'GET', next: { revalidate: 3600 } };

            return await apiClient.request<PageResponse>(`/api/pages/${slug}`, options);
        } catch (error) {
            console.error('Error fetching page by slug:', error);
            return null;
        }
    }
}

export const pageService = new PageService();
