'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { useSession } from 'next-auth/react';
import { wishlistService, WishlistAnalytics } from '@/services/WishlistService';
import { Heart, TrendingUp, Package, Clock, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function WishlistsPage() {
    const { data: session } = useSession();
    const [analytics, setAnalytics] = useState<WishlistAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!session?.accessToken) return;

            try {
                const response = await wishlistService.getAnalytics(session.accessToken);
                setAnalytics(response.data);
            } catch (error) {
                toast.error('Error al cargar análisis');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [session]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6 space-y-8">
                <PageHeader
                    title="Análisis de Favoritos"
                    description="Descubre qué productos desean más tus clientes"
                    icon={Heart}
                />

                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <StatsCard
                        title="Total Favoritos"
                        value={analytics?.stats.totalWishlists.toString() || '0'}
                        description="Productos guardados"
                        icon={Heart}
                        color="purple"
                    />
                    <StatsCard
                        title="Productos Únicos"
                        value={analytics?.stats.uniqueProducts.toString() || '0'}
                        description="En listas de deseos"
                        icon={Package}
                        color="purple"
                    />
                    <StatsCard
                        title="Últimos 7 Días"
                        value={analytics?.stats.recentAdditions.toString() || '0'}
                        description="Favoritos recientes"
                        icon={TrendingUp}
                        color="blue"
                    />
                </div>

                {/* Top Products */}
                <MotionWrapper className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-pink-500" />
                            Top 10 Productos Más Deseados
                        </h2>
                    </div>

                    {!analytics?.topProducts || analytics.topProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Aún no hay productos en favoritos</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analytics.topProducts.map((item: any, index: number) => (
                                <div
                                    key={item.product_id}
                                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all group"
                                >
                                    {/* Rank Badge */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}>
                                        #{index + 1}
                                    </div>

                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        <img
                                            src={item.product?.image || '/placeholder.png'}
                                            alt={item.product?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/products/${item.product?.cod_producto}`}
                                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                                        >
                                            {item.product?.name}
                                        </Link>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <ShoppingBag className="h-3.5 w-3.5" />
                                                Stock: {item.product?.stock}
                                            </span>
                                            <span>S/ {item.product?.price?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Wishlist Count */}
                                    <div className="flex-shrink-0 text-right">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                            <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                                            <span className="font-bold text-lg text-pink-600 dark:text-pink-400">
                                                {item.wishlist_count}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">en favoritos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </MotionWrapper>

                {/* Insights */}
                <div className="grid md:grid-cols-2 gap-6">
                    <MotionWrapper className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">💡 Insight</h3>
                                <p className="text-pink-100 text-sm leading-relaxed">
                                    Los productos en favoritos tienen <strong>3x más probabilidad</strong> de convertirse en ventas.
                                    Considera crear campañas dirigidas para estos artículos.
                                </p>
                            </div>
                            <Heart className="h-12 w-12 text-pink-200" />
                        </div>
                    </MotionWrapper>

                    <MotionWrapper className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">📊 Recomendación</h3>
                                <p className="text-purple-100 text-sm leading-relaxed">
                                    Envía notificaciones cuando haya descuentos en productos guardados.
                                    Esto puede aumentar la tasa de conversión hasta un <strong>40%</strong>.
                                </p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-purple-200" />
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </AdminLayout>
    );
}
