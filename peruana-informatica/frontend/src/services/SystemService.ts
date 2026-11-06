
interface SystemHealth {
    database: {
        status: 'ok' | 'error' | 'unknown';
        latency: number;
        message?: string;
    };
    externalApi: {
        status: 'ok' | 'error' | 'unknown';
        latency: number;
        message?: string;
    };
    geminiApi: {
        status: 'ok' | 'error' | 'unknown';
        latency: number;
        message?: string;
    };
    googleAuth: {
        status: 'ok' | 'error' | 'unknown';
        message?: string;
    };
    system: {
        uptime: number;
        memory: {
            used: number;
            total: number;
            rss: number;
            external: number;
        };
        system: {
            freeMemory: number;
            totalMemory: number;
            cpuCount: number;
            loadAvg: number[];
            platform: string;
            nodeVersion: string;
        };
        timestamp: string;
    };
    timestamp: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

import { API_CONFIG } from '@/config/api';

class SystemService {
    private static readonly BASE_URL = API_CONFIG.BASE_URL;
    private static readonly API_BASE = API_CONFIG.API_BASE_URL;

    private static getAuthHeaders(): Record<string, string> {
        const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
        const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
        const credentials = btoa(`${username}:${password}`);

        return {
            Authorization: `Basic ${credentials}`,
        };
    }

    static async getHealth(): Promise<SystemHealth> {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/system/health-check`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al obtener el estado del sistema");
            }

            return data;
        } catch (error) {
            console.error("Error fetching system health:", error);
            throw error;
        }
    }
}

export { SystemService, type SystemHealth };
