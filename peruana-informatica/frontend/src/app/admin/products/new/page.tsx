'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductForm, ProductFormData } from '@/components/admin/products/ProductForm';
import { toast } from 'sonner';

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData & { additional_images?: string[] }) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        codigo_interno: data.codigo_interno,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        image: data.image || undefined,
        keywords: data.keywords || undefined,
        seo_title: data.seo_title || undefined,
        seo_description: data.seo_description || undefined,
        subcategory_ids: data.subcategory_ids || [],
        additional_images: data.additional_images || []
      };

      if (data.category_id) payload.category_id = data.category_id;
      if (data.brand_id) payload.brand_id = data.brand_id;

      const res = await fetch(`${getApiBase()}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || `Error ${res.status}`);
      }

      toast.success('Producto creado exitosamente');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  );
}
