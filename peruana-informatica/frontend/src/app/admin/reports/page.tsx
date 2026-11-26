'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, FileText, Download, Calendar, Activity, PackageSearch, UserRound, Boxes } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { analyticsService, KPIs, SalesDataPoint } from '@/services/AnalyticsService';
import { SalesChart } from '@/components/admin/SalesChart';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [period, setPeriod] = useState('30d');

  const exportToCSV = () => {
    if (salesData.length === 0) return;
    const headers = ['Fecha', 'Ingresos cobrados (S/)', 'Pedidos recibidos'];
    const rows = salesData.map(d => [d.date, d.revenue, d.orders]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
    if (!token) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [kpisRes, salesRes] = await Promise.all([
          analyticsService.getKPIs(token),
          analyticsService.getSalesOverview(period, token)
        ]);

        setKpis(kpisRes.data);
        setSalesData(salesRes.data);
      } catch (error) {
        toast.error('Error cargando reportes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generando reportes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Reportes Avanzados"
          description="Inteligencia de negocios y análisis predictivo de ventas"
          icon={BarChart3}
          action={
            <div className="flex items-center gap-3">
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                      }`}
                  >
                    {p === '7d' ? 'Semana' : p === '30d' ? 'Mes' : 'Trimestre'}
                  </button>
                ))}
              </div>
              <button
                onClick={exportToCSV}
                disabled={salesData.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-sm transition-colors">
                <Download className="h-4 w-4" />
                <span>Exportar CSV</span>
              </button>
            </div>
          }
        />

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MotionWrapper delay={0.1}>
            <StatsCard
              title="Ingresos Cobrados"
              value={`S/ ${kpis?.totalRevenue || '0.00'}`}
              description="Pagos verificados (Mercado Pago)"
              icon={DollarSign}
              trend={{ value: `${kpis?.monthRevenue ? '+' + kpis.monthRevenue : '+0'} este mes`, isPositive: true }}
              color="blue"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.2}>
            <StatsCard
              title="Pedidos Recibidos"
              value={kpis?.receivedOrders.toString() || '0'}
              description={`${kpis?.totalOrders || 0} cobrados · ${kpis?.pendingOrders || 0} pendientes`}
              icon={Package}
              trend={{ value: `${kpis?.monthReceivedOrders || 0} este mes`, isPositive: true }}
              color="blue"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.3}>
            <StatsCard
              title="Ticket Promedio"
              value={`S/ ${kpis?.avgOrderValue || '0.00'}`}
              description="Promedio sobre pedidos cobrados"
              icon={TrendingUp}
              color="emerald"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.4}>
            <StatsCard
              title="Cobrados vs. Recibidos"
              value={`${kpis?.receivedOrders ? ((kpis.totalOrders / kpis.receivedOrders) * 100).toFixed(1) : '0.0'}%`}
              description={`${kpis?.totalOrders || 0} de ${kpis?.receivedOrders || 0} pedidos tienen pago verificado`}
              icon={Activity}
              trend={{ value: `${kpis?.pendingOrders || 0} pendientes de pago`, isPositive: false }}
              color="blue"
            />
          </MotionWrapper>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Sales Chart */}
          <MotionWrapper delay={0.5} className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Evolución de Ingresos
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comportamiento de ventas en el periodo seleccionado</p>
              </div>
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="h-80">
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 dark:text-gray-400">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay datos suficientes para graficar</p>
                </div>
              )}
            </div>
          </MotionWrapper>

          {/* Quick Reports List */}
          <MotionWrapper delay={0.6} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reportes Disponibles</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Descarga rápida</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { title: 'Inventario bajo', desc: 'Productos por agotarse', href: '/admin/inventory', icon: PackageSearch },
                { title: 'Mejores clientes', desc: 'Compradores registrados', href: '/admin/customers', icon: UserRound },
                { title: 'Rendimiento de catálogo', desc: 'Ventas por producto', href: '/admin/products', icon: Boxes }
              ].map((report) => (
                <Link
                  key={report.href}
                  href={report.href}
                  className="w-full group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                    <report.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold dark:text-gray-300 dark:group-hover:text-white text-sm">{report.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{report.desc}</p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 dark:group-hover:text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </MotionWrapper>
        </div>
      </div>
    </AdminLayout>
  );
}
