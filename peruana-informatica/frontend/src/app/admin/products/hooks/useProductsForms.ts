"use client";

import React, { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import type { Product } from "../types";
import { isValidUrl } from "../utils";
import apiClient from "@/utils/api";

interface UseProductsFormsParams {
  reloadProducts: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error") => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProducts: number[];
  clearSelection: () => void;
}

export function useProductsForms({
  reloadProducts,
  showToast,
  setError,
  selectedProducts,
  clearSelection,
}: UseProductsFormsParams) {
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

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<number | undefined>(undefined);
  const [bulkSubcategories, setBulkSubcategories] = useState<number[]>([]);
  const [bulkSubcategoryOptions, setBulkSubcategoryOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingBulkSubcategories, setLoadingBulkSubcategories] = useState(false);
  const [bulkBrand, setBulkBrand] = useState<number | undefined>(undefined);
  const [bulkComponentType, setBulkComponentType] = useState<string | undefined>(undefined);
  const [bulkSocketType, setBulkSocketType] = useState<string | undefined>(undefined);
  const [bulkRamType, setBulkRamType] = useState<string | undefined>(undefined);
  const [bulkFormFactor, setBulkFormFactor] = useState<string | undefined>(undefined);
  const [applyingBulk, setApplyingBulk] = useState(false);

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

  // Cargar subcategorías para bulk update cuando cambia la categoría
  useEffect(() => {
    if (bulkCategory) {
      setLoadingBulkSubcategories(true);
      setBulkSubcategories([]); // Reset subcategories when category changes
      apiClient.request<{ subCategories?: Array<{ id: number; name: string }> }>(
        `/api/categories/${bulkCategory}`,
      )
        .then(data => {
          if (data && data.subCategories) {
            setBulkSubcategoryOptions(data.subCategories);
          } else {
            setBulkSubcategoryOptions([]);
          }
        })
        .catch(err => {
          console.error("Error fetching bulk subcategories:", err);
          setBulkSubcategoryOptions([]);
        })
        .finally(() => setLoadingBulkSubcategories(false));
    } else {
      setBulkSubcategoryOptions([]);
      setBulkSubcategories([]);
    }
  }, [bulkCategory]);

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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
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
    is_featured: false,
    is_new: false,
    is_clearance: false,
  });

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      description: "",
      // descripción completa no viene en lista; permitimos llenar manual si se desea cambiar
      price: Number(p.price),
      stock: p.stock,
      category_id: (p.productCategory as any)?.id,
      brand_id: (p.productBrand as any)?.id,
      image: "",
      keywords: "",
      seo_title: (p as any).seo_title || "",
      seo_description: (p as any).seo_description || "",
      is_featured: p.is_featured || false,
      is_new: p.is_new || false,
      is_clearance: p.is_clearance || false,
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowEditModal(false);
  };

  const onUpdate = async (id: number) => {
    setError(null);
    // Validaciones básicas
    if (!editForm.name || editForm.name.trim().length < 1) {
      setError('El nombre es requerido');
      return;
    }
    if (Number.isNaN(editForm.price) || editForm.price < 0) {
      setError('El precio debe ser mayor o igual a 0');
      return;
    }
    if (Number.isNaN(editForm.stock) || editForm.stock < 0) {
      setError('El stock debe ser mayor o igual a 0');
      return;
    }
    if (editForm.seo_title && editForm.seo_title.length > 160) {
      setError('Meta title no puede exceder 160 caracteres');
      return;
    }
    if (editForm.seo_description && editForm.seo_description.length > 300) {
      setError('Meta description no puede exceder 300 caracteres');
      return;
    }
    try {
      setUpdatingId(id);
      const payload: any = {
        name: editForm.name,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        is_featured: editForm.is_featured,
        is_new: editForm.is_new,
        is_clearance: editForm.is_clearance,
      };
      if (editForm.description) payload.description = editForm.description;
      if (editForm.category_id) payload.category_id = editForm.category_id;
      if (editForm.brand_id) payload.brand_id = editForm.brand_id;
      if (editForm.image) {
        if (!isValidUrl(editForm.image)) {
          setError('La URL de imagen no es válida');
          setUpdatingId(null);
          return;
        }
        payload.image = editForm.image;
      }
      if (editForm.keywords) payload.keywords = editForm.keywords;
      if (editForm.seo_title) payload.seo_title = editForm.seo_title;
      if (editForm.seo_description) payload.seo_description = editForm.seo_description;

      await apiClient.request(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: payload
      });
      setEditingId(null);
      setShowEditModal(false);
      await reloadProducts();
      showToast('Producto actualizado');
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar producto');
    } finally {
      setUpdatingId(null);
    }
  };

  const applyBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      showToast('No hay productos seleccionados', 'error');
      return;
    }
    if (!bulkCategory && !bulkBrand && bulkSubcategories.length === 0) {
      showToast('Selecciona categoría, subcategorías o marca para aplicar', 'error');
      return;
    }

    setApplyingBulk(true);
    try {
      const payload: any = { product_ids: selectedProducts };
      if (bulkCategory) payload.category_id = bulkCategory;
      if (bulkSubcategories.length > 0) payload.subcategory_ids = bulkSubcategories;
      if (bulkBrand) payload.brand_id = bulkBrand;
      if (bulkComponentType) payload.component_type = bulkComponentType;
      if (bulkSocketType) payload.socket_type = bulkSocketType;
      if (bulkRamType) payload.ram_type = bulkRamType;
      if (bulkFormFactor) payload.form_factor = bulkFormFactor;

      const json = await apiClient.request<{ updated?: number }>('/api/admin/products/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: payload
      });

      showToast(`${json.updated} producto(s) actualizado(s)`);
      clearSelection();
      setShowBulkPanel(false);
      setBulkCategory(undefined);
      setBulkSubcategories([]);
      setBulkSubcategoryOptions([]);
      setBulkBrand(undefined);
      setBulkComponentType(undefined);
      setBulkSocketType(undefined);
      setBulkRamType(undefined);
      setBulkFormFactor(undefined);
      await reloadProducts();
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar en bloque', 'error');
    } finally {
      setApplyingBulk(false);
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
    updatingId,
    editingId,
    editForm,
    setEditForm,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    showBulkPanel,
    setShowBulkPanel,
    bulkCategory,
    setBulkCategory,
    bulkSubcategories,
    setBulkSubcategories,
    bulkSubcategoryOptions,
    loadingBulkSubcategories,
    bulkBrand,
    setBulkBrand,
    bulkComponentType,
    setBulkComponentType,
    bulkSocketType,
    setBulkSocketType,
    bulkRamType,
    setBulkRamType,
    bulkFormFactor,
    setBulkFormFactor,
    applyingBulk,
    duplicateProduct,
    handleSearchCode,
    resetCreateModal,
    handleFileUpload,
    onCreate,
    startEdit,
    cancelEdit,
    onUpdate,
    applyBulkUpdate,
  };
}
