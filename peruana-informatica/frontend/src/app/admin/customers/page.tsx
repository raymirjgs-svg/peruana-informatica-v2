'use client';

import { useState, useEffect } from 'react';
import { CustomerService, Customer, CustomerStats } from '@/services/CustomerService';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
                        <p className="text-gray-600 mt-1">Administra los clientes registrados en tu tienda</p>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-sm text-gray-600">Total Clientes</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-sm text-gray-600">Clientes Activos</div>
                                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-sm text-gray-600">Bloqueados</div>
                                <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="text-sm text-gray-600">Nuevos este mes</div>
                                <div className="text-2xl font-bold text-blue-600">{stats.newThisMonth}</div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Método de registro</label>
                                <select
                                    value={authFilter}
                                    onChange={(e) => {
                                        setAuthFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="google">Google</option>
                                    <option value="local">Email/Contraseña</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                <select
                                    value={blockFilter}
                                    onChange={(e) => {
                                        setBlockFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="false">Activos</option>
                                    <option value="true">Bloqueados</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Cargando clientes...</p>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No se encontraron clientes
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último acceso</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {customers.map((customer) => (
                                                <tr key={customer.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.first_name} {customer.last_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{customer.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{getAuthIcon(customer.auth_provider)}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {customer.auth_provider.includes('google') ? 'Google' : 'Email'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(customer.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {customer.last_login ? formatDate(customer.last_login) : 'Nunca'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {customer.is_blocked ? (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                🔒 Bloqueado
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                ✓ Activo
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleToggleBlock(customer.id)}
                                                            className={`${customer.is_blocked
                                                                ? 'text-green-600 hover:text-green-900'
                                                                : 'text-red-600 hover:text-red-900'
                                                                }`}
                                                        >
                                                            {customer.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setPage(Math.max(1, page - 1))}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                disabled={page === totalPages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Página <span className="font-medium">{page}</span> de{' '}
                                                    <span className="font-medium">{totalPages}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => setPage(Math.max(1, page - 1))}
                                                        disabled={page === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Anterior
                                                    </button>
                                                    <button
                                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                        disabled={page === totalPages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
