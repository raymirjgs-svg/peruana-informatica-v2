'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/api';
import Link from 'next/link';

interface Product {
    id: number;
    cod_producto: number;
    name: string;
    price: number;
    component_type?: string;
}

interface QuotationItem {
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    product?: any;
}

interface QuotationFormData {
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_company?: string;
    client_ruc?: string;
    client_address?: string;
    delivery_method: 'delivery' | 'pickup';
    delivery_address?: string;
    special_requirements?: string;
}

export default function QuotationSummaryPage() {
    const router = useRouter();
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [quotationResult, setQuotationResult] = useState<any>(null);

    const [formData, setFormData] = useState<QuotationFormData>({
        client_name: '',
        client_email: '',
        client_phone: '',
        client_company: '',
        client_ruc: '',
        client_address: '',
        delivery_method: 'delivery',
        delivery_address: '',
        special_requirements: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Cargar datos del localStorage
        try {
            const savedBuild = localStorage.getItem('pcBuild');
            if (savedBuild) {
                const build = JSON.parse(savedBuild);
                const newItems: QuotationItem[] = [];

                Object.values(build).forEach((product: any) => {
                    if (product) {
                        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                        newItems.push({
                            product_id: product.id,
                            product_name: product.name,
                            product_price: price,
                            quantity: 1,
                            subtotal: price,
                            product: product
                        });
                    }
                });

                setItems(newItems);
            }
        } catch (error) {
            console.error('Error loading build from localStorage:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.client_name.trim()) {
            newErrors.client_name = 'Nombre es requerido';
        }

        if (!formData.client_email.trim()) {
            newErrors.client_email = 'Email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
            newErrors.client_email = 'Email no válido';
        }

        if (formData.delivery_method === 'delivery' && !formData.delivery_address?.trim()) {
            newErrors.delivery_address = 'Dirección de entrega es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (items.length === 0) {
            alert('No hay items en la cotización');
            return;
        }

        setSubmitting(true);
        try {
            const quotationData = {
                ...formData,
                items: items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    product_price: item.product_price,
                    quantity: item.quantity,
                    subtotal: item.subtotal
                })),
                valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const response: any = await apiClient.createQuotation(quotationData);

            setQuotationResult({
                code: response.code,
                client_name: formData.client_name,
                total: response.total,
                date: new Date().toISOString()
            });

            setShowSuccess(true);
            // Limpiar localStorage
            localStorage.removeItem('pcBuild');
        } catch (error) {
            console.error('Error creating quotation:', error);
            alert('Error al crear la cotización. Por favor intente nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (showSuccess && quotationResult) {
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
                            onClick={() => apiClient.downloadQuotationPdf(quotationResult.code)}
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

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">No hay items en la cotización</h2>
                    <p className="text-gray-600 mb-6">Parece que no has seleccionado ningún componente.</p>
                    <Link href="/cotizador/pc" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        Ir al Armador de PC
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Finalizar Cotización</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Cliente */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800">Datos del Cliente</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        id="client_name"
                                        name="client_name"
                                        value={formData.client_name}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.client_name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Ingresa tu nombre completo"
                                    />
                                    {errors.client_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Correo electrónico *
                                    </label>
                                    <input
                                        type="email"
                                        id="client_email"
                                        name="client_email"
                                        value={formData.client_email}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.client_email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="tu@email.com"
                                    />
                                    {errors.client_email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        id="client_phone"
                                        name="client_phone"
                                        value={formData.client_phone}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej. 999 888 777"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="client_company" className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa
                                    </label>
                                    <input
                                        type="text"
                                        id="client_company"
                                        name="client_company"
                                        value={formData.client_company}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nombre de tu empresa"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="client_ruc" className="block text-sm font-medium text-gray-700 mb-1">
                                        RUC
                                    </label>
                                    <input
                                        type="text"
                                        id="client_ruc"
                                        name="client_ruc"
                                        value={formData.client_ruc}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="11 dígitos"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="client_address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        id="client_address"
                                        name="client_address"
                                        value={formData.client_address}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Dirección completa para facturación"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-3">Método de entrega</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.delivery_method === 'delivery'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 hover:border-green-300'
                                            }`}
                                        onClick={() => setFormData(prev => ({ ...prev, delivery_method: 'delivery' }))}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${formData.delivery_method === 'delivery'
                                                    ? 'border-green-500 bg-green-500'
                                                    : 'border-gray-400'
                                                }`}>
                                                {formData.delivery_method === 'delivery' && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-800 cursor-pointer">Delivery a domicilio</label>
                                                <p className="text-sm text-gray-600">Entrega a tu dirección indicada</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.delivery_method === 'pickup'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-300'
                                            }`}
                                        onClick={() => setFormData(prev => ({ ...prev, delivery_method: 'pickup' }))}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${formData.delivery_method === 'pickup'
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-400'
                                                }`}>
                                                {formData.delivery_method === 'pickup' && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-800 cursor-pointer">Recojo en tienda</label>
                                                <p className="text-sm text-gray-600">Recoge en nuestras instalaciones</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {formData.delivery_method === 'delivery' && (
                                    <div className="mt-4">
                                        <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                                            Dirección de entrega *
                                        </label>
                                        <input
                                            type="text"
                                            id="delivery_address"
                                            name="delivery_address"
                                            value={formData.delivery_address}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.delivery_address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Indica la dirección exacta de entrega"
                                        />
                                        {errors.delivery_address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.delivery_address}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700 mb-1">
                                    Requerimientos especiales
                                </label>
                                <textarea
                                    id="special_requirements"
                                    name="special_requirements"
                                    value={formData.special_requirements}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Horarios de entrega, configuraciones especiales, etc."
                                ></textarea>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Procesando...' : 'Generar Cotización'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Resumen de Items */}
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
            </div>
        </div>
    );
}
