'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderId.trim()) {
            router.push(`/orders/${orderId.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6">
                    <span className="text-3xl">📦</span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Rastrea tu Pedido
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Ingresa el número de pedido que recibiste en tu confirmación de compra
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSearch}>
                        <div>
                            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                                Número de Pedido
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="orderId"
                                    name="orderId"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Ej: 1024"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                disabled={!orderId.trim()}
                            >
                                Buscar Pedido
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    ¿Necesitas ayuda?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <a href="/contacto" className="text-blue-600 hover:text-blue-500 font-medium text-sm">
                                Contactar soporte
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
