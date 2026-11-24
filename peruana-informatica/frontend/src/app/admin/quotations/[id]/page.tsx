'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';

type QuotationStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuotationItem {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface QuotationDetails {
  id: number;
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
  status: QuotationStatus;
  valid_until: string;
  created_at: string;
  items: QuotationItem[];
}

const money = (value: number) => `S/. ${Number(value || 0).toFixed(2)}`;

export default function QuotationDetail({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<QuotationStatus>('pending');
  const router = useRouter();

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        // El backend expone la búsqueda por id en /id/:id (la pública usa el código).
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/quotations/id/${params.id}`);
        if (!response.ok) throw new Error('Error al cargar la cotización');
        const data = await response.json();
        setQuotation(data);
        setStatus(data.status);
      } catch (error) {
        console.error('Error:', error);
        setError('No se pudo cargar la cotización');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [params.id]);

  const handleStatusChange = (newStatus: QuotationStatus) => {
    setStatus(newStatus);
  };

  const handleSaveChanges = async () => {
    if (!quotation) return;

    setSaving(true);
    try {
      // El backend solo permite actualizar el estado de la cotización.
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/quotations/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Error al guardar los cambios');

      alert('Cambios guardados exitosamente');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
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
        <div className="p-8">{error || 'No se encontró la cotización solicitada'}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-100">Cotización #{quotation.code}</h1>
            <p className="text-sm dark:text-gray-400">
              Creada el {new Date(quotation.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/quotations`}
              className="px-4 py-2 border dark:border-gray-700 rounded-md text-sm font-medium dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Volver
            </Link>
            <a
              href={`${API_CONFIG.API_BASE_URL}/api/quotations/${quotation.code}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border dark:border-gray-700 rounded-md text-sm font-medium dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Ver PDF
            </a>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <div className="dark:bg-gray-900 shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium dark:text-white">Información del Cliente</h3>
          </div>
          <div className="border-t dark:border-gray-700">
            <dl>
              <div className="dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Nombre</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_name}
                </dd>
              </div>
              <div className="dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Correo electrónico</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_email}
                </dd>
              </div>
              <div className="dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Teléfono</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_phone || 'No especificado'}
                </dd>
              </div>
              <div className="dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Empresa</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_company || 'No especificada'}
                </dd>
              </div>
              <div className="dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">RUC</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_ruc || 'No especificado'}
                </dd>
              </div>
              <div className="dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Dirección</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {quotation.client_address || 'No especificado'}
                </dd>
              </div>
              <div className="dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Estado</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="sent">Enviado</option>
                    <option value="accepted">Aceptado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="expired">Expirado</option>
                  </select>
                </dd>
              </div>
              <div className="dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium dark:text-gray-400">Válido hasta</dt>
                <dd className="mt-1 text-sm dark:text-white sm:mt-0 sm:col-span-2">
                  {new Date(quotation.valid_until).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="dark:bg-gray-900 shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium dark:text-white">Productos</h3>
          </div>
          <div className="border-t dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y dark:divide-gray-700">
                <thead className="dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="dark:bg-gray-900 divide-y dark:divide-gray-700">
                  {quotation.items.map((item) => (
                    <tr key={item.id} className="dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400">
                        {money(item.product_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">
                        {money(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="dark:bg-gray-800">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium dark:text-gray-400">
                      Subtotal
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium dark:text-white">
                      {money(quotation.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium dark:text-gray-400">
                      IGV (18%)
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium dark:text-white">
                      {money(quotation.igv)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold dark:text-white">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold dark:text-white">
                      {money(quotation.total)}
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
            className="px-4 py-2 border dark:border-gray-700 rounded-md text-sm font-medium dark:text-gray-300 dark:hover:bg-gray-800"
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
