'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Mail, Users, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function getApiBase() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return baseUrl.replace(/\/+$/, '');
}

interface SendResult {
    total: number;
    sent: number;
    failed: number;
}

export default function MarketingEmailPage() {
    const [token, setToken] = useState('');
    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<SendResult | null>(null);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken') || '';
        setToken(adminToken);
    }, []);

    useEffect(() => {
        if (!token) return;
        fetch(`${getApiBase()}/api/admin/marketing/customer-count`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) setCustomerCount(data.data.count);
            })
            .catch(() => setCustomerCount(0));
    }, [token]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error('El asunto y el mensaje son obligatorios');
            return;
        }
        if (!confirm(`¿Enviar este correo a ${customerCount} cliente(s) registrado(s)?`)) return;

        setSending(true);
        setResult(null);
        try {
            const res = await fetch(`${getApiBase()}/api/admin/marketing/send-bulk-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ subject, message })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al enviar');
            setResult(data.data);
            if (data.data.failed === 0) {
                toast.success(`${data.data.sent} correos enviados exitosamente`);
            } else {
                toast.warning(`${data.data.sent} enviados, ${data.data.failed} fallidos`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Error al enviar correos');
        } finally {
            setSending(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Correos Masivos</h1>
                        <p className="text-sm text-gray-500">Envía un correo a todos los clientes registrados</p>
                    </div>
                </div>

                {/* Destinatarios */}
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        {customerCount === null
                            ? 'Cargando destinatarios...'
                            : customerCount === 0
                                ? 'No hay clientes registrados aún'
                                : `Este correo se enviará a ${customerCount} cliente${customerCount !== 1 ? 's' : ''} registrado${customerCount !== 1 ? 's' : ''}`}
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleSend} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Asunto *
                            </label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Ej: ¡Oferta especial solo por hoy!"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mensaje *
                            </label>
                            <textarea
                                required
                                rows={8}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Escribe el contenido del correo aquí..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm resize-y"
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                El mensaje se enviará con el saludo personalizado de cada cliente y el pie de firma de la empresa.
                            </p>
                        </div>

                        {/* Preview del email */}
                        {(subject || message) && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Vista previa</p>
                                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 text-sm">
                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Asunto: <span className="text-gray-900 dark:text-white">{subject || '—'}</span>
                                    </p>
                                    <hr className="my-3 dark:border-gray-700" />
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">Hola [Nombre del cliente],</p>
                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message || '—'}</p>
                                    <hr className="my-3 dark:border-gray-700" />
                                    <p className="text-xs text-gray-400">Peruana Informática — Tu tienda de tecnología de confianza</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending || customerCount === 0 || customerCount === null}
                            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {sending
                                ? 'Enviando correos...'
                                : `Enviar a ${customerCount ?? '...'} cliente${customerCount !== 1 ? 's' : ''}`}
                        </button>
                    </form>
                </div>

                {/* Resultado */}
                {result && (
                    <div className={`rounded-lg border p-4 ${result.failed === 0
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        }`}>
                        <p className={`font-semibold mb-2 ${result.failed === 0 ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
                            Resultado del envío
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                <Users className="w-4 h-4" /> Total: <strong>{result.total}</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" /> Enviados: <strong>{result.sent}</strong>
                            </span>
                            {result.failed > 0 && (
                                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                    <XCircle className="w-4 h-4" /> Fallidos: <strong>{result.failed}</strong>
                                </span>
                            )}
                        </div>
                        {result.failed > 0 && (
                            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                Algunos correos fallaron. Verifica la configuración SMTP en los ajustes del sistema.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
