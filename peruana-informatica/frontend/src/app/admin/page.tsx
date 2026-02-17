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
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 animate-pulse">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              {greeting}, {session?.user?.username || 'Admin'} 👋
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Resumen general de tu tienda
            </p>
          </div>

          {/* Period Selector - Imitating Filters Style */}
          <div className="mt-4 md:mt-0 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 flex gap-2">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards - Imitating ProductCard Style (Solid, Shadow, Rounded) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <StatsCard
              title="Ingresos Totales"
              value={`S/ ${kpis?.totalRevenue || '0'}`}
              description={`${kpis?.totalOrders || 0} pedidos`}
              icon={DollarSign}
              color="green" // Using specific color for imitation
              trend={{ value: '+12%', isPositive: true }}
            />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <StatsCard
              title="Ventas del Mes"
              value={`S/ ${kpis?.monthRevenue || '0'}`}
              description="Ingresos recientes"
              icon={TrendingUp}
              color="blue"
            />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <StatsCard
              title="Ticket Promedio"
              value={`S/ ${kpis?.avgOrderValue || '0'}`}
              description="Valor por venta"
              icon={ShoppingCart}
              color="purple"
            />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <StatsCard
              title="Clientes Nuevos"
              value={kpis?.totalCustomers.toString() || '0'}
              description="Registrados este mes"
              icon={Users}
              color="indigo"
            />
          </div>
        </div>

        {/* Pending Orders Alert */}
        {kpis && kpis.pendingOrders > 0 && (
          <MotionWrapper delay={0.2} className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-lg">Atención Requerida</h3>
              <p className="text-amber-800 font-medium">Hay {kpis.pendingOrders} pedidos pendientes de verificación.</p>
            </div>
            <Link href="/admin/orders" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
              Gestionar
            </Link>
          </MotionWrapper>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  Rendimiento de Ventas
                </h2>
              </div>
            </div>
            <div className="h-96 w-full">
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Package className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="font-medium">No hay datos suficientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                Productos Líderes
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {topProducts.length > 0 ? (
                topProducts.map((item, index) => (
                  <div
                    key={item.product_id}
                    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100 hover:border-blue-100"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`absolute -top-3 -left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-md ${index === 0 ? 'bg-yellow-400 text-white' :
                          index === 1 ? 'bg-slate-400 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' :
                              'bg-slate-100 text-slate-600'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                        <img
                          src={item.product?.image || '/placeholder.png'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors text-base">
                        {item.product?.name}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.product?.stock} en stock
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-lg">
                        {item.total_sold}
                      </p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Ventas
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sin datos de venta</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
