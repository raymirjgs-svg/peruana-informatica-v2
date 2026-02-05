'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductForm, ProductFormData } from '@/components/admin/products/ProductForm';
import { toast } from 'sonner';

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<ProductFormData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        const res = await fetch(`${getApiBase()}/admin/products/${productId}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Error al cargar producto');
        }

        const product = json.product || json;

        setInitialData({
          codigo_interno: product.codigo_interno || '',
          name: product.name || '',
          description: product.description || '',
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
          category_id: product.category_id || product.productCategory?.id,
          subcategory_ids: product.subcategory_ids || [],
          brand_id: product.brand_id || product.productBrand?.id,
          image: product.image || product.images?.[0]?.imagen || '',
          keywords: product.keywords || '',
          seo_title: product.seo_title || '',
          seo_description: product.seo_description || '',
          is_featured: product.is_featured || false,
          is_new: product.is_new || false,
          is_clearance: product.is_clearance || false,
        });
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar el producto');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleSubmit = async (data: ProductFormData & { additional_images?: string[] }) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        price: Number(data.price),
        stock: Number(data.stock),
        is_featured: data.is_featured,
        is_new: data.is_new,
        is_clearance: data.is_clearance,
      };

      if (data.description) payload.description = data.description;
      if (data.category_id) payload.category_id = data.category_id;
      if (data.brand_id) payload.brand_id = data.brand_id;
      if (data.image) payload.image = data.image;
      if (data.keywords) payload.keywords = data.keywords;
      if (data.seo_title) payload.seo_title = data.seo_title;
      if (data.seo_description) payload.seo_description = data.seo_description;
      if (data.subcategory_ids) payload.subcategory_ids = data.subcategory_ids;

      const res = await fetch(`${getApiBase()}/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || `Error ${res.status}`);
      }

      toast.success('Producto actualizado exitosamente');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <ProductForm
          initialData={initialData}
          productId={productId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEdit
        />
      </div>
    </AdminLayout>
  );
}
