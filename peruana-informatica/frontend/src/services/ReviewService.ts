import { API_CONFIG } from '../config/api';
const API_BASE = API_CONFIG.API_BASE_URL;

export interface Review {
    id: number;
    product_id: number;
    customer_name: string;
    customer_email: string;
    rating: number;
    title: string;
    comment: string;
    verified_purchase: boolean;
    helpful_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface ReviewSummary {
    average: number;
    total: number;
    distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface CreateReviewData {
    product_id: number;
    customer_name: string;
    customer_email: string;
    rating: number;
    title: string;
    comment: string;
}

class ReviewService {
    /**
     * Get reviews for a product
     */
    async getProductReviews(
        productId: number,
        page: number = 1,
        limit: number = 10,
        filters?: { minRating?: number; verifiedOnly?: boolean; sort?: string }
    ) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (filters?.minRating) queryParams.append('minRating', filters.minRating.toString());
            if (filters?.verifiedOnly) queryParams.append('verifiedOnly', 'true');
            if (filters?.sort) queryParams.append('sort', filters.sort);

            const response = await fetch(
                `${API_BASE}/api/reviews/product/${productId}?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching reviews:', error);
            throw error;
        }
    }

    /**
     * Get rating summary for a product
     */
    async getProductRatingSummary(productId: number): Promise<{ success: boolean; data: ReviewSummary }> {
        try {
            const response = await fetch(
                `${API_BASE}/api/reviews/product/${productId}/summary`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch rating summary');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching rating summary:', error);
            throw error;
        }
    }

    /**
     * Create a new review
     */
    async createReview(data: CreateReviewData) {
        try {
            const response = await fetch(`${API_BASE}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create review');
            }

            return result;
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    /**
     * Mark a review as helpful
     */
    async markHelpful(reviewId: number) {
        try {
            const response = await fetch(
                `${API_BASE}/api/reviews/${reviewId}/helpful`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark review as helpful');
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            throw error;
        }
    }

    /**
     * Get all reviews (Admin)
     */
    async getAllReviews(page: number = 1, limit: number = 20, status?: string) {
        try {
            let url = `${API_BASE}/api/reviews/admin/all?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            const result = await response.json();
            // Handle both possible response structures
            if (result.data) {
                return result.data;
            }
            // If the response is directly the data
            return result;
        } catch (error) {
            console.error('Error fetching admin reviews:', error);
            // Return empty structure on error to prevent crashes
            return {
                reviews: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalReviews: 0
                }
            };
        }
    }

    /**
     * Approve a review (Admin)
     */
    async approveReview(reviewId: number) {
        try {
            const response = await fetch(`${API_BASE}/api/reviews/admin/${reviewId}/approve`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                throw new Error('Failed to approve review');
            }

            return await response.json();
        } catch (error) {
            console.error('Error approving review:', error);
            throw error;
        }
    }

    /**
     * Reject a review (Admin)
     */
    async rejectReview(reviewId: number) {
        try {
            const response = await fetch(`${API_BASE}/api/reviews/admin/${reviewId}/reject`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                throw new Error('Failed to reject review');
            }

            return await response.json();
        } catch (error) {
            console.error('Error rejecting review:', error);
            throw error;
        }
    }

    /**
     * Delete a review (Admin)
     */
    async deleteReview(reviewId: number) {
        try {
            const response = await fetch(`${API_BASE}/api/reviews/admin/${reviewId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete review');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }
}

export const reviewService = new ReviewService();
