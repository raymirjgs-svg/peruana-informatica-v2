'use client';

import { useState, useEffect } from 'react';
import { CustomerService, Customer, CustomerStats } from '@/services/CustomerService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Users, Search } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [authFilter, setAuthFilter] = useState('');
    const [blockFilter, setBlockFilter] = useState('');

    useEffect(() => {
        loadCustomers();
        loadStats();
    }, [page, search, authFilter, blockFilter]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await CustomerService.getCustomers({
                page,
                limit,
                search: search || undefined,
                authProvider: authFilter || undefined,
                isBlocked: blockFilter || undefined
            });
            setCustomers(response.customers);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await CustomerService.getCustomerStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleToggleBlock = async (customerId: number) => {
        if (!confirm('¿Estás seguro de bloquear/desbloquear este cliente?')) return;

        try {
            await CustomerService.toggleBlockCustomer(customerId);
            await loadCustomers();
            await loadStats();
        } catch (error) {
            console.error('Error toggling customer block:', error);
            alert('Error al actualizar el estado del cliente');
        }
    };

    const getAuthIcon = (authProvider: string) => {
        if (authProvider.includes('google')) return '🔵';
        return '📧';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const sel = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none';

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Clientes registrados en la tienda</p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white' },
                            { label: 'Activos', value: stats.active, color: 'text-emerald-600' },
                            { label: 'Bloqueados', value: stats.blocked, color: 'text-red-600' },
                            { label: 'Nuevos este mes', value: stats.newThisMonth, color: 'text-blue-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input type="text" placeholder="Buscar por nombre o email..." value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                        </div>
                        <select value={authFilter} onChange={(e) => { setAuthFilter(e.target.value); setPage(1); }} className={sel}>
                            <option value="">Todos los métodos</option>
                            <option value="google">Google</option>
                            <option value="local">Email / Contraseña</option>
                        </select>
                        <select value={blockFilter} onChange={(e) => { setBlockFilter(e.target.value); setPage(1); }} className={sel}>
                            <option value="">Todos los estados</option>
                            <option value="false">Activos</option>
                            <option value="true">Bloqueados</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            <p className="text-sm text-gray-400">Cargando clientes...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-400">No se encontraron clientes</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Método</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrado</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Último acceso</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {customers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                            {customer.first_name?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{customer.first_name} {customer.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{customer.email}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                                        {customer.auth_provider.includes('google') ? <span className="text-blue-500">G</span> : <span>@</span>}
                                                        {customer.auth_provider.includes('google') ? 'Google' : 'Email'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-400">{formatDate(customer.createdAt)}</td>
                                                <td className="px-5 py-3.5 text-sm text-gray-400">{customer.last_login ? formatDate(customer.last_login) : '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={customer.is_blocked ? 'inactive' : 'active'} label={customer.is_blocked ? 'Bloqueado' : 'Activo'} />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button onClick={() => handleToggleBlock(customer.id)}
                                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${customer.is_blocked ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100'}`}>
                                                        {customer.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <p className="text-sm text-gray-400">Página {page} de {totalPages}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                            Anterior
                                        </button>
                                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                                            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
