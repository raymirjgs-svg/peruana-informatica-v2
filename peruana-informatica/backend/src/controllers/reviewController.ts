import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Image } from '../models/Image';
import { OrderItem } from '../models/OrderItem';
import { Op } from 'sequelize';

export class ReviewController {
    /**
     * Create a new review
     */
    async createReview(req: Request, res: Response) {
        try {
            const { product_id, customer_name, customer_email, rating, title, comment } = req.body;

            // Validate required fields
            if (!product_id || !customer_name || !customer_email || !rating || !title || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            // Validate rating range
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'La calificación debe estar entre 1 y 5'
                });
            }

            // Check if product exists
            const product = await Product.findByPk(product_id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // Check if user has already reviewed this product
            const existingReview = await Review.findOne({
                where: {
                    product_id,
                    customer_email,
                    status: { [Op.in]: ['pending', 'approved'] }
                }
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya has enviado una reseña para este producto'
                });
            }

            // Check if it's a verified purchase (optional)
            let verified_purchase = false;
            const order = await Order.findOne({
                where: {
                    customer_email,
                    status: 'completed' // Or whatever your completed status is
                },
                include: [{
                    model: OrderItem,
                    where: { product_id }
                }]
            });
            if (order) {
                verified_purchase = true;
            }

            // Create review
            const review = await Review.create({
                product_id,
                customer_name,
                customer_email,
                rating,
                title,
                comment,
                verified_purchase,
                status: 'pending', // Reviews start as pending for moderation
            });

            return res.status(201).json({
                success: true,
                message: 'Tu reseña ha sido enviada y está pendiente de moderación',
                data: review
            });
        } catch (error) {
            console.error('Error creating review:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear la reseña'
            });
        }
    }

    /**
     * Get reviews for a product
     */
    async getProductReviews(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            // Filters
            const minRating = parseInt(req.query.minRating as string);
            const verifiedOnly = req.query.verifiedOnly === 'true';

            // Sorting
            const sort = req.query.sort as string; // 'newest', 'oldest', 'highest', 'lowest', 'helpful'

            const where: any = {
                product_id: productId,
                status: 'approved'
            };

            if (minRating && minRating >= 1 && minRating <= 5) {
                where.rating = { [Op.gte]: minRating };
            }

            if (verifiedOnly) {
                where.verified_purchase = true;
            }

            let order: any = [['created_at', 'DESC']]; // Default: Newest

            switch (sort) {
                case 'oldest':
                    order = [['created_at', 'ASC']];
                    break;
                case 'highest':
                    order = [['rating', 'DESC'], ['created_at', 'DESC']];
                    break;
                case 'lowest':
                    order = [['rating', 'ASC'], ['created_at', 'DESC']];
                    break;
                case 'helpful':
                    order = [['helpful_count', 'DESC'], ['created_at', 'DESC']];
                    break;
                case 'newest':
                default:
                    order = [['created_at', 'DESC']];
            }

            const { count, rows: reviews } = await Review.findAndCountAll({
                where,
                order,
                limit,
                offset
            });

            return res.status(200).json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        total: count,
                        page,
                        limit,
                        totalPages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las reseñas'
            });
        }
    }

    /**
     * Get product rating summary
     */
    async getProductRatingSummary(req: Request, res: Response) {
        try {
            const { productId } = req.params;

            const reviews = await Review.findAll({
                where: {
                    product_id: productId,
                    status: 'approved'
                },
                attributes: ['rating']
            });

            const totalReviews = reviews.length;
            if (totalReviews === 0) {
                return res.status(200).json({
                    success: true,
                    data: {
                        average: 0,
                        total: 0,
                        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    }
                });
            }

            // Calculate average
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            const average = sum / totalReviews;

            // Calculate distribution
            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            reviews.forEach(review => {
                distribution[review.rating as keyof typeof distribution]++;
            });

            return res.status(200).json({
                success: true,
                data: {
                    average: parseFloat(average.toFixed(1)),
                    total: totalReviews,
                    distribution
                }
            });
        } catch (error) {
            console.error('Error fetching rating summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el resumen de calificaciones'
            });
        }
    }

    /**
     * Mark review as helpful
     */
    async markHelpful(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;

            const review = await Review.findByPk(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Reseña no encontrada'
                });
            }

            await review.update({
                helpful_count: review.helpful_count + 1
            });

            return res.status(200).json({
                success: true,
                message: 'Gracias por tu feedback',
                data: review
            });
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar tu voto'
            });
        }
    }

    // =================== ADMIN ENDPOINTS ===================

    /**
     * Get all reviews for admin (with pagination and filtering)
     */
    async getAllReviews(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;
            const status = req.query.status as string;

            const where: any = {};
            if (status && ['pending', 'approved', 'rejected'].includes(status)) {
                where.status = status;
            }

            const { count, rows: reviews } = await Review.findAndCountAll({
                where,
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['cod_producto', 'codigo_interno', 'name', 'slug'],
                        include: [{
                            model: Image,
                            as: 'images',
                            attributes: ['imagen'],
                            limit: 1
                        }],
                        required: false
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.status(200).json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        total: count,
                        page,
                        limit,
                        totalPages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching all reviews:', JSON.stringify(error, null, 2));
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las reseñas',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Approve review
     */
    async approveReview(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;

            const review = await Review.findByPk(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Reseña no encontrada'
                });
            }

            await review.update({ status: 'approved' });

            // Update product rating
            await this.updateProductRating(review.product_id);

            return res.status(200).json({
                success: true,
                message: 'Reseña aprobada exitosamente',
                data: review
            });
        } catch (error) {
            console.error('Error approving review:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al aprobar la reseña'
            });
        }
    }

    /**
     * Reject review
     */
    async rejectReview(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;

            const review = await Review.findByPk(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Reseña no encontrada'
                });
            }

            const previousStatus = review.status;
            await review.update({ status: 'rejected' });

            // If it was approved before, update product rating
            if (previousStatus === 'approved') {
                await this.updateProductRating(review.product_id);
            }

            return res.status(200).json({
                success: true,
                message: 'Reseña rechazada',
                data: review
            });
        } catch (error) {
            console.error('Error rejecting review:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al rechazar la reseña'
            });
        }
    }

    /**
     * Delete review
     */
    async deleteReview(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;

            const review = await Review.findByPk(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Reseña no encontrada'
                });
            }

            const productId = review.product_id;
            const wasApproved = review.status === 'approved';

            await review.destroy();

            // Update product rating if it was approved
            if (wasApproved) {
                await this.updateProductRating(productId);
            }

            return res.status(200).json({
                success: true,
                message: 'Reseña eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar la reseña'
            });
        }
    }

    /**
     * Helper: Update product average rating and review count
     */
    private async updateProductRating(productId: number) {
        try {
            const reviews = await Review.findAll({
                where: {
                    product_id: productId,
                    status: 'approved'
                },
                attributes: ['rating']
            });

            const reviewCount = reviews.length;
            const averageRating = reviewCount > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;

            await Product.update(
                {
                    average_rating: parseFloat(averageRating.toFixed(1)),
                    review_count: reviewCount
                },
                {
                    where: { cod_producto: productId }
                }
            );
        } catch (error) {
            console.error('Error updating product rating:', error);
        }
    }
}

export const reviewController = new ReviewController();
