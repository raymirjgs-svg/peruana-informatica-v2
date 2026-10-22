import apiClient from '../utils/api';

export interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_default: boolean;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    description?: string;
}

interface RolesResponse {
    success?: boolean;
    data: Role[];
}

interface PermissionsResponse {
    success?: boolean;
    data: {
        all: Permission[];
        grouped: Record<string, Permission[]>;
    };
}

interface RoleResponse {
    success?: boolean;
    data?: Role;
}

interface RoleMutationResponse {
    success?: boolean;
    message?: string;
}

class RoleService {
    /**
     * Get all roles
     */
    async getAllRoles(token?: string) {
        try {
            return await apiClient.request<RolesResponse>('/api/admin/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }

    /**
     * Get single role
     */
    async getRoleById(id: number, token?: string) {
        try {
            return await apiClient.request<RoleResponse>(`/api/admin/roles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching role:', error);
            throw error;
        }
    }

    /**
     * Create role
     */
    async createRole(data: { name: string; slug: string; description?: string; permissions: number[] }, token?: string) {
        try {
            return await apiClient.request<RoleMutationResponse>('/api/admin/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
        } catch (error) {
            console.error('Error creating role:', error);
            throw error;
        }
    }

    /**
     * Update role
     */
    async updateRole(id: number, data: { name: string; slug: string; description?: string; permissions: number[] }, token?: string) {
        try {
            return await apiClient.request<RoleMutationResponse>(`/api/admin/roles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
        } catch (error) {
            console.error('Error updating role:', error);
            throw error;
        }
    }

    /**
     * Delete role
     */
    async deleteRole(id: number, token?: string) {
        try {
            return await apiClient.request<RoleMutationResponse>(`/api/admin/roles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error deleting role:', error);
            throw error;
        }
    }

    /**
     * Get all permissions
     */
    async getAllPermissions(token?: string) {
        try {
            return await apiClient.request<PermissionsResponse>('/api/admin/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error fetching permissions:', error);
            throw error;
        }
    }

    /**
     * Assign role to user
     */
    async assignRoleToUser(userId: number, roleId: number, token?: string) {
        try {
            return await apiClient.request<RoleMutationResponse>('/api/admin/assign-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: { userId, roleId }
            });
        } catch (error) {
            console.error('Error assigning role:', error);
            throw error;
        }
    }
}

export const roleService = new RoleService();
