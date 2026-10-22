'use client';

import Link from 'next/link';
import type { QuotationItem } from './types';

interface ItemsSummaryProps {
    items: QuotationItem[];
    subtotal: number;
    igv: number;
    total: number;
}

export default function ItemsSummary({ items, subtotal, igv, total }: ItemsSummaryProps) {
    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Resumen de Componentes</h2>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1 pr-2">
                                <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                                <p className="text-xs text-gray-500">
                                    {item.product?.component_type ? item.product.component_type.toUpperCase() : 'Componente'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">S/. {item.subtotal.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">S/. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IGV (18%)</span>
                        <span className="font-medium">S/. {igv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                        <span className="text-gray-800">Total</span>
                        <span className="text-blue-600">S/. {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <Link href="/cotizador/pc" className="text-blue-600 text-sm hover:underline flex items-center justify-center">
                        ← Editar componentes
                    </Link>
                </div>
            </div>
        </div>
    );
}
