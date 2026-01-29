'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/admin/Button';

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
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Usuarios del Sistema</h1>
            <p className="text-gray-500 mt-1">Gestiona los accesos al panel de administración</p>
          </div>
          <Button size="lg">
            <span className="text-xl">+</span>
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm text-gray-500">Total Usuarios</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">12</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm text-gray-500">Administradores</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">2</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm text-gray-500">Vendedores</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">5</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-sm text-gray-500">Activos Hoy</div>
            <div className="text-2xl font-bold text-green-600 mt-1">8</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4">
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>⚠️ En desarrollo:</strong> Sistema de roles y permisos granulares próximamente.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
