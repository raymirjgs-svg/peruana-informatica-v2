"use client";

import React, { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import type { Product } from "../types";
import { isValidUrl } from "../utils";
import apiClient from "@/utils/api";
import type { UseProductsFormsParams } from "./types";

type CreateFormDeps = Pick<UseProductsFormsParams, "reloadProducts" | "showToast" | "setError">;

export function useProductCreateForm({
  reloadProducts,
  showToast,
  setError,
}: CreateFormDeps) {
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [form, setForm] = useState({
    codigo_interno: "",
    erp_name: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category_id: undefined as number | undefined,
    brand_id: undefined as number | undefined,
    image: "",
    keywords: "",
    seo_title: "",
    seo_description: "",
    subcategory_ids: [] as number[],
  });
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [createStep, setCreateStep] = useState<'search' | 'form'>('search');
  const [searchCode, setSearchCode] = useState("");
  const [searchingCode, setSearchingCode] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const duplicateProduct = (product: Product) => {
    setForm({
      codigo_interno: '',
      erp_name: '',
      name: product.name + ' (Copia)',
      description: (product as any).description || '',
      price: Number(product.price),
      stock: 0,
      category_id: product.productCategory?.id,
      brand_id: product.productBrand?.id,
      image: '',
      keywords: '',
      seo_title: '',
      seo_description: '',
      subcategory_ids: [],
    });
    setCreateStep('form');
    setShowCreateModal(true);
  };

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearchingCode(true);
    setSearchError(null);

    try {
      const json = await apiClient.request<{
        found: boolean;
        source: 'db' | 'erp';
        product: { codigo: string; nombre: string; precio: number; stock: number };
      }>(`/api/admin/products/erp-lookup/${searchCode.trim()}`, { headers: { ...getAdminAuthHeaders() } });

      if (json.found) {
        if (json.source === 'db') {
          setSearchError('El producto ya existe en la base de datos');
        } else {
          // Encontrado en ERP, pasar al formulario
          setForm({
            codigo_interno: json.product.codigo,
            erp_name: json.product.nombre,
            name: json.product.nombre, // Default Web Name = ERP Name
            description: "",
            price: json.product.precio,
            stock: json.product.stock,
            category_id: undefined,
            brand_id: undefined,
            image: "",
            keywords: "",
            seo_title: "",
            seo_description: "",
            subcategory_ids: []
          });
          setAdditionalImages([]);
          setSubcategories([]);
          setCreateStep('form');
        }
      } else {
        setSearchError('Producto no encontrado en el ERP. Verifique el código.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error de conexión');
    } finally {
      setSearchingCode(false);
    }
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep('search');
    setSearchCode("");
    setSearchError(null);
    setAdditionalImages([]);
    setSubcategories([]);
    setForm({
      codigo_interno: "",
      erp_name: "",
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: undefined,
      brand_id: undefined,
      image: "",
      keywords: "",
      seo_title: "",
      seo_description: "",
      subcategory_ids: [],
    });
  };

  useEffect(() => {
    if (form.category_id) {
      setLoadingSubcategories(true);
      apiClient.request<{ subCategories?: Array<{ id: number; name: string }> }>(
        `/api/categories/${form.category_id}`,
      )
        .then(data => {
          if (data && data.subCategories) {
            setSubcategories(data.subCategories);
          } else {
            setSubcategories([]);
          }
        })
        .catch(err => {
          console.error("Error fetching subcategories:", err);
          setSubcategories([]);
        })
        .finally(() => setLoadingSubcategories(false));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const data = await apiClient.request<{ success?: boolean; url?: string; error?: string }>(
        '/api/admin/upload',
        {
          method: 'POST',
          headers: { ...getAdminAuthHeaders() },
          body: formData
        }
      );
      if (data.success && data.url) {
        return data.url;
      } else {
        throw new Error(data.error || 'Error al subir imagen');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(err.message || 'Error al subir imagen', 'error');
      return null;
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validaciones
    if (!form.name || form.name.trim().length < 1) {
      setError('El nombre es requerido');
      return;
    }
    if (!form.description || form.description.trim().length < 1) {
      setError('La descripción es requerida');
      return;
    }
    if (Number.isNaN(form.price) || form.price < 0) {
      setError('El precio debe ser mayor o igual a 0');
      return;
    }
    if (Number.isNaN(form.stock) || form.stock < 0) {
      setError('El stock debe ser mayor o igual a 0');
      return;
    }
    if (form.seo_title && form.seo_title.length > 160) {
      setError('Meta title no puede exceder 160 caracteres');
      return;
    }
    if (form.seo_description && form.seo_description.length > 300) {
      setError('Meta description no puede exceder 300 caracteres');
      return;
    }
    try {
      setCreating(true);
      const payload: any = {
        codigo_interno: form.codigo_interno,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image || undefined,
        keywords: form.keywords || undefined,
        seo_title: form.seo_title || undefined,
        seo_description: form.seo_description || undefined,
        subcategory_ids: form.subcategory_ids,
        additional_images: additionalImages.filter(url => url.trim() !== "")
      };
      if (form.category_id) payload.category_id = form.category_id;
      if (form.brand_id) payload.brand_id = form.brand_id;

      if (!isValidUrl(form.image)) {
        setError('La URL de imagen principal no es válida');
        setCreating(false);
        return;
      }

      // Validar imágenes adicionales
      for (const img of payload.additional_images) {
        if (!isValidUrl(img)) {
          setError(`URL de imagen adicional inválida: ${img}`);
          setCreating(false);
          return;
        }
      }

      await apiClient.request('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: payload
      });

      resetCreateModal();
      await reloadProducts();
      showToast('Producto creado');
    } catch (err: any) {
      setError(err?.message || 'Error al crear producto');
    } finally {
      setCreating(false);
    }
  };

  return {
    subcategories,
    loadingSubcategories,
    form,
    setForm,
    additionalImages,
    setAdditionalImages,
    uploadingImage,
    setUploadingImage,
    createStep,
    setCreateStep,
    searchCode,
    setSearchCode,
    searchingCode,
    searchError,
    creating,
    showCreateModal,
    setShowCreateModal,
    duplicateProduct,
    handleSearchCode,
    resetCreateModal,
    handleFileUpload,
    onCreate,
  };
}
