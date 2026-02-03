import { API_CONFIG } from '../config/api';
const API_BASE = API_CONFIG.API_BASE_URL;

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

class PageService {
    /**
     * Get all pages (Admin)
     */
    async getAllPages(page: number = 1, limit: number = 10, search?: string, token?: string) {
        try {
            let url = `${API_BASE}/admin/pages?page=${page}&limit=${limit}`;
            if (search) {
                url += `&search=${search}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('PageService Error:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response body:', text);
                throw new Error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
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
            const response = await fetch(`${API_BASE}/admin/pages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch page');
            }

            return await response.json();
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
            const response = await fetch(`${API_BASE}/admin/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create page');
            }

            return await response.json();
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
            const response = await fetch(`${API_BASE}/admin/pages/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update page');
            }

            return await response.json();
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
            const response = await fetch(`${API_BASE}/admin/pages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete page');
            }

            return await response.json();
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
            const response = await fetch(`${API_BASE}/pages/${slug}`, { next: { revalidate: 3600 } });

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error('Failed to fetch page');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching page by slug:', error);
            return null;
        }
    }
}

export const pageService = new PageService();
