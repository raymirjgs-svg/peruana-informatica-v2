'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { useSession } from 'next-auth/react';
import { reviewService } from '@/services/ReviewService';
import {
    Star,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    Search,
    Filter,
    MessageSquare,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewsPage() {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchReviews = async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const response = await reviewService.getAllReviews(page, 20, filterStatus === 'all' ? undefined : filterStatus, session.accessToken);
            setReviews(response.reviews);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            toast.error('Error al cargar reseñas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) {
            fetchReviews();
        }
    }, [session, page, filterStatus]);

    const handleStatusChange = async (id: number, action: 'approve' | 'reject') => {
        if (!session?.accessToken) return;
        try {
            if (action === 'approve') {
                await reviewService.approveReview(id, session.accessToken);
                toast.success('Reseña aprobada');
            } else {
                await reviewService.rejectReview(id, session.accessToken);
                toast.success('Reseña rechazada');
            }
            fetchReviews(); // Refresh list
        } catch (err) {
            toast.error('Error al actualizar estado');
        }
    };

    const handleDelete = async (id: number) => {
        if (!session?.accessToken) return;
        if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;
        try {
            await reviewService.deleteReview(id, session.accessToken);
            toast.success('Reseña eliminada');
            fetchReviews();
        } catch (err) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 space-y-8">
                <MotionWrapper>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Reseñas</h1>
                            <p className="text-gray-500 dark:text-gray-400">Modera los comentarios y valoraciones de los clientes</p>
                        </div>
                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {['all', 'pending', 'approved', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setFilterStatus(status); setPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {status === 'all' ? 'Todas' :
                                        status === 'pending' ? 'Pendientes' :
                                            status === 'approved' ? 'Aprobadas' : 'Rechazadas'}
                                </button>
                            ))}
                        </div>
                    </div>
                </MotionWrapper>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="grid gap-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron reseñas</h3>
                                <p className="text-gray-500">No hay reseñas con el filtro seleccionado.</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <MotionWrapper key={review.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        {/* Content */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                        ))}
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">{review.title}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Por <span className="font-medium text-gray-900 dark:text-white">{review.customer_name}</span> el {new Date(review.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                            ${review.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        review.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse'
                                                    }`}>
                                                    {review.status === 'approved' ? 'Aprobada' : review.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                "{review.comment}"
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg w-fit">
                                                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                    {/* Product Image Placeholder */}
                                                    <img src={review.Product?.images?.[0]?.imagen ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${encodeURIComponent(review.Product.images[0].imagen)}` : '/images/no-image.svg'} className="w-full h-full object-cover" />
                                                </div>
                                                <span>Producto: <strong>{review.Product?.name || 'Desconocido'}</strong></span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
                                            {review.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(review.id, 'approve')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(review.id, 'reject')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <XCircle className="h-4 w-4" /> Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {review.status !== 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(review.id, review.status === 'approved' ? 'reject' : 'approve')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Clock className="h-4 w-4" /> Cambiar Estado
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(review.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/10 transition-colors rounded-lg text-sm"
                                            >
                                                <Trash2 className="h-4 w-4" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </MotionWrapper>
                            ))
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
