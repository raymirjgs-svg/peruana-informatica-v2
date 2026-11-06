'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    Activity,
    Server,
    Database,
    Globe,
    RefreshCw,
    Clock,
    Cpu,
    HardDrive
} from 'lucide-react';
import { SystemService, type SystemHealth } from '@/services/SystemService';

export default function SystemStatusPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = async () => {
        try {
            const data = await SystemService.getHealth();
            setHealth(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchHealth();
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
            case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estado del Sistema</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Monitoreo en tiempo real de servicios y conexiones
                        </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm ${refreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                        Error general: {error}
                    </div>
                )}

                {loading && !health ? (
                    <div className="flex justify-center items-center h-64">
                        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                ) : health ? (
                    <div className="grid grid-cols-1 gap-6">

                        {/* Servicios Criticos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Database Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Base de Datos</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">MySQL / Sequelize</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(health.database.status)}`}>
                                        {health.database.status === 'ok' ? 'Conectado' : 'Error'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">Latencia</span>
                                        <span className="font-mono text-gray-800 dark:text-white">{health.database.latency} ms</span>
                                    </div>
                                    {health.database.message && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md">
                                            {health.database.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gemini API Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Google Gemini (Blog)</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Generación de contenido IA</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(health.geminiApi.status)}`}>
                                        {health.geminiApi.status === 'ok' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">Estado API</span>
                                        <span className="font-medium text-gray-800 dark:text-white">{health.geminiApi.status === 'ok' ? 'Funcional' : 'No configurado'}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {health.geminiApi.message && (
                                            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-md">
                                                {health.geminiApi.message}
                                            </div>
                                        )}
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-medium underline"
                                        >
                                            Obtener o Renovar API Key en Google AI Studio
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Google Auth Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <Globe className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Google Login</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Autenticación OAuth 2.0</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(health.googleAuth.status)}`}>
                                        {health.googleAuth.status === 'ok' ? 'Configurado' : 'Pendiente'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">Configuración</span>
                                        <span className="font-medium text-gray-800 dark:text-white">{health.googleAuth.message}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <a
                                            href="https://console.cloud.google.com/apis/credentials"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-medium underline"
                                        >
                                            Gestionar Credenciales en Google Cloud Console
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* External API Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">API ERP Externa</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">peruanadeinformatica/api</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(health.externalApi.status)}`}>
                                        {health.externalApi.status === 'ok' ? 'Online' : 'Error'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">Latencia</span>
                                        <span className="font-mono text-gray-800 dark:text-white">{health.externalApi.latency} ms</span>
                                    </div>
                                    {health.externalApi.message ? (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md">
                                            {health.externalApi.message}
                                        </div>
                                    ) : (
                                        <div className="p-1 px-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded inline-block">
                                            Conexión estable
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Server className="h-5 w-5 text-gray-500" />
                                Recursos del Servidor
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Uptime */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo de Actividad</p>
                                        <p className="text-xl font-bold text-gray-800 dark:text-white">{formatUptime(health.system.uptime)}</p>
                                    </div>
                                </div>

                                {/* Memory */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                                        <Cpu className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Uso de Memoria (Heap)</p>
                                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                                            {health.system.memory.used} MB / {health.system.memory.total} MB
                                        </p>
                                    </div>
                                </div>

                                {/* System Memory */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                        <HardDrive className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Memoria Libre (SO)</p>
                                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                                            {health.system.system.freeMemory} MB / {health.system.system.totalMemory} MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-right text-xs text-gray-400">
                                Última actualización: {new Date(health.timestamp).toLocaleString()}
                            </div>
                        </div>

                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
}
