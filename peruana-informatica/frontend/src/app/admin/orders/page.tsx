'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { API_CONFIG } from '@/config/api';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import { Order } from './types';
import { OrderCard } from '@/components/admin/orders/OrderCard';
import { InvoiceModal } from '@/components/admin/orders/InvoiceModal';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchOrders = async (targetPage: number = page) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/orders?page=${targetPage}&limit=${limit}`, {
        headers: getAdminAuthHeaders()
      });
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.orders ?? []);
      setOrders(list);
      if (data?.pagination) {
        setTotal(data.pagination.total ?? list.length);
        setTotalPages(data.pagination.totalPages ?? 1);
        setPage(data.pagination.page ?? targetPage);
      }
    } catch (error) {
      setError('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleVerifyPayment = async (orderId: number, verified: boolean) => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/payments/${orderId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({ verified, verified_by: 'Admin' })
      });

      if (response.ok) {
        alert(verified ? 'Pago verificado correctamente' : 'Pago rechazado');
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert('Error al verificar pago');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleUploadInvoice = async (orderId: number) => {
    if (!invoiceNumber) {
      alert('Ingrese el número de comprobante');
      return;
    }

    if (!invoiceFile) {
      alert('Debe seleccionar un archivo PDF');
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('invoice_file', invoiceFile);
      formData.append('invoice_number', invoiceNumber);

      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/payments/${orderId}/upload-invoice`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Comprobante cargado exitosamente');
        fetchOrders();
        setSelectedOrder(null);
        setInvoiceNumber('');
        setInvoiceFile(null);
      } else {
        alert(data.error || 'Error al cargar comprobante');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleDownloadInvoice = async (filename: string) => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/payments/invoices/${filename}`, {
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        alert('Error al descargar comprobante');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleViewProof = async (orderId: number) => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/admin/orders/${orderId}/payment-proof`, {
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        alert('Error al cargar comprobante');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert('Error de conexión');
    }
  };


  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Pedidos</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">Administra los pedidos de tus clientes</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-300">Cargando pedidos...</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                handleViewProof={handleViewProof}
                handleVerifyPayment={handleVerifyPayment}
                setSelectedOrder={setSelectedOrder}
                handleDownloadInvoice={handleDownloadInvoice}
              />
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay pedidos registrados
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => fetchOrders(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Página {page} de {totalPages} ({total} pedidos)
                </span>
                <button
                  onClick={() => fetchOrders(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}

        {selectedOrder && (
          <InvoiceModal
            selectedOrder={selectedOrder}
            invoiceNumber={invoiceNumber}
            invoiceFile={invoiceFile}
            isGeneratingInvoice={isGeneratingInvoice}
            handleUploadInvoice={handleUploadInvoice}
            setSelectedOrder={setSelectedOrder}
            setInvoiceNumber={setInvoiceNumber}
            setInvoiceFile={setInvoiceFile}
          />
        )}
      </div>
    </AdminLayout>
  );
}
