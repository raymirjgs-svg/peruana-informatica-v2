'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/admin/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Users } from 'lucide-react';

export default function UsersPage() {
  const mockUsers = [
    { id: 1, name: 'Admin Principal', email: 'admin@peruanainformatica.com', role: 'admin', lastLogin: '2024-01-20 10:30', status: 'active' },
    { id: 2, name: 'Juan Vendedor', email: 'juan@peruanainformatica.com', role: 'seller', lastLogin: '2024-01-19 15:45', status: 'active' },
    { id: 3, name: 'María Soporte', email: 'maria@peruanainformatica.com', role: 'support', lastLogin: '2024-01-18 09:20', status: 'active' },
  ];

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    seller: 'bg-blue-100 text-blue-700',
    support: 'bg-green-100 text-green-700',
  };

  const roleLabels = {
    admin: 'Administrador',
    seller: 'Vendedor',
    support: 'Soporte',
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Accesos al panel de administración</p>
            </div>
          </div>
          <Button size="sm">+ Nuevo Usuario</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: 12, color: 'text-gray-900 dark:text-white' },
            { label: 'Administradores', value: 2, color: 'text-purple-600' },
            { label: 'Vendedores', value: 5, color: 'text-blue-600' },
            { label: 'Activos hoy', value: 8, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Último acceso</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[user.role as keyof typeof roleColors]}`}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{user.lastLogin}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status === 'active' ? 'active' : 'inactive'} label={user.status === 'active' ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">Editar</Button>
                        <Button size="sm" variant="danger">Desactivar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>En desarrollo:</strong> Sistema de roles y permisos granulares próximamente.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
