import { Request, Response } from 'express';
import { sequelize } from '../../database/connection';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';
import { geminiService } from '../../services/GeminiService';
import os from 'os';

interface ServiceHealth {
    status: string;
    latency: number;
    message?: string;
}

interface SystemHealthData {
    database: ServiceHealth;
    externalApi: ServiceHealth;
    geminiApi: ServiceHealth;
    googleAuth: { status: string; message?: string };
    system: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        freeMemory: number;
        totalMemory: number;
        loadAvg: number[];
    };
    timestamp: string;
}

interface ServiceCheckResult {
    type: 'database' | 'externalApi' | 'geminiApi';
    status: string;
    latency: number;
    message?: string;
}

export const getSystemHealth = async (req: Request, res: Response) => {
    const healthData: SystemHealthData = {
        database: { status: 'unknown', latency: 0 },
        externalApi: { status: 'unknown', latency: 0 },
        geminiApi: { status: 'unknown', latency: 0 },
        googleAuth: { status: 'unknown', message: 'Not configured' },
        system: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            loadAvg: os.loadavg()
        },
        timestamp: new Date().toISOString()
    };

    const start = Date.now();

    // Probamos todos los servicios en paralelo para mejorar el tiempo de respuesta
    const results = await Promise.allSettled([
        // 1. Base de Datos
        (async (): Promise<ServiceCheckResult> => {
            const dbStart = Date.now();
            try {
                await sequelize.authenticate();
                return { type: 'database', status: 'ok', latency: Date.now() - dbStart };
            } catch {
                return { type: 'database', status: 'error', message: 'No disponible', latency: Date.now() - dbStart };
            }
        })(),

        // 2. API Externa
        (async (): Promise<ServiceCheckResult> => {
            const apiHealth = await PeruanaInformaticaService.checkHealth();
            return { type: 'externalApi', ...apiHealth };
        })(),

        // 3. Gemini API
        (async (): Promise<ServiceCheckResult> => {
            const geminiStart = Date.now();
            try {
                if (process.env.GEMINI_API_KEY) {
                    const isReady = await geminiService.verifyApiKey();
                    return {
                        type: 'geminiApi',
                        status: isReady ? 'ok' : 'error',
                        message: isReady ? undefined : 'API Key no funcional',
                        latency: Date.now() - geminiStart
                    };
                }
                return { type: 'geminiApi', status: 'error', message: 'Falta GEMINI_API_KEY', latency: 0 };
            } catch {
                return { type: 'geminiApi', status: 'error', message: 'No disponible', latency: Date.now() - geminiStart };
            }
        })()
    ]);

    // Procesar resultados
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            const val = result.value;
            if (val.type === 'database') {
                healthData.database.status = val.status;
                healthData.database.latency = val.latency;
                healthData.database.message = val.message;
            } else if (val.type === 'externalApi') {
                healthData.externalApi.status = val.status;
                healthData.externalApi.latency = val.latency;
                healthData.externalApi.message = val.message;
            } else if (val.type === 'geminiApi') {
                healthData.geminiApi.status = val.status;
                healthData.geminiApi.latency = val.latency;
                healthData.geminiApi.message = val.message;
            }
        }
    });

    // Google Auth Check (Síncrono)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        healthData.googleAuth.status = 'ok';
        healthData.googleAuth.message = 'Configurado';
    } else {
        healthData.googleAuth.status = 'error';
        healthData.googleAuth.message = 'Faltan credenciales en .env';
    }

    res.json(healthData);
};
