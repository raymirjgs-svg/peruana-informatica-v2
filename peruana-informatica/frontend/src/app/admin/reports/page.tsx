'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BarChart3, TrendingUp, DollarSign, Package, FileText, Download, Calendar, Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { analyticsService, KPIs, SalesDataPoint } from '@/services/AnalyticsService';
import { SalesChart } from '@/components/admin/SalesChart';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.accessToken) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [kpisRes, salesRes] = await Promise.all([
          analyticsService.getKPIs(session.accessToken),
          analyticsService.getSalesOverview(period, session.accessToken)
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
  }, [session, status, period]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Generando reportes...</p>
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
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    {p === '7d' ? 'Semana' : p === '30d' ? 'Mes' : 'Trimestre'}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105">
                <Download className="h-4 w-4" />
                <span>Exportar PDF</span>
              </button>
            </div>
          }
        />

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MotionWrapper delay={0.1}>
            <StatsCard
              title="Ingresos Totales"
              value={`S/ ${kpis?.totalRevenue || '0.00'}`}
              description="Volumen bruto de ventas"
              icon={DollarSign}
              trend={{ value: `${kpis?.monthRevenue ? '+' + kpis.monthRevenue : '+0'} este mes`, isPositive: true }}
              color="indigo"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.2}>
            <StatsCard
              title="Transacciones"
              value={kpis?.totalOrders.toString() || '0'}
              description="Pedidos procesados exitosamente"
              icon={Package}
              trend={{ value: `${kpis?.monthOrders || 0} nuevos`, isPositive: true }}
              color="blue"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.3}>
            <StatsCard
              title="Ticket Promedio"
              value={`S/ ${kpis?.avgOrderValue || '0.00'}`}
              description="Valor medio por pedido"
              icon={TrendingUp}
              color="green"
            />
          </MotionWrapper>
          <MotionWrapper delay={0.4}>
            <StatsCard
              title="Conversion"
              value="3.2%"
              description="Visitantes a compradores"
              icon={Activity}
              trend={{ value: '+0.4%', isPositive: true }}
              color="purple"
            />
          </MotionWrapper>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Sales Chart */}
          <MotionWrapper delay={0.5} className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Evolución de Ingresos
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comportamiento de ventas en el periodo seleccionado</p>
              </div>
              <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="h-80">
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay datos suficientes para graficar</p>
                </div>
              )}
            </div>
          </MotionWrapper>

          {/* Quick Reports List */}
          <MotionWrapper delay={0.6} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reportes Disponibles</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Descarga rápida</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Resumen Mensual', desc: 'Ventas, gastos y beneficios', color: 'blue' },
                { title: 'Inventario Bajo', desc: 'Productos por agotarse', color: 'yellow' },
                { title: 'Mejores Clientes', desc: 'Top compradores del mes', color: 'green' },
                { title: 'Rendimiento de Cat.', desc: 'Ventas por categoría', color: 'purple' }
              ].map((report, i) => (
                <button
                  key={i}
                  className="w-full group flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full bg-${report.color}-500 group-hover:scale-125 transition-transform`} />
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-700 group-hover:text-gray-900 text-sm">{report.title}</p>
                    <p className="text-xs text-gray-400 group-hover:text-gray-500">{report.desc}</p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                Ver todos los reportes →
              </button>
            </div>
          </MotionWrapper>
        </div>
      </div>
    </AdminLayout>
  );
}
