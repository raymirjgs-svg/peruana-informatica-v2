"use client";

import React, { useState } from 'react';
import { Button } from '../Button';

interface ImportResult {
    success: boolean;
    message: string;
    summary?: {
        total: number;
        creados: number;
        actualizados: number;
        errores: number;
    };
    details?: {
        success: any[];
        updated: any[];
        errors: any[];
    };
}

export function ProductImporter() {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [jsonText, setJsonText] = useState('');
    const [mode, setMode] = useState<'file' | 'text'>('file');

    const getApiBase = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const trimmed = baseUrl.replace(/\/+$/, "");
        return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleImport = async () => {
        let jsonData: any;

        try {
            if (mode === 'file') {
                if (!file) {
                    setResult({
                        success: false,
                        message: 'Por favor selecciona un archivo JSON'
                    });
                    return;
                }

                const text = await file.text();
                jsonData = JSON.parse(text);
            } else {
                if (!jsonText.trim()) {
                    setResult({
                        success: false,
                        message: 'Por favor ingresa el JSON'
                    });
                    return;
                }
                jsonData = JSON.parse(jsonText);
            }

            setImporting(true);
            setResult(null);

            const response = await fetch(`${getApiBase()}/admin/products/import-json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message || 'Importación exitosa',
                    summary: data.summary,
                    details: data.details
                });
                setFile(null);
                setJsonText('');
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Error en la importación'
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || 'Error al procesar el archivo'
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📤 Importación Masiva de Productos</h2>
                <p className="text-gray-600 text-sm mb-6">
                    Importa productos desde el sistema ERP en formato JSON.
                </p>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setMode('file')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${mode === 'file'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📁 Subir Archivo
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${mode === 'text'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📝 Pegar JSON
                    </button>
                </div>

                {mode === 'file' && (
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Seleccionar archivo JSON
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {file && <span className="text-sm text-green-600 font-medium">✓ {file.name}</span>}
                        </div>
                    </div>
                )}

                {mode === 'text' && (
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Pegar JSON del ERP
                        </label>
                        <textarea
                            className="w-full h-64 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder='{\n  "products": [\n    {\n      "codigo": "LAP001",\n      "nombre": "Laptop HP",\n      "precio": 2500,\n      "stock": 10\n    }\n  ]\n}'
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                        />
                    </div>
                )}

                <div className="mt-6">
                    <Button
                        onClick={handleImport}
                        isLoading={importing}
                        size="lg"
                        className="w-full"
                    >
                        {importing ? '⏳ Importando...' : '🚀 Importar Productos'}
                    </Button>
                </div>

                {result && (
                    <div className={`border rounded-xl p-6 mt-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{result.success ? '✅' : '❌'}</span>
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.message}
                                </h3>

                                {result.summary && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-2xl font-bold text-gray-800">{result.summary.total}</div>
                                            <div className="text-xs text-gray-600 uppercase mt-1">Total procesados</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-2xl font-bold text-green-600">{result.summary.creados}</div>
                                            <div className="text-xs text-gray-600 uppercase mt-1">Creados</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-2xl font-bold text-blue-600">{result.summary.actualizados}</div>
                                            <div className="text-xs text-gray-600 uppercase mt-1">Actualizados</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-2xl font-bold text-red-600">{result.summary.errores}</div>
                                            <div className="text-xs text-gray-600 uppercase mt-1">Errores</div>
                                        </div>
                                    </div>
                                )}

                                {result.details && result.details.errors.length > 0 && (
                                    <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                                        <h4 className="font-semibold text-red-800 mb-2">Errores detectados:</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {result.details.errors.map((err: any, idx: number) => (
                                                <div key={idx} className="text-sm text-gray-700 border-l-4 border-red-400 pl-3 py-1">
                                                    <strong>{err.codigo}</strong>: {err.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
