import { API_CONFIG } from '../config/api';
const API_BASE = API_CONFIG.API_BASE_URL;

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

class RoleService {
    /**
     * Get all roles
     */
    async getAllRoles(token?: string) {
        try {
            const response = await fetch(`${API_BASE}/api/admin/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch roles');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/roles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch role');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to create role');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/roles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update role');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/roles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete role');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/permissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch permissions');
            return await response.json();
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
            const response = await fetch(`${API_BASE}/api/admin/assign-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, roleId })
            });

            if (!response.ok) throw new Error('Failed to assign role');
            return await response.json();
        } catch (error) {
            console.error('Error assigning role:', error);
            throw error;
        }
    }
}

export const roleService = new RoleService();
