'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import dynamic from 'next/dynamic';
const SalesChart = dynamic(() => import('@/components/admin/SalesChart').then(mod => ({ default: mod.SalesChart })), { ssr: false, loading: () => <div className="h-80 bg-gray-100 rounded-lg animate-pulse" /> });
import { analyticsService, KPIs, SalesDataPoint, TopProduct } from '@/services/AnalyticsService';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  Clock,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Bienvenido');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.accessToken) {
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [kpisRes, salesRes, productsRes] = await Promise.all([
          analyticsService.getKPIs(session.accessToken),
          analyticsService.getSalesOverview(period, session.accessToken),
          analyticsService.getTopProducts(5, session.accessToken)
        ]);

        setKpis(kpisRes.data);
        setSalesData(salesRes.data);
        setTopProducts(productsRes.data);
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Error al cargar analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [session, status, period]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {greeting}, {session?.user?.username || 'Admin'} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Resumen general de tu tienda
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex gap-1 shrink-0">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Ingresos Totales"
            value={`S/ ${kpis?.totalRevenue || '0'}`}
            description={`${kpis?.totalOrders || 0} pedidos`}
            icon={DollarSign}
            color="green"
            trend={{ value: '+12%', isPositive: true }}
          />
          <StatsCard
            title="Ventas del Mes"
            value={`S/ ${kpis?.monthRevenue || '0'}`}
            description="Ingresos recientes"
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Ticket Promedio"
            value={`S/ ${kpis?.avgOrderValue || '0'}`}
            description="Valor por venta"
            icon={ShoppingCart}
            color="purple"
          />
          <StatsCard
            title="Clientes Nuevos"
            value={kpis?.totalCustomers.toString() || '0'}
            description="Registrados este mes"
            icon={Users}
            color="indigo"
          />
        </div>

        {/* Pending Orders Alert */}
        {kpis && kpis.pendingOrders > 0 && (
          <MotionWrapper delay={0.2} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Atención requerida</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm">{kpis.pendingOrders} pedidos pendientes de verificación</p>
            </div>
            <Link href="/admin/orders" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors">
              Gestionar
            </Link>
          </MotionWrapper>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Rendimiento de Ventas</h2>
            </div>
            <div className="h-80 w-full">
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Package className="h-10 w-10 mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium">No hay datos suficientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Award className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Productos Líderes</h2>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {topProducts.length > 0 ? (
                topProducts.map((item, index) => (
                  <div
                    key={item.product_id}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-gray-900 shadow ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <img
                          src={item.product?.image || '/placeholder.png'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.product?.name}
                      </p>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {item.product?.stock} en stock
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.total_sold}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">ventas</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sin datos de venta</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
