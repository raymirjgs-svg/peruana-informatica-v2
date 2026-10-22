
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import apiClient from "@/utils/api";

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
        memoryUsage: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
        freeMemory: number;
        totalMemory: number;
    };
    timestamp: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class SystemService {
    private static getAuthHeaders(): Record<string, string> {
        return {
            ...getAdminAuthHeaders(),
        };
    }

    static async getHealth(): Promise<SystemHealth> {
        try {
            return await apiClient.request<SystemHealth>('/api/admin/system/health-check', {
                headers: this.getAuthHeaders(),
            });
        } catch (error) {
            console.error("Error fetching system health:", error);
            throw error;
        }
    }
}

export { SystemService, type SystemHealth };
