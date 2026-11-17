'use client';

import Link from 'next/link';
import type { QuotationResult } from './types';

interface SuccessScreenProps {
    quotationResult: QuotationResult;
    onDownloadPdf: () => void;
}

export default function SuccessScreen({ quotationResult, onDownloadPdf }: SuccessScreenProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Cotización Generada!</h1>
                <p className="text-gray-600 mb-8">
                    Gracias por tu solicitud. Tu cotización ha sido creada exitosamente.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto mb-8">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">Detalles de la Cotización</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Código:</span>
                            <span className="font-medium">{quotationResult.code}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Cliente:</span>
                            <span className="font-medium">{quotationResult.client_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-green-600">S/. {
                                typeof quotationResult.total === 'number'
                                    ? quotationResult.total.toFixed(2)
                                    : parseFloat(quotationResult.total).toFixed(2)
                            }</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fecha:</span>
                            <span className="font-medium">{new Date(quotationResult.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={onDownloadPdf}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
                    >
                        Descargar PDF
                    </button>
                    <Link
                        href="/cotizador"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
