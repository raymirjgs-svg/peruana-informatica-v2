'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft, Upload, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ProductImageManager } from './ProductImageManager';

function getApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const productSchema = z.object({
  codigo_interno: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  category_id: z.number().optional(),
  subcategory_ids: z.array(z.number()).optional(),
  brand_id: z.number().optional(),
  image: z.string().optional(),
  keywords: z.string().optional(),
  seo_title: z.string().max(160, 'Máximo 160 caracteres').optional(),
  seo_description: z.string().max(300, 'Máximo 300 caracteres').optional(),
  is_featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_clearance: z.boolean().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: number;
  onSubmit: (data: ProductFormData & { additional_images?: string[] }) => Promise<void>;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function ProductForm({ initialData, productId, onSubmit, isSubmitting, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ERP Search state (only for create mode)
  const [showErpSearch, setShowErpSearch] = useState(!isEdit);
  const [searchCode, setSearchCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [erpData, setErpData] = useState<{ codigo: string; nombre: string; precio: number; stock: number } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      subcategory_ids: [],
      is_featured: false,
      is_new: false,
      is_clearance: false,
    }
  });

  const categoryId = watch('category_id');
  const selectedSubcategories = watch('subcategory_ids') || [];
  const mainImage = watch('image');

  // Load categories and brands on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${getApiBase()}/admin/categories`),
          fetch(`${getApiBase()}/admin/brands`)
        ]);
        const cats = await catRes.json().catch(() => []);
        const brs = await brandRes.json().catch(() => []);
        if (catRes.ok) setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        if (brandRes.ok) setBrands(brs.map((b: any) => ({ id: b.id, name: b.name })));
      } catch (err) {
        console.error('Error loading categories/brands:', err);
      }
    };
    loadData();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      setLoadingSubcategories(true);
      fetch(`${getApiBase()}/categories/${categoryId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.subCategories) {
            setSubcategories(data.subCategories);
          } else {
            setSubcategories([]);
          }
        })
        .catch(() => setSubcategories([]))
        .finally(() => setLoadingSubcategories(false));
    } else {
      setSubcategories([]);
    }
  }, [categoryId]);

  const handleSearchERP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearchingCode(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/products/erp-lookup/${searchCode.trim()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Error al buscar producto');

      if (json.found) {
        if (json.source === 'db') {
          toast.error('El producto ya existe en la base de datos');
        } else {
          setErpData(json.product);
          setValue('codigo_interno', json.product.codigo);
          setValue('name', json.product.nombre);
          setValue('price', json.product.precio);
          setValue('stock', json.product.stock);
          setShowErpSearch(false);
          toast.success('Datos cargados desde ERP');
        }
      } else {
        toast.error('Producto no encontrado en el ERP');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setSearchingCode(false);
    }
  };

  const handleSkipERP = () => {
    setShowErpSearch(false);
    setErpData(null);
  };

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
      toast.error(err.message || 'Error al subir imagen');
      return null;
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingImage(true);
      const url = await handleFileUpload(e.target.files[0]);
      setUploadingImage(false);
      if (url) setValue('image', url);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImage(true);
      const newUrls: string[] = [];
      const files = Array.from(e.target.files);
      for (const file of files) {
        const url = await handleFileUpload(file);
        if (url) newUrls.push(url);
      }
      setAdditionalImages([...additionalImages, ...newUrls]);
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      ...data,
      additional_images: additionalImages.filter(url => url.trim() !== '')
    });
  };

  const toggleSubcategory = (id: number) => {
    const current = selectedSubcategories || [];
    const newIds = current.includes(id)
      ? current.filter(sid => sid !== id)
      : [...current, id];
    setValue('subcategory_ids', newIds);
  };

  // Show ERP search step for create mode
  if (showErpSearch && !isEdit) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Producto</h1>
            <p className="text-sm text-gray-500">Busca en el ERP o crea manualmente</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
          <form onSubmit={handleSearchERP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código Interno del Producto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: 20363"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searchingCode || !searchCode.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchingCode ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  Buscar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                El sistema buscará el producto en el sistema de ventas para cargar sus datos automáticamente.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">o</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipERP}
              className="w-full py-3 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Crear producto manualmente sin código ERP
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Modifica los datos del producto' : 'Completa la información del producto'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERP Info Banner */}
      {erpData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Código ERP</span>
              <span className="font-mono font-bold text-gray-800 dark:text-white">{erpData.codigo}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Nombre ERP</span>
              <span className="font-mono font-bold text-gray-800 dark:text-white">{erpData.nombre}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Precio (ERP)</span>
              <span className="font-mono font-bold text-gray-800 dark:text-white">S/. {erpData.precio}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Stock (ERP)</span>
              <span className="font-mono font-bold text-gray-800 dark:text-white">{erpData.stock}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Información Básica</h3>

            <div className="space-y-4">
              {!erpData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código Interno (opcional)
                  </label>
                  <input
                    {...register('codigo_interno')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="SKU-001"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Nombre visible en la tienda"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Descripción detallada del producto..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    readOnly={!!erpData}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all read-only:bg-gray-100 dark:read-only:bg-gray-700"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    readOnly={!!erpData}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all read-only:bg-gray-100 dark:read-only:bg-gray-700"
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Imágenes</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagen Principal
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('image')}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMainImageUpload}
                    />
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Subir
                  </label>
                </div>
                {mainImage && (
                  <div className="mt-2">
                    <img
                      src={mainImage.startsWith('http') ? mainImage : `/uploads/${mainImage}`}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-lg border"
                      onError={(e) => (e.target as HTMLImageElement).src = '/images/no-image.svg'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imágenes Adicionales
                </label>
                <div className="space-y-2">
                  {additionalImages.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => {
                          const newImages = [...additionalImages];
                          newImages[idx] = e.target.value;
                          setAdditionalImages(newImages);
                        }}
                      />
                      {url && (
                        <img src={url} alt="" className="h-8 w-8 object-cover rounded border" />
                      )}
                      <button
                        type="button"
                        onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdditionalImages([...additionalImages, ''])}
                      className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      + Agregar URL
                    </button>
                    <label className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAdditionalImagesUpload}
                      />
                      {uploadingImage ? 'Subiendo...' : '+ Subir archivos'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Manager for edit mode */}
              {isEdit && productId && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ProductImageManager productId={productId} />
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">SEO</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keywords
                </label>
                <input
                  {...register('keywords')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="palabra1, palabra2, palabra3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Title (máx. 160 caracteres)
                </label>
                <input
                  {...register('seo_title')}
                  maxLength={160}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                {errors.seo_title && <p className="text-red-500 text-xs mt-1">{errors.seo_title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Description (máx. 300 caracteres)
                </label>
                <textarea
                  {...register('seo_description')}
                  maxLength={300}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                {errors.seo_description && <p className="text-red-500 text-xs mt-1">{errors.seo_description.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category & Brand */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Categorización</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  {...register('category_id', { valueAsNumber: true })}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    setValue('category_id', value);
                    setValue('subcategory_ids', []);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">-- Seleccionar --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {categoryId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subcategorías
                  </label>
                  {loadingSubcategories ? (
                    <div className="text-sm text-gray-500">Cargando...</div>
                  ) : subcategories.length > 0 ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                      {subcategories.map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.includes(sub.id)}
                            onChange={() => toggleSubcategory(sub.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {sub.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">Sin subcategorías</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marca
                </label>
                <select
                  {...register('brand_id', { valueAsNumber: true })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">-- Seleccionar --</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Flags (edit mode only) */}
          {isEdit && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Etiquetas</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ⭐ Producto Destacado
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('is_new')}
                    className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🆕 Producto Nuevo
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('is_clearance')}
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🔥 En Remate
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
