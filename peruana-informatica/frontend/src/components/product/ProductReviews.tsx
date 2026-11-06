'use client';

import { useEffect, useState } from 'react';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { reviewService, type Review, type ReviewSummary } from '@/services/ReviewService';
import { CheckCircle2, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProductReviewsProps {
    productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        minRating: 0,
        verifiedOnly: false,
        sort: 'newest'
    });

    useEffect(() => {
        loadReviews();
        loadSummary();
    }, [productId, page, filters]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewService.getProductReviews(productId, page, 10, {
                minRating: filters.minRating || undefined,
                verifiedOnly: filters.verifiedOnly,
                sort: filters.sort
            });
            if (response.success) {
                setReviews(response.data.reviews);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const response = await reviewService.getProductRatingSummary(productId);
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    const handleMarkHelpful = async (reviewId: number) => {
        try {
            await reviewService.markHelpful(reviewId);
            toast.success('Gracias por tu feedback');
            // Don't reload everything, just optimistic update could be better but reload is safer
            loadReviews();
        } catch (error) {
            toast.error('Error al procesar tu voto');
        }
    };

    const handleReviewSuccess = () => {
        setShowReviewForm(false);
        loadReviews();
        loadSummary();
    };

    const toggleStarFilter = (star: number) => {
        setFilters(prev => ({
            ...prev,
            minRating: prev.minRating === star ? 0 : star,
            page: 1 // Reset to first page
        }));
        setPage(1);
    };

    return (
        <div className="space-y-8" id="reviews-section">
            {/* Rating Summary */}
            {summary && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Overall Rating */}
                        <div className="md:col-span-3 text-center border-r border-gray-200 dark:border-gray-700 pr-4">
                            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                {summary.average.toFixed(1)}
                            </div>
                            <div className="flex justify-center mb-2">
                                <StarRating rating={summary.average} size="lg" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {summary.total} calificaciones globales
                            </p>
                        </div>

                        {/* Rating Distribution (Clickable) */}
                        <div className="md:col-span-5 space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = summary.distribution[star as keyof typeof summary.distribution];
                                const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                                const isSelected = filters.minRating === star;

                                return (
                                    <button
                                        key={star}
                                        onClick={() => toggleStarFilter(star)}
                                        className={`w-full flex items-center gap-3 group px-2 rounded-md transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                    >
                                        <span className="text-sm font-medium w-12 text-blue-600 dark:text-blue-400 cursor-pointer hover:underline text-left">
                                            {star} estrellas
                                        </span>
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-blue-500' : 'bg-yellow-400'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                                            {Math.round(percentage)}%
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filters & Actions */}
                        <div className="md:col-span-4 flex flex-col justify-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Filtrar reseñas por:</h4>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.verifiedOnly}
                                        onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked, page: 1 }))}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Solo compras verificadas</span>
                                </label>

                                <select
                                    value={filters.sort}
                                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value, page: 1 }))}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="newest">Más recientes</option>
                                    <option value="helpful">Más útiles</option>
                                    <option value="highest">Mejor calificación</option>
                                    <option value="lowest">Peor calificación</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                            >
                                {showReviewForm ? 'Cancelar' : 'Escribir mi opinión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Escribe tu reseña</h3>
                    <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
                </div>
            )}

            {/* Filter Status Badge */}
            {(filters.minRating > 0 || filters.verifiedOnly) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <span>Mostrando:</span>
                    {filters.minRating > 0 && <span className="font-semibold text-blue-600"> {filters.minRating} estrellas </span>}
                    {filters.minRating > 0 && filters.verifiedOnly && <span> + </span>}
                    {filters.verifiedOnly && <span className="font-semibold text-green-600"> Compras verificadas </span>}
                    <button
                        onClick={() => setFilters({ minRating: 0, verifiedOnly: false, sort: 'newest' })}
                        className="ml-auto text-blue-600 hover:text-blue-800 underline"
                    >
                        Borrar filtros
                    </button>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Comentarios de clientes
                </h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex space-x-4">
                                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            {filters.minRating > 0 ? `No hay reseñas de ${filters.minRating} estrellas.` : 'Aún no hay reseñas para este producto.'}
                        </p>
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            ¡Sé el primero en opinar!
                        </button>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-lg">
                                        {review.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {review.customer_name}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <StarRating rating={review.rating} size="sm" />
                                        {review.verified_purchase && (
                                            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                Compra verificada
                                            </span>
                                        )}
                                    </div>

                                    <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                                        {review.title}
                                    </h5>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
                                        {review.comment}
                                    </p>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleMarkHelpful(review.id)}
                                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border rounded-full px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <span className="text-xs">Útil</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-xs">{review.helpful_count}</span>
                                        </button>
                                        <span className="text-xs text-gray-400">¿Le resultó útil esta opinión?</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm border ${page === pageNum
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
