'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from 'next-auth/react';
import { roleService, Role, Permission } from '@/services/RoleService';
import { Shield, Plus, Edit, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPage() {
    const { data: session } = useSession();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<{ all: Permission[]; grouped: Record<string, Permission[]> }>({ all: [], grouped: {} });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.accessToken) return;

            try {
                const [rolesRes, permsRes] = await Promise.all([
                    roleService.getAllRoles(session.accessToken),
                    roleService.getAllPermissions(session.accessToken)
                ]);

                setRoles(rolesRes.data);
                setPermissions(permsRes.data);
            } catch (error) {
                toast.error('Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este rol?')) return;
        if (!session?.accessToken) return;

        try {
            await roleService.deleteRole(id, session.accessToken);
            setRoles(roles.filter(r => r.id !== id));
            toast.success('Rol eliminado');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6 space-y-8">
                <PageHeader
                    title="Roles y Permisos"
                    description="Gestiona roles de usuario y sus permisos"
                    icon={Shield}
                    action={
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Rol
                        </button>
                    }
                />

                {/* Roles Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map(role => (
                        <MotionWrapper
                            key={role.id}
                            className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.slug === 'super-admin' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                                            role.slug === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                                role.slug === 'editor' ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                                                    role.slug === 'moderator' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                                                        'bg-gradient-to-br from-gray-400 to-gray-600'
                                        } text-white`}>
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{role.name}</h3>
                                        <p className="text-sm text-gray-500">{role.slug}</p>
                                    </div>
                                </div>

                                {role.slug !== 'super-admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setEditingRole(role); setShowModal(true); }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {role.description || 'Sin descripción'}
                            </p>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-xs text-gray-500 mb-2">Permisos ({role.permissions?.length || 0})</p>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions?.slice(0, 3).map(perm => (
                                        <span key={perm.id} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-md">
                                            {perm.name}
                                        </span>
                                    ))}
                                    {role.permissions && role.permissions.length > 3 && (
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                            +{role.permissions.length - 3} más
                                        </span>
                                    )}
                                </div>
                            </div>
                        </MotionWrapper>
                    ))}
                </div>

                {/* Permissions Reference */}
                <MotionWrapper className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Permisos Disponibles</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {Object.entries(permissions.grouped).map(([module, perms]) => (
                            <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">{module}</h3>
                                <div className="space-y-2">
                                    {perms.map(perm => (
                                        <div key={perm.id} className="flex items-center gap-2 text-sm">
                                            <Check className="h-3 w-3 text-green-500" />
                                            <span className="text-gray-600 dark:text-gray-400">{perm.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </MotionWrapper>
            </div>
        </AdminLayout>
    );
}
