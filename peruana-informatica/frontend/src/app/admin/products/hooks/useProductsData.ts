"use client";

import React, { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import type { ProductsResponse } from "../types";
import { Product } from "../types";
import { getApiBase } from "../utils";

export function useProductsData() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const exportToCSV = () => {};
  const syncAllWithERP = () => {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
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

  const [search, setSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const [filterBrandId, setFilterBrandId] = useState<number | undefined>(undefined);
  const [filterStock, setFilterStock] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isValidUrl = (value: string) => {
    if (!value) return true;
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getProductImageUrl = (product: Product) => {
    if (!product.images || product.images.length === 0) return null;
    const img = product.images[0]?.imagen;
    if (!img) return null;
    if (img.startsWith("http")) return img;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api\/?$/, "");
    return `${baseUrl}/uploads/${encodeURIComponent(img)}`;
  };

  const reloadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      if (codeFilter.trim()) params.set('codigo', codeFilter.trim());
      if (filterCategoryId) params.set('category', String(filterCategoryId));
      if (filterBrandId) params.set('brand', String(filterBrandId));
      if (filterStock) params.set('stock_filter', filterStock);
      if (sortBy) params.set('sort', sortBy);
      if (sortOrder) params.set('order', sortOrder);
      const url = `${getApiBase()}/admin/products?${params.toString()}`;
      const res = await fetch(url, { headers: { ...getAdminAuthHeaders() } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setData(json as ProductsResponse);
    } catch (err: any) {
      setError(err?.message || "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setError(null);
      try {
        await reloadProducts();
        const [catRes, brandRes] = await Promise.all([
          fetch(`${getApiBase()}/admin/categories`, { headers: { ...getAdminAuthHeaders() } }),
          fetch(`${getApiBase()}/admin/brands`, { headers: { ...getAdminAuthHeaders() } })
        ]);
        const cats = await catRes.json().catch(() => []);
        const brs = await brandRes.json().catch(() => []);
        if (catRes.ok) setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        if (brandRes.ok) setBrands(brs.map((b: any) => ({ id: b.id, name: b.name })));
      } catch (err: any) {
        // ya se maneja en loaders individuales
      }
    };
    bootstrap();
  }, []);

  const applyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await reloadProducts();
  };

  const clearFilters = async () => {
    setSearch("");
    setCodeFilter("");
    setFilterCategoryId(undefined);
    setFilterBrandId(undefined);
    setFilterStock("");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
    await reloadProducts();
  };

  const goToPage = async (newPage: number) => {
    if (!data) return;
    const totalPages = data.totalPages || 1;
    const target = Math.min(Math.max(1, newPage), totalPages);
    if (target === page) return;
    setPage(target);
    await reloadProducts();
  };

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearchingCode(true);
    setSearchError(null);

    try {
      const res = await fetch(`${getApiBase()}/admin/products/erp-lookup/${searchCode.trim()}`, { headers: { ...getAdminAuthHeaders() } });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Error al buscar producto");

      if (json.found) {
        if (json.source === "db") {
          setSearchError("El producto ya existe en la base de datos");
        } else {
          setForm({
            codigo_interno: json.product.codigo,
            erp_name: json.product.nombre,
            name: json.product.nombre,
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
        setSearchError("Producto no encontrado en el ERP. Verifique el codigo.");
      }
    } catch (err: any) {
      setSearchError(err.message || "Error de conexion");
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
      subcategory_ids: [] as number[],
    });
  };

  useEffect(() => {
    if (form.category_id) {
      setLoadingSubcategories(true);
      fetch(`${getApiBase()}/categories/${form.category_id}`)
        .then(res => res.json())
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

  useEffect(() => {
    if (bulkCategory) {
      setLoadingBulkSubcategories(true);
      setBulkSubcategories([]);
      fetch(`${getApiBase()}/categories/${bulkCategory}`)
        .then(res => res.json())
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
      const res = await fetch(`${getApiBase()}/admin/upload`, {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.url;
      } else {
        throw new Error(data.error || 'Error al subir imagen');
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast(err.message || "Error al subir imagen", "error");
      return null;
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || form.name.trim().length < 1) {
      setError("El nombre es requerido");
      return;
    }
    if (!form.description || form.description.trim().length < 1) {
      setError("La descripcion es requerida");
      return;
    }
    if (Number.isNaN(form.price) || form.price < 0) {
      setError("El precio debe ser mayor o igual a 0");
      return;
    }
    if (Number.isNaN(form.stock) || form.stock < 0) {
      setError("El stock debe ser mayor o igual a 0");
      return;
    }
    if (form.seo_title && form.seo_title.length > 160) {
      setError("Meta title no puede exceder 160 caracteres");
      return;
    }
    if (form.seo_description && form.seo_description.length > 300) {
      setError("Meta description no puede exceder 300 caracteres");
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
        setError("La URL de imagen principal no es valida");
        setCreating(false);
        return;
      }

      for (const img of payload.additional_images) {
        if (!isValidUrl(img)) {
          setError(`URL de imagen adicional inválida: ${img}`);
          setCreating(false);
          return;
        }
      }

      const res = await fetch(`${getApiBase()}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      resetCreateModal();
      await reloadProducts();
      showToast("Producto creado");
    } catch (err: any) {
      setError(err?.message || "Error al crear producto");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setError(null);
    try {
      setDeletingId(id);
      const res = await fetch(`${getApiBase()}/admin/products/${id}`, { method: 'DELETE', headers: { ...getAdminAuthHeaders() } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      await reloadProducts();
      showToast("Producto eliminado");
    } catch (err: any) {
      setError(err?.message || "Error al eliminar producto");
    } finally {
      setDeletingId(null);
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
    if (!editForm.name || editForm.name.trim().length < 1) {
      setError("El nombre es requerido");
      return;
    }
    if (Number.isNaN(editForm.price) || editForm.price < 0) {
      setError("El precio debe ser mayor o igual a 0");
      return;
    }
    if (Number.isNaN(editForm.stock) || editForm.stock < 0) {
      setError("El stock debe ser mayor o igual a 0");
      return;
    }
    if (editForm.seo_title && editForm.seo_title.length > 160) {
      setError("Meta title no puede exceder 160 caracteres");
      return;
    }
    if (editForm.seo_description && editForm.seo_description.length > 300) {
      setError("Meta description no puede exceder 300 caracteres");
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
          setError("La URL de imagen no es valida");
          setUpdatingId(null);
          return;
        }
        payload.image = editForm.image;
      }
      if (editForm.keywords) payload.keywords = editForm.keywords;
      if (editForm.seo_title) payload.seo_title = editForm.seo_title;
      if (editForm.seo_description) payload.seo_description = editForm.seo_description;

      const res = await fetch(`${getApiBase()}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setEditingId(null);
      setShowEditModal(false);
      await reloadProducts();
      showToast("Producto actualizado");
    } catch (err: any) {
      setError(err?.message || "Error al actualizar producto");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/products/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { ...getAdminAuthHeaders() },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      await reloadProducts();
      showToast(json.message || "Estado actualizado");
    } catch (err: any) {
      showToast(err?.message || "Error al cambiar estado", "error");
    }
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!data) return;
    const allIds = data.products.map(p => p.id);
    if (selectedProducts.length === allIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allIds);
    }
  };

  const applyBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      showToast("No hay productos seleccionados", "error");
      return;
    }
    if (!bulkCategory && !bulkBrand && bulkSubcategories.length === 0) {
      showToast("Selecciona categoría, subcategorías o marca para aplicar", "error");
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

      const res = await fetch(`${getApiBase()}/admin/products/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      showToast(`${json.updated} producto(s) actualizado(s)`);
      setSelectedProducts([]);
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
      showToast(err?.message || "Error al actualizar en bloque", "error");
    } finally {
      setApplyingBulk(false);
    }
  };

  return {
    data,
    loading,
    error,
    setError,
    categories,
    brands,
    toast,
    showToast,
    search,
    setSearch,
    codeFilter,
    setCodeFilter,
    filterCategoryId,
    setFilterCategoryId,
    filterBrandId,
    setFilterBrandId,
    filterStock,
    setFilterStock,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    page,
    setPage,
    limit,
    setLimit,
    previewProduct,
    setPreviewProduct,
    syncingAll,
    reloadProducts,
    exportToCSV,
    syncAllWithERP,
    applyFilters,
    clearFilters,
    goToPage,
    onDelete,
    deletingId,
    toggleActive,
    selectedProducts,
    setSelectedProducts,
    toggleProductSelection,
    toggleSelectAll,
  };
}