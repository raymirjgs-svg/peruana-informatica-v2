
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
    private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    private static readonly API_BASE = `${SystemService.BASE_URL}/api`;

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
            const response = await fetch(`${this.API_BASE}/admin/system/health-check`, {
                headers: this.getAuthHeaders(),
            });

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
