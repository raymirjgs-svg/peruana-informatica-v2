'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/admin/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/admin/Modal';
import { adminFetch } from '@/lib/adminApi';
import { roleService } from '@/services/RoleService';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_blocked: boolean;
  last_login?: string | null;
  createdAt?: string;
}

interface RoleOption {
  id: number;
  name: string;
  slug: string;
}

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
}

const emptyForm: FormState = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'admin',
  password: '',
};

const inputCls =
  'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/admin/users?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Error al cargar usuarios');
      setUsers(json.data?.users || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    roleService
      .getAllRoles(localStorage.getItem('adminToken') || undefined)
      .then((r) => setRoles(r.data || []))
      .catch(() => setRoles([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    setForm({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };

      const res = editing
        ? await adminFetch(`/admin/users/${editing.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await adminFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify({ ...payload, email: form.email, password: form.password }),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'No se pudo guardar');

      toast.success(json.message || 'Usuario guardado');
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (user: StaffUser) => {
    try {
      const res = await adminFetch(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_blocked: !user.is_blocked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'No se pudo actualizar');
      toast.success(json.message || 'Usuario actualizado');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    }
  };

  const stats = [
    { label: 'Total staff', value: users.length, color: 'text-gray-900 dark:text-white' },
    {
      label: 'Administradores',
      value: users.filter((u) => u.role === 'admin' || u.role === 'super-admin').length,
      color: 'text-blue-600',
    },
    { label: 'Activos', value: users.filter((u) => !u.is_blocked).length, color: 'text-emerald-600' },
    { label: 'Bloqueados', value: users.filter((u) => u.is_blocked).length, color: 'text-red-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Accesos al panel de administración
              </p>
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            + Nuevo Usuario
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
            >
              <p className="text-xs dark:text-gray-400 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Usuario
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Rol
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Último acceso
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(user.first_name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {user.last_login ? new Date(user.last_login).toLocaleString('es-PE') : 'Nunca'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          status={user.is_blocked ? 'inactive' : 'active'}
                          label={user.is_blocked ? 'Bloqueado' : 'Activo'}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_blocked ? 'success' : 'danger'}
                            onClick={() => toggleBlock(user)}
                          >
                            {user.is_blocked ? 'Activar' : 'Desactivar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombres
                </label>
                <input
                  className={inputCls}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Apellidos
                </label>
                <input
                  className={inputCls}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Rol
              </label>
              <select
                className={inputCls}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roles.length === 0 && <option value="admin">admin</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </label>
              <input
                type="password"
                className={inputCls}
                value={form.password}
                placeholder="Mínimo 8 caracteres"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
