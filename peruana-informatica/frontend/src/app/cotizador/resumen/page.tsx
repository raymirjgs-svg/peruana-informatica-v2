'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/api';
import Link from 'next/link';
import CustomerForm from './components/CustomerForm';
import ItemsSummary from './components/ItemsSummary';
import SuccessScreen from './components/SuccessScreen';
import type { QuotationFormData, QuotationItem } from './components/types';

export default function QuotationSummaryPage() {
    const router = useRouter();
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [quotationResult, setQuotationResult] = useState<import('./components/types').QuotationResult | null>(null);

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

                Object.values(build as Record<string, unknown>).forEach((product) => {
                    if (product && typeof product === 'object') {
                        const p = product as Record<string, unknown>;
                        const price = typeof p.price === 'string' ? parseFloat(p.price) : typeof p.price === 'number' ? p.price : 0;
                        newItems.push({
                            product_id: typeof p.id === 'number' ? p.id : Number(p.id) || 0,
                            product_name: typeof p.name === 'string' ? p.name : '',
                            product_price: price,
                            quantity: 1,
                            subtotal: price,
                            product: p as Record<string, unknown>
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

            const response = await apiClient.createQuotation(quotationData) as Record<string, unknown>;

            setQuotationResult({
                code: typeof response.code === 'string' ? response.code : '',
                client_name: formData.client_name,
                total: typeof response.total === 'number' || typeof response.total === 'string' ? response.total : 0,
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
            <SuccessScreen
                quotationResult={quotationResult}
                onDownloadPdf={() => apiClient.downloadQuotationPdf(quotationResult.code)}
            />
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
                <CustomerForm
                    formData={formData}
                    errors={errors}
                    submitting={submitting}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onDeliveryMethodChange={(method) => setFormData(prev => ({ ...prev, delivery_method: method }))}
                />

                {/* Resumen de Items */}
                <ItemsSummary items={items} subtotal={subtotal} igv={igv} total={total} />
            </div>
        </div>
    );
}
