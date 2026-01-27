import { Request, Response } from 'express';
import { sequelize } from '../../database/connection';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';
import os from 'os';

export const getSystemHealth = async (req: Request, res: Response) => {
    const healthData: any = {
        database: { status: 'unknown', latency: 0 },
        externalApi: { status: 'unknown', latency: 0 },
        system: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            loadAvg: os.loadavg()
        },
        timestamp: new Date().toISOString()
    };

    // Check Database
    const dbStart = Date.now();
    try {
        await sequelize.authenticate();
        healthData.database.status = 'ok';
    } catch (error: any) {
        healthData.database.status = 'error';
        healthData.database.message = error.message;
    } finally {
        healthData.database.latency = Date.now() - dbStart;
    }

    // Check External API
    const apiHealth = await PeruanaInformaticaService.checkHealth();
    healthData.externalApi = apiHealth;

    res.json(healthData);
};
