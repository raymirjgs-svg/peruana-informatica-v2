'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';
import {
  FileText,
  Download,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  Filter,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin
} from 'lucide-react';

interface QuotationItem {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Quotation {
  id: number;
  code: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  total: number;
  status: string;
  valid_until?: string;
  createdAt: string;
  items?: QuotationItem[];
}

interface Metrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalValue: number;
  avgValue: number;
}

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'expired'>('all');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/quotations`);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.quotations || data.data || []);
      setQuotations(items);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics: Metrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const today = quotations.filter(q => new Date(q.createdAt) >= todayStart).length;
    const thisWeek = quotations.filter(q => new Date(q.createdAt) >= weekStart).length;
    const thisMonth = quotations.filter(q => new Date(q.createdAt) >= monthStart).length;
    const totalValue = quotations.reduce((sum, q) => sum + Number(q.total), 0);
    const avgValue = quotations.length > 0 ? totalValue / quotations.length : 0;

    return {
      total: quotations.length,
      today,
      thisWeek,
      thisMonth,
      totalValue,
      avgValue
    };
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    let filtered = [...quotations];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.code.toLowerCase().includes(term) ||
        q.client_name.toLowerCase().includes(term) ||
        q.client_email.toLowerCase().includes(term) ||
        (q.client_company && q.client_company.toLowerCase().includes(term))
      );
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(q => new Date(q.createdAt) >= todayStart);
    } else if (dateFilter === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(q => new Date(q.createdAt) >= weekStart);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(q => new Date(q.createdAt) >= monthStart);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [quotations, searchTerm, dateFilter, statusFilter]);

  const getStatusBadge = (status: string, validUntil?: string) => {
    const isExpired = validUntil && new Date(validUntil) < new Date();

    if (isExpired) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white">Expirada</span>;
    }

    const styles: Record<string, string> = {
      pending: 'bg-amber-500 text-white',
      approved: 'bg-emerald-600 text-white',
      rejected: 'bg-red-600 text-white',
      expired: 'bg-gray-500 text-white'
    };

    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      expired: 'Expirada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {labels[status] || 'Pendiente'}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando cotizaciones...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Gestión de Cotizaciones
              </h1>
              <p className="text-gray-500 dark:text-gray-300 mt-1">
                Administra y da seguimiento a las cotizaciones generadas
              </p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cotizaciones</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{metrics.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hoy</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.today}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Esta Semana</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{metrics.thisWeek}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  S/. {metrics.totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, cliente, email o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por fecha */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === 'all'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === 'today'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === 'week'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === 'month'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Mes
                </button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Mostrando <span className="font-semibold text-gray-900 dark:text-white">{filteredQuotations.length}</span> de {quotations.length} cotizaciones
            </span>
            {(searchTerm || dateFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Cotizaciones */}
        <div className="space-y-4">
          {filteredQuotations.map((quotation) => (
            <div
              key={quotation.id || quotation.code}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Header de la cotización */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setExpandedId(expandedId === quotation.id ? null : quotation.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{quotation.code}</span>
                        {getStatusBadge(quotation.status, quotation.valid_until)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {quotation.client_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(quotation.createdAt).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        S/. {Number(quotation.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`${API_CONFIG.API_BASE_URL}/api/quotations/${quotation.code}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        title="Descargar PDF"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        {expandedId === quotation.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedId === quotation.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Datos del Cliente */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Datos del Cliente
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 w-24">Nombre:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{quotation.client_name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 w-24">Email:</span>
                          <span className="text-blue-600 dark:text-blue-400">{quotation.client_email}</span>
                        </p>
                        {quotation.client_phone && (
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Teléfono:</span>
                            <span className="text-gray-900 dark:text-white">{quotation.client_phone}</span>
                          </p>
                        )}
                        {quotation.client_company && (
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Empresa:</span>
                            <span className="text-gray-900 dark:text-white">{quotation.client_company}</span>
                          </p>
                        )}
                        {quotation.client_ruc && (
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 w-24">RUC:</span>
                            <span className="text-gray-900 dark:text-white font-mono">{quotation.client_ruc}</span>
                          </p>
                        )}
                        {quotation.client_address && (
                          <p className="flex items-start gap-2">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Dirección:</span>
                            <span className="text-gray-900 dark:text-white">{quotation.client_address}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información de la Cotización */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Información de Cotización
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 w-24">Creada:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(quotation.createdAt).toLocaleString('es-PE')}
                          </span>
                        </p>
                        {quotation.valid_until && (
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Válida hasta:</span>
                            <span className={`font-medium ${new Date(quotation.valid_until) < new Date()
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                              {new Date(quotation.valid_until).toLocaleDateString('es-PE')}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  {quotation.items && quotation.items.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Productos Cotizados</h4>
                      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio Unit.</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {quotation.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">S/. {Number(item.product_price).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">S/. {Number(item.subtotal).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">TOTAL:</td>
                              <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                S/. {Number(quotation.total).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredQuotations.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg">
              <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No hay cotizaciones
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || dateFilter !== 'all'
                  ? 'No se encontraron cotizaciones con los filtros aplicados'
                  : 'Aún no se han generado cotizaciones'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
