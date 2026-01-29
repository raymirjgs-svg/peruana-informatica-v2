'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { reviewService, type CreateReviewData } from '@/services/ReviewService';
import { toast } from 'sonner';

interface ReviewFormProps {
    productId: number;
    onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        rating: 0,
        title: '',
        comment: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.rating === 0) {
            toast.error('Por favor selecciona una calificación');
            return;
        }

        setIsSubmitting(true);

        try {
            const reviewData: CreateReviewData = {
                product_id: productId,
                ...formData
            };

            await reviewService.createReview(reviewData);

            toast.success('¡Gracias! Tu reseña ha sido enviada y está pendiente de moderación');

            // Reset form
            setFormData({
                customer_name: '',
                customer_email: '',
                rating: 0,
                title: '',
                comment: ''
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar la reseña');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Escribe tu reseña</h3>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calificación <span className="text-red-500">*</span>
                </label>
                <StarRating
                    rating={formData.rating}
                    interactive
                    size="lg"
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
                />
            </div>

            {/* Name */}
            <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Tu nombre"
                />
            </div>

            {/* Email */}
            <div>
                <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="customer_email"
                    required
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="tu@email.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No será publicado</p>
            </div>

            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título de la reseña <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Resumen de tu experiencia"
                    maxLength={200}
                />
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tu reseña <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="comment"
                    required
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Cuéntanos sobre tu experiencia con este producto..."
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Tu reseña será visible después de ser aprobada por nuestro equipo
            </p>
        </form>
    );
}
