import { Request, Response } from 'express';
import { sequelize } from '../../database/connection';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';
import { geminiService } from '../../services/GeminiService';
import { isRedisReady, getRedisClient } from '../../config/redis';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const getSystemHealth = async (req: Request, res: Response) => {
    const healthData: any = {
        database: { status: 'unknown', latency: 0 },
        redis: { status: 'unknown', latency: 0 },
        externalApi: { status: 'unknown', latency: 0 },
        geminiApi: { status: 'unknown', latency: 0 },
        googleAuth: { status: 'unknown', message: 'Not configured' },
        system: {
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024),
            },
            system: {
                freeMemory: Math.round(os.freemem() / 1024 / 1024),
                totalMemory: Math.round(os.totalmem() / 1024 / 1024),
                cpuCount: os.cpus().length,
                loadAvg: os.loadavg(),
                platform: os.platform(),
                nodeVersion: process.version,
            },
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString()
    };

    const start = Date.now();

    // Probamos todos los servicios en paralelo para mejorar el tiempo de respuesta
    const results = await Promise.allSettled([
        // 1. Base de Datos
        (async () => {
            const dbStart = Date.now();
            try {
                await sequelize.authenticate();
                return { type: 'database', status: 'ok', latency: Date.now() - dbStart };
            } catch (error: any) {
                return { type: 'database', status: 'error', message: error.message, latency: Date.now() - dbStart };
            }
        })(),

        // 2. Redis
        (async () => {
            const redisStart = Date.now();
            try {
                const redisReady = isRedisReady();
                if (redisReady) {
                    const client = getRedisClient();
                    if (client) {
                        await client.ping();
                        return { type: 'redis', status: 'ok', latency: Date.now() - redisStart };
                    }
                }
                return { type: 'redis', status: 'disabled', message: 'Redis no disponible', latency: 0 };
            } catch (error: any) {
                return { type: 'redis', status: 'error', message: error.message, latency: Date.now() - redisStart };
            }
        })(),

        // 3. API Externa
        (async () => {
            const apiHealth = await PeruanaInformaticaService.checkHealth();
            return { type: 'externalApi', ...apiHealth };
        })(),

        // 4. Gemini API
        (async () => {
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
            } catch (error: any) {
                return { type: 'geminiApi', status: 'error', message: error.message, latency: Date.now() - geminiStart };
            }
        })()
    ]);

    // Procesar resultados
    results.forEach((result: any) => {
        if (result.status === 'fulfilled') {
            const val = result.value;
            if (val.type === 'database') {
                healthData.database.status = val.status;
                healthData.database.latency = val.latency;
                healthData.database.message = val.message;
            } else if (val.type === 'redis') {
                healthData.redis.status = val.status;
                healthData.redis.latency = val.latency;
                healthData.redis.message = val.message;
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
