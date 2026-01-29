import React from 'react';

interface QuotationItem {
    id?: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    product?: any;
}

interface QuotationSummaryProps {
    items: QuotationItem[];
    onRemoveItem?: (index: number) => void;
    onCreateQuotation?: () => void;
    loading?: boolean;
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({
    items,
    onRemoveItem,
    onCreateQuotation,
    loading = false
}) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Resumen</h2>
                <p className="text-gray-500 text-center py-4">No hay items seleccionados</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Resumen de Cotización</h2>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0">
                        <div className="flex-1 pr-2">
                            <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product_name}</p>
                            <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">S/. {item.subtotal.toFixed(2)}</p>
                            {onRemoveItem && (
                                <button
                                    onClick={() => onRemoveItem(index)}
                                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                                >
                                    Eliminar
                                </button>
                            )}
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

            {onCreateQuotation && (
                <button
                    onClick={onCreateQuotation}
                    disabled={loading}
                    className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Procesando...' : 'Generar Cotización'}
                </button>
            )}
        </div>
    );
};

export default QuotationSummary;
