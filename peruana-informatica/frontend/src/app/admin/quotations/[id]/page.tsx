'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';

type PriceType = 'normal' | 'mayorista' | 'especial';

interface QuotationItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  price_type: PriceType;
  normal_price: number;
  mayorista_price: number;
  especial_price: number;
  subtotal: number;
  discount: number;
}

interface QuotationDetails {
  id: string;
  code: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_ruc: string;
  client_address: string;
  subtotal: number;
  igv: number;
  total: number;
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  created_at: string;
  items: QuotationItem[];
}

export default function QuotationDetail({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'pending' | 'sent' | 'accepted' | 'rejected' | 'expired'>('pending');
  const router = useRouter();

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/quotations/${params.id}`);
        if (!response.ok) throw new Error('Error al cargar la cotización');
        const data = await response.json();
        setQuotation(data);
        setStatus(data.status);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [params.id]);

  const handlePriceTypeChange = (itemId: string, newPriceType: PriceType) => {
    if (!quotation) return;

    const updatedItems = quotation.items.map(item => {
      if (item.id === itemId) {
        const newPrice = {
          normal: item.normal_price,
          mayorista: item.mayorista_price,
          especial: item.especial_price
        }[newPriceType];

        return {
          ...item,
          price_type: newPriceType,
          price: newPrice,
          subtotal: newPrice * item.quantity * (1 - (item.discount / 100))
        };
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18; // 18% IGV
    const total = subtotal + igv;

    setQuotation({
      ...quotation,
      items: updatedItems,
      subtotal,
      igv,
      total
    });
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (!quotation || newQuantity < 1) return;

    const updatedItems = quotation.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          subtotal: item.price * newQuantity * (1 - (item.discount / 100))
        };
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18; // 18% IGV
    const total = subtotal + igv;

    setQuotation({
      ...quotation,
      items: updatedItems,
      subtotal,
      igv,
      total
    });
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    if (!quotation || newDiscount < 0 || newDiscount > 100) return;

    const updatedItems = quotation.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          discount: newDiscount,
          subtotal: item.price * item.quantity * (1 - (newDiscount / 100))
        };
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18; // 18% IGV
    const total = subtotal + igv;

    setQuotation({
      ...quotation,
      items: updatedItems,
      subtotal,
      igv,
      total
    });
  };

  const handleStatusChange = (newStatus: typeof status) => {
    setStatus(newStatus);
  };

  const handleSaveChanges = async () => {
    if (!quotation) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/quotations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: quotation.items.map(item => ({
            id: item.id,
            price_type: item.price_type,
            quantity: item.quantity,
            discount: item.discount
          })),
          status
        }),
      });

      if (!response.ok) throw new Error('Error al guardar los cambios');

      // Show success message
      alert('Cambios guardados exitosamente');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!quotation) return;

    if (confirm('¿Está seguro de enviar esta cotización por correo electrónico?')) {
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/quotations/${params.id}/send-email`, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Error al enviar el correo');

        alert('Correo enviado exitosamente');
        // Update status to 'sent'
        setStatus('sent');
      } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al enviar el correo');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Cargando cotización...</div>
      </AdminLayout>
    );
  }

  if (!quotation) {
    return (
      <AdminLayout>
        <div className="p-8">No se encontró la cotización solicitada</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cotización #{quotation.code}</h1>
            <p className="text-sm text-gray-500">
              Creada el {new Date(quotation.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/quotations`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Volver
            </Link>
            <a
              href={`${API_CONFIG.API_BASE_URL}/quotations/${quotation.code}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver PDF
            </a>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Enviar por correo
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Información del Cliente</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_name}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_phone || 'No especificado'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_company || 'No especificada'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">RUC</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_ruc || 'No especificado'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {quotation.client_address || 'No especificada'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="sent">Enviado</option>
                    <option value="accepted">Aceptado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="expired">Expirado</option>
                  </select>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Válido hasta</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(quotation.valid_until).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Productos</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotation.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="mt-1">
                          <select
                            value={item.price_type}
                            onChange={(e) => handlePriceTypeChange(item.id, e.target.value as PriceType)}
                            className="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="normal">Precio Normal (S/. {item.normal_price})</option>
                            <option value="mayorista">Precio Mayorista (S/. {item.mayorista_price})</option>
                            <option value="especial">Precio Especial (S/. {item.especial_price})</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        S/. {item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        S/. {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      Subtotal
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      S/. {quotation.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      IGV (18%)
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      S/. {quotation.igv.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                      S/. {quotation.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/admin/quotations`}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver
          </Link>
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
