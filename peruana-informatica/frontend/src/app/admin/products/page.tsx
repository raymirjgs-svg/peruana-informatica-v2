"use client";

import React from "react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProductsData } from './hooks/useProductsData';
import { useProductsForms } from './hooks/useProductsForms';
import { Toast } from './components/Toast';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsFilters } from './components/ProductsFilters';
import { BulkActionsBar } from './components/BulkActionsBar';
import { BulkEditModal } from './components/BulkEditModal';
import { ProductListView } from './components/ProductListView';
import { ProductGridView } from './components/ProductGridView';
import { PreviewProductModal } from './components/PreviewProductModal';
import { CreateProductModal } from './components/CreateProductModal';
import { EditProductModal } from './components/EditProductModal';
import { ProductsPagination } from './components/ProductsPagination';

export default function AdminProductsPage() {
  const controller = useProductsData();
  const forms = useProductsForms({
    reloadProducts: controller.reloadProducts,
    showToast: controller.showToast,
    setError: controller.setError,
    selectedProducts: controller.selectedProducts,
    clearSelection: () => controller.setSelectedProducts([]),
  });
  const { data, loading, error, viewMode } = controller;

  const openCreate = () => {
    forms.resetCreateModal();
    forms.setShowCreateModal(true);
  };

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <Toast toast={controller.toast} />

        <ProductsHeader controller={controller} onNew={openCreate} />

        <ProductsFilters controller={controller} />

        {data && data.products.length > 0 && (
          <BulkActionsBar controller={controller} onOpenBulk={() => forms.setShowBulkPanel(true)} />
        )}

        <BulkEditModal controller={controller} forms={forms} />

        {loading && <p className="text-center py-8 text-gray-500">Cargando productos...</p>}

        {error && <p className="text-red-600" role="alert">{error}</p>}

        {data && (
          <>
            {data.products.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white rounded-xl border">No hay productos para mostrar</div>
            )}

            {viewMode === "list" && data.products.length > 0 && (
              <ProductListView controller={controller} forms={forms} />
            )}

            {viewMode === "grid" && data.products.length > 0 && (
              <ProductGridView controller={controller} forms={forms} />
            )}
          </>
        )}

        <PreviewProductModal controller={controller} forms={forms} />

        <CreateProductModal controller={controller} forms={forms} />

        <EditProductModal controller={controller} forms={forms} />

        {data && data.totalPages > 1 && <ProductsPagination controller={controller} />}
      </div>
    </AdminLayout >
  );
}
