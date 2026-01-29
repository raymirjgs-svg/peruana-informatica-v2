"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import { ProductImageManager } from '@/components/admin/products/ProductImageManager';

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

type Brand = { id: number; name: string; slug: string } | null;
type Category = { id: number; name: string; slug: string } | null;

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  is_active?: boolean;
  productBrand?: Brand;
  productCategory?: Category;
  images?: { cod_galeria: number; imagen: string }[];
  is_featured?: boolean;
  is_new?: boolean;
  is_clearance?: boolean;
};

type ProductsResponse = {
  products: Product[];
  total: number;
  totalPages: number;
};

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
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

  // Filtros y paginación (movidos antes de reloadProducts)
  const [search, setSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const [filterBrandId, setFilterBrandId] = useState<number | undefined>(undefined);
  const [filterStock, setFilterStock] = useState<string>(""); // "all", "low", "out", "available"
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
      // allow absolute URLs only for now
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
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
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      setData(json as ProductsResponse);
    } catch (err: any) {
      setError(err?.message || "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  // Obtener URL de imagen del producto
  const getProductImageUrl = (product: Product) => {
    if (!product.images || product.images.length === 0) return null;
    const img = product.images[0].imagen;
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');
    return `${baseUrl}/uploads/${encodeURIComponent(img)}`;
  };

  // Exportar a CSV
  const exportToCSV = () => {
    if (!data || data.products.length === 0) return;
    const headers = ['ID', 'Código', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Marca', 'Estado'];
    const rows = data.products.map(p => [
      p.id,
      (p as any).codigo_interno || '',
      p.name,
      Number(p.price).toFixed(2),
      p.stock,
      p.productCategory?.name || '',
      p.productBrand?.name || '',
      p.is_active ? 'Activo' : 'Inactivo'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Duplicar producto
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

  // Sincronizar todos los productos con ERP
  const syncAllWithERP = async () => {
    if (!confirm('¿Sincronizar precios y stock de TODOS los productos con el ERP? Esto puede tomar varios minutos.')) return;
    setSyncingAll(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/products/sync-all`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al sincronizar');
      showToast(`Sincronización completada: ${json.updated || 0} productos actualizados`, 'success');
      await reloadProducts();
    } catch (err: any) {
      showToast(err.message || 'Error al sincronizar', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  // Toggle ordenamiento
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setError(null);
      try {
        await reloadProducts();
        // Cargar categorías y marcas desde admin
        const [catRes, brandRes] = await Promise.all([
          fetch(`${getApiBase()}/admin/categories`),
          fetch(`${getApiBase()}/admin/brands`)
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
      const res = await fetch(`${getApiBase()}/admin/products/erp-lookup/${searchCode.trim()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Error al buscar producto');

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

  // Fetch subcategories when category changes
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

  // Cargar subcategorías para bulk update cuando cambia la categoría
  useEffect(() => {
    if (bulkCategory) {
      setLoadingBulkSubcategories(true);
      setBulkSubcategories([]); // Reset subcategories when category changes
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
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
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

      const res = await fetch(`${getApiBase()}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);

      resetCreateModal();
      await reloadProducts();
      showToast('Producto creado');
    } catch (err: any) {
      setError(err?.message || 'Error al crear producto');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setError(null);
    try {
      setDeletingId(id);
      const res = await fetch(`${getApiBase()}/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      await reloadProducts();
      showToast('Producto eliminado');
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar producto');
    } finally {
      setDeletingId(null);
    }
  };

  // Edición en línea
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

      const res = await fetch(`${getApiBase()}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
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

  const toggleActive = async (id: number) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/products/${id}/toggle-active`, {
        method: 'PATCH',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      await reloadProducts();
      showToast(json.message || 'Estado actualizado');
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  // Función para seleccionar/deseleccionar un producto
  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Seleccionar/deseleccionar todos los productos visibles
  const toggleSelectAll = () => {
    if (!data) return;
    const allIds = data.products.map(p => p.id);
    if (selectedProducts.length === allIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allIds);
    }
  };

  // Aplicar cambios en bloque
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

      const res = await fetch(`${getApiBase()}/admin/products/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      showToast(err?.message || 'Error al actualizar en bloque', 'error');
    } finally {
      setApplyingBulk(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} flex items-center gap-2`}>
            <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toast.message}</span>
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
            <p className="text-gray-500 mt-1">Gestiona tu inventario completo {data && `(${data.total} productos)`}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportToCSV} disabled={!data || data.products.length === 0}>
              📥 Exportar CSV
            </Button>
            <Button variant="secondary" onClick={syncAllWithERP} disabled={syncingAll}>
              {syncingAll ? '⏳ Sincronizando...' : '🔄 Sync ERP'}
            </Button>
            <Button onClick={() => { resetCreateModal(); setShowCreateModal(true); }} size="lg">
              <span className="text-xl">+</span>
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <form onSubmit={applyFilters} className="mb-4 border rounded-lg p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Código interno" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select className="w-full border rounded px-3 py-2" value={filterCategoryId ?? ''} onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">-- Todas --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select className="w-full border rounded px-3 py-2" value={filterBrandId ?? ''} onChange={(e) => setFilterBrandId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">-- Todas --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <select className="w-full border rounded px-3 py-2" value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                <option value="">-- Todos --</option>
                <option value="available">✓ Disponible (&gt;0)</option>
                <option value="low">⚠ Bajo (&lt;=10)</option>
                <option value="out">✕ Agotado (0)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
                🔍 Buscar
              </button>
              <button type="button" onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={loading}>
                Limpiar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Vista:</span>
              <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`} title="Lista">
                ☰
              </button>
              <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`} title="Cuadrícula">
                ⊞
              </button>
            </div>
          </div>
        </form>

        {/* Barra de acciones en bloque */}
        {data && data.products.length > 0 && (
          <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedProducts.length === data.products.length && data.products.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedProducts.length > 0
                  ? `${selectedProducts.length} producto(s) seleccionado(s)`
                  : 'Seleccionar todos'}
              </span>
            </div>
            {selectedProducts.length > 0 && (
              <Button onClick={() => setShowBulkPanel(true)} size="sm">
                Acciones en Bloque
              </Button>
            )}
          </div>
        )}

        {/* Panel de Acciones en Bloque */}
        <Modal isOpen={showBulkPanel} onClose={() => setShowBulkPanel(false)} title="Actualización en Bloque" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aplicar cambios a <span className="font-bold text-blue-600">{selectedProducts.length}</span> producto(s) seleccionado(s)
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkCategory ?? ''}
                onChange={(e) => setBulkCategory(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Sin cambios --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Subcategorías - solo visible cuando hay categoría seleccionada */}
            {bulkCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategorías
                  {bulkSubcategories.length > 0 && (
                    <span className="ml-2 text-blue-600">({bulkSubcategories.length} seleccionadas)</span>
                  )}
                </label>
                {loadingBulkSubcategories ? (
                  <div className="text-sm text-gray-500 py-2">Cargando subcategorías...</div>
                ) : bulkSubcategoryOptions.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {bulkSubcategoryOptions.map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={bulkSubcategories.includes(sub.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...bulkSubcategories, sub.id]
                                : bulkSubcategories.filter(id => id !== sub.id);
                              setBulkSubcategories(newIds);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                    {bulkSubcategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBulkSubcategories([])}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-2 italic">No hay subcategorías para esta categoría</div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkBrand ?? ''}
                onChange={(e) => setBulkBrand(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Sin cambios --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Componente (Cotizador)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkComponentType ?? ''}
                onChange={(e) => setBulkComponentType(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="motherboard">Placa Madre</option>
                <option value="processor">Procesador</option>
                <option value="ram">Memoria RAM</option>
                <option value="storage">Almacenamiento</option>
                <option value="gpu">Tarjeta de Video</option>
                <option value="case">Gabinete (Case)</option>
                <option value="power_supply">Fuente de Poder</option>
                <option value="monitor">Monitor</option>
                <option value="keyboard">Teclado</option>
                <option value="mouse">Mouse</option>
                <option value="headset">Audífonos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Socket Type</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: LGA1700, AM5, AM4"
                value={bulkSocketType ?? ''}
                onChange={(e) => setBulkSocketType(e.target.value || undefined)}
              />
              <p className="text-xs text-gray-500 mt-1">Para placas madre y procesadores</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RAM Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkRamType ?? ''}
                onChange={(e) => setBulkRamType(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR5">DDR5</option>
                <option value="DDR3">DDR3</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Para placas madre y memorias RAM</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Factor</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bulkFormFactor ?? ''}
                onChange={(e) => setBulkFormFactor(e.target.value || undefined)}
              >
                <option value="">-- Sin cambios --</option>
                <option value="ATX">ATX</option>
                <option value="M-ATX">Micro-ATX (M-ATX)</option>
                <option value="Mini-ITX">Mini-ITX</option>
                <option value="E-ATX">E-ATX</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Para placas madre y gabinetes</p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowBulkPanel(false)}>
                Cancelar
              </Button>
              <Button onClick={applyBulkUpdate} isLoading={applyingBulk}>
                Aplicar a {selectedProducts.length} producto(s)
              </Button>
            </div>
          </div>

        </Modal>

        {loading && <p className="text-center py-8 text-gray-500">Cargando productos...</p>}

        {error && <p className="text-red-600" role="alert">{error}</p>}

        {data && (
          <>
            {data.products.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white rounded-xl border">No hay productos para mostrar</div>
            )}

            {/* Vista Lista */}
            {viewMode === 'list' && data.products.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {data.products.map((p) => {
                  const imgUrl = getProductImageUrl(p);
                  return (
                    <div key={`product-${p.slug}-${p.id}`} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        {/* Miniatura */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <div className="font-semibold text-gray-800 text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">{(p as any).codigo_interno || p.slug}</div>
                      </div>
                      <div className="text-sm font-medium">S/. {Number(p.price).toLocaleString()}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.is_active ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{p.productCategory?.name || '-'}</div>
                      <div className="text-xs text-gray-600 truncate">{p.productBrand?.name || '-'}</div>
                      <div className="md:col-span-3 flex gap-1 justify-end flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => setPreviewProduct(p)} title="Vista previa">👁</Button>
                        <Button size="sm" variant="secondary" onClick={() => duplicateProduct(p)} title="Duplicar">📋</Button>
                        <Button size="sm" variant={p.is_active ? "secondary" : "success"} onClick={() => toggleActive(p.id)} title={p.is_active ? 'Desactivar' : 'Activar'}>
                          {p.is_active ? '🔒' : '✓'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>✏️</Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete(p.id)} isLoading={deletingId === p.id}>🗑️</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista Cuadrícula */}
            {viewMode === 'grid' && data.products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.products.map((p) => {
                  const imgUrl = getProductImageUrl(p);
                  return (
                    <div key={`product-grid-${p.id}`} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="absolute top-2 left-2 w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer z-10"
                        />
                        <div className="aspect-square bg-gray-100">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>
                          )}
                        </div>
                        <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${p.stock > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {p.stock}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm text-gray-800 line-clamp-2 h-10">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{(p as any).codigo_interno || '-'}</div>
                        <div className="text-lg font-bold text-blue-600 mt-2">S/. {Number(p.price).toLocaleString()}</div>
                        <div className="flex gap-1 mt-3">
                          <Button size="sm" variant="secondary" onClick={() => setPreviewProduct(p)} className="flex-1">👁</Button>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(p)} className="flex-1">✏️</Button>
                          <Button size="sm" variant="danger" onClick={() => onDelete(p.id)} isLoading={deletingId === p.id}>🗑️</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal Vista Previa */}
        <Modal isOpen={!!previewProduct} onClose={() => setPreviewProduct(null)} title="Vista Previa del Producto" size="lg">
          {previewProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {getProductImageUrl(previewProduct) ? (
                  <img src={getProductImageUrl(previewProduct)!} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">📦</div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{previewProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Código:</span> <span className="font-medium">{(previewProduct as any).codigo_interno || '-'}</span></div>
                  <div><span className="text-gray-500">Precio:</span> <span className="font-bold text-blue-600">S/. {Number(previewProduct.price).toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Stock:</span> <span className={`font-medium ${previewProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{previewProduct.stock}</span></div>
                  <div><span className="text-gray-500">Estado:</span> <span className={previewProduct.is_active ? 'text-green-600' : 'text-gray-500'}>{previewProduct.is_active ? 'Activo' : 'Inactivo'}</span></div>
                  <div><span className="text-gray-500">Categoría:</span> <span className="font-medium">{previewProduct.productCategory?.name || '-'}</span></div>
                  <div><span className="text-gray-500">Marca:</span> <span className="font-medium">{previewProduct.productBrand?.name || '-'}</span></div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => { startEdit(previewProduct); setPreviewProduct(null); }}>✏️ Editar</Button>
                  <Button variant="secondary" onClick={() => { duplicateProduct(previewProduct); setPreviewProduct(null); }}>📋 Duplicar</Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Crear Producto */}
        <Modal isOpen={showCreateModal} onClose={resetCreateModal} title="Crear Nuevo Producto" size="lg">
          {createStep === 'search' ? (
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ingrese Código Interno del Producto</label>
                <form onSubmit={handleSearchCode}>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 20363"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" isLoading={searchingCode}>Buscar</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">El sistema buscará el producto en el sistema de ventas para cargar sus datos.</p>
                </form>

                <div className="mt-4 pt-4 border-t flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, codigo_interno: '', erp_name: '' }));
                      setCreateStep('form');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    O crear manualmente sin código ERP
                  </button>
                </div>

                {searchError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {searchError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={onCreate} className="space-y-4">
              {/* Info del ERP si viene de búsqueda */}
              {form.codigo_interno && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Código Interno</span>
                      <span className="font-mono font-bold text-gray-800">{form.codigo_interno}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Nombre ERP</span>
                      <span className="font-mono font-bold text-gray-800">{form.erp_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Precio (ERP)</span>
                      <span className="font-mono font-bold text-gray-800">S/. {form.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Stock (ERP)</span>
                      <span className="font-mono font-bold text-gray-800">{form.stock}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso si es creación manual */}
              {!form.codigo_interno && (
                <div className="bg-amber-50 p-4 rounded-lg mb-4 border border-amber-200">
                  <p className="text-amber-800 text-sm">
                    <strong>📝 Modo Manual:</strong> Ingresa todos los datos del producto. Puedes agregar un código interno opcional para referencia.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código interno (editable solo en modo manual) */}
                {!form.erp_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno (opcional)</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: SKU-001"
                      value={form.codigo_interno}
                      onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    />
                  </div>
                )}

                <div className={form.erp_name ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <p className="text-xs text-gray-500 mt-1">Nombre visible en la tienda online</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>

                {/* Precio y Stock - editables si es manual, readonly si viene del ERP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    readOnly={!!form.erp_name}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    readOnly={!!form.erp_name}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined, subcategory_ids: [] })}>
                    <option value="">-- Seleccionar --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {form.category_id && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías</label>
                    {loadingSubcategories ? (
                      <div className="text-sm text-gray-500">Cargando subcategorías...</div>
                    ) : subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-lg max-h-40 overflow-y-auto">
                        {subcategories.map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={form.subcategory_ids.includes(sub.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...form.subcategory_ids, sub.id]
                                  : form.subcategory_ids.filter(id => id !== sub.id);
                                setForm({ ...form, subcategory_ids: newIds });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {sub.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No hay subcategorías disponibles</div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.brand_id ?? ''} onChange={(e) => setForm({ ...form, brand_id: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- Seleccionar --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen Principal</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadingImage(true);
                            const url = await handleFileUpload(e.target.files[0]);
                            setUploadingImage(false);
                            if (url) setForm({ ...form, image: url });
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" isLoading={uploadingImage}>📂 Subir</Button>
                    </div>
                  </div>
                  {form.image && (
                    <div className="mt-2">
                      <img src={form.image} alt="Preview" className="h-20 w-20 object-cover rounded border" onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Error'} />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes Adicionales</label>
                  <div className="space-y-2">
                    {additionalImages.map((url, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => {
                            const newImages = [...additionalImages];
                            newImages[idx] = e.target.value;
                            setAdditionalImages(newImages);
                          }}
                        />
                        {url && <img src={url} alt="Mini" className="h-8 w-8 object-cover rounded border" />}
                        <Button type="button" variant="danger" size="sm" onClick={() => {
                          const newImages = additionalImages.filter((_, i) => i !== idx);
                          setAdditionalImages(newImages);
                        }}>🗑️</Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setAdditionalImages([...additionalImages, ""])}>
                        + Agregar URL
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setUploadingImage(true);
                              const newUrls = [];
                              for (let i = 0; i < e.target.files.length; i++) {
                                const url = await handleFileUpload(e.target.files[i]);
                                if (url) newUrls.push(url);
                              }
                              setAdditionalImages([...additionalImages, ...newUrls]);
                              setUploadingImage(false);
                            }
                          }}
                        />
                        <Button type="button" variant="secondary" size="sm" isLoading={uploadingImage}>📂 Subir Archivos</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="separa por comas" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (≤160)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={160} value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta description (≤300)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={300} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                </div>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setCreateStep('search')}>Atrás</Button>
                <Button type="submit" isLoading={creating}>Crear Producto</Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal Editar Producto */}
        <Modal isOpen={showEditModal} onClose={cancelEdit} title="Editar Producto" size="lg">
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) onUpdate(editingId); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Opcional" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.category_id ?? ''} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">-- Categoría --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={editForm.brand_id ?? ''} onChange={(e) => setEditForm({ ...editForm, brand_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">-- Marca --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://..." value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (≤160)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={160} value={editForm.seo_title} onChange={(e) => setEditForm({ ...editForm, seo_title: e.target.value })} />
              </div>
              <div>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={300} value={editForm.seo_description} onChange={(e) => setEditForm({ ...editForm, seo_description: e.target.value })} />
              </div>
            </div>

            {/* Flags de Producto */}
            <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg border mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-700">⭐ Destacado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_new}
                  onChange={e => setEditForm({ ...editForm, is_new: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span className="font-medium text-gray-700">🆕 Nuevo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_clearance}
                  onChange={e => setEditForm({ ...editForm, is_clearance: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <span className="font-medium text-gray-700">🔥 Remate</span>
              </label>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {/* Product Image Manager */}
            {editingId && (
              <div className="mt-6">
                <ProductImageManager productId={editingId} />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar</Button>
              <Button type="submit" isLoading={updatingId !== null}>Guardar Cambios</Button>
            </div>
          </form>
        </Modal>

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Total: {data.total} • Página {page} de {data.totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded disabled:opacity-60" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>Anterior</button>
              <select className="px-2 py-1 border rounded" value={page} onChange={(e) => goToPage(Number(e.target.value))}>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button className="px-3 py-1 border rounded disabled:opacity-60" disabled={page >= data.totalPages || loading} onClick={() => goToPage(page + 1)}>Siguiente</button>
              <select className="px-2 py-1 border rounded" value={limit} onChange={async (e) => { setLimit(Number(e.target.value)); setPage(1); await reloadProducts(); }}>
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/página</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </AdminLayout >
  );
}
