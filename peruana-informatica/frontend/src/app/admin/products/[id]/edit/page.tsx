'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductForm, ProductFormData, ProductSpec } from '@/components/admin/products/ProductForm';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/adminApi';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<ProductFormData | undefined>(undefined);
  const [initialGalleryImages, setInitialGalleryImages] = useState<string[]>([]);
  const [initialSpecifications, setInitialSpecifications] = useState<ProductSpec[]>([]);
  const [existingGalleryIds, setExistingGalleryIds] = useState<Array<{id: number, url: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        const res = await adminFetch(`/admin/products/${productId}`);
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
          image: product.image || '',
          keywords: product.keywords || '',
          seo_title: product.seo_title || '',
          seo_description: product.seo_description || '',
          is_featured: product.is_featured || false,
          is_new: product.is_new || false,
          is_clearance: product.is_clearance || false,
          video_url: product.video_url || '',
        });

        // Load specifications
        if (Array.isArray(product.specifications)) {
          setInitialSpecifications(product.specifications);
        }

        // Store existing gallery images for sync on save
        const gallery: Array<{id: number, url: string}> = (product.images || [])
          .filter((img: any) => img.imagen)
          .map((img: any) => ({ id: img.cod_galeria, url: img.imagen }));
        setExistingGalleryIds(gallery);
        setInitialGalleryImages(gallery.map(g => g.url));
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar el producto');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleSubmit = async (data: ProductFormData & { additional_images?: string[]; specifications?: ProductSpec[] }) => {
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

      if (data.codigo_interno) payload.codigo_interno = data.codigo_interno;
      if (data.description) payload.description = data.description;
      if (data.category_id) payload.category_id = data.category_id;
      if (data.brand_id) payload.brand_id = data.brand_id;
      payload.image = data.image || '';
      if (data.keywords) payload.keywords = data.keywords;
      if (data.seo_title) payload.seo_title = data.seo_title;
      if (data.seo_description) payload.seo_description = data.seo_description;
      if (data.subcategory_ids) payload.subcategory_ids = data.subcategory_ids;
      payload.video_url = data.video_url || null;
      payload.specifications = data.specifications || [];

      const res = await adminFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);

      // Sync gallery images: delete removed, add new
      const newGalleryUrls = data.additional_images || [];
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

      // Delete existing gallery images not in new list
      for (const existing of existingGalleryIds) {
        if (!newGalleryUrls.includes(existing.url)) {
          await fetch(`${apiBase}/api/admin/images/${existing.id}`, { method: 'DELETE', headers }).catch(() => {});
        }
      }
      // Add new gallery images not in existing list
      const existingUrls = existingGalleryIds.map(g => g.url);
      for (const url of newGalleryUrls) {
        if (!existingUrls.includes(url)) {
          await fetch(`${apiBase}/api/admin/images/product/${productId}`, { method: 'POST', headers, body: JSON.stringify({ imagen: url }) }).catch(() => {});
        }
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
          initialGalleryImages={initialGalleryImages}
          initialSpecifications={initialSpecifications}
          productId={productId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEdit
        />
      </div>
    </AdminLayout>
  );
}
