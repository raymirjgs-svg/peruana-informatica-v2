'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft, Upload, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

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
  video_url: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export type ProductSpec = { key: string; value: string };

// --- Alibaba Video Extractor ---
function AlbabaVideoExtractor({ onExtracted, getApiBase }: { onExtracted: (url: string) => void; getApiBase: () => string }) {
  const [show, setShow] = useState(false);
  const [aliUrl, setAliUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ videos: string[]; recommended: string } | null>(null);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    if (!aliUrl.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`${getApiBase()}/admin/upload/extract-video?url=${encodeURIComponent(aliUrl.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.found) {
        setError(json.message || json.error || 'No se encontró video en esa página.');
      } else {
        setResult(json);
      }
    } catch {
      setError('Error de conexión al intentar extraer el video.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)}
        className="text-xs text-blue-600 hover:text-blue-800 underline">
        ¿Video de Alibaba / AliExpress? Extraer enlace automáticamente
      </button>
    );
  }

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg space-y-2">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Pega la URL de la página del producto de Alibaba o AliExpress:</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={aliUrl}
          onChange={e => setAliUrl(e.target.value)}
          placeholder="https://www.alibaba.com/product-detail/..."
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <button type="button" onClick={handleExtract} disabled={loading || !aliUrl.trim()}
          className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
          {loading ? '...' : 'Extraer'}
        </button>
        <button type="button" onClick={() => { setShow(false); setAliUrl(''); setResult(null); setError(''); }}
          className="px-2 py-1.5 text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {result && (
        <div className="space-y-1">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">Videos encontrados — haz clic para usar:</p>
          {result.videos.map((v, i) => (
            <button key={i} type="button"
              onClick={() => { onExtracted(v); setShow(false); setResult(null); setAliUrl(''); toast.success('URL de video aplicada'); }}
              className="block w-full text-left text-xs px-2 py-1.5 rounded bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 truncate">
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductFormProps {
  initialData?: ProductFormData;
  initialGalleryImages?: string[];
  initialSpecifications?: ProductSpec[];
  productId?: number;
  onSubmit: (data: ProductFormData & { additional_images?: string[]; specifications?: ProductSpec[] }) => Promise<void>;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function ProductForm({ initialData, initialGalleryImages, initialSpecifications, productId, onSubmit, isSubmitting, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [specs, setSpecs] = useState<ProductSpec[]>(initialSpecifications || []);

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

  // Load categories and brands on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${getApiBase()}/categories`),
          fetch(`${getApiBase()}/brands`)
        ]);
        const catsRes = await catRes.json().catch(() => []);
        const brsRes = await brandRes.json().catch(() => []);
        const cats = Array.isArray(catsRes) ? catsRes : (catsRes.data || []);
        const brs = Array.isArray(brsRes) ? brsRes : (brsRes.data || []);
        if (catRes.ok) setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        if (brandRes.ok) setBrands(brs.map((b: any) => ({ id: b.id, name: b.name })));

        // Reset form AFTER options are in the DOM so selects can find their matching option
        if (initialData) {
          reset(initialData);
          const main = initialData.image ? [initialData.image] : [];
          const gallery = initialGalleryImages || [];
          setAllImages([...main, ...gallery.filter(u => u && u !== initialData.image)]);
          if (initialSpecifications && initialSpecifications.length > 0) {
            setSpecs(initialSpecifications);
          }
        }
      } catch (err) {
        console.error('Error loading categories/brands:', err);
      }
    };
    loadData();
  }, [initialData]);

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

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImage(true);
      const newUrls: string[] = [];
      for (const file of Array.from(e.target.files)) {
        const url = await handleFileUpload(file);
        if (url) newUrls.push(url);
      }
      setAllImages(prev => [...prev, ...newUrls]);
      setUploadingImage(false);
    }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const imgs = [...allImages];
    const [moved] = imgs.splice(dragIdx, 1);
    if (!moved) return;
    imgs.splice(idx, 0, moved);
    setAllImages(imgs);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      ...data,
      image: allImages[0] || '',
      additional_images: allImages.slice(1).filter(u => u.trim() !== ''),
      specifications: specs.filter(s => s.key.trim() !== '')
    });
  };

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const removeSpec = (idx: number) => setSpecs(prev => prev.filter((_, i) => i !== idx));
  const updateSpec = (idx: number, field: 'key' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const parseBulkSpecs = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: ProductSpec[] = [];
    for (const line of lines) {
      // Split by tab or 3+ spaces
      const match = line.match(/^(.+?)\t+(.+)$/) || line.match(/^(.+?)\s{3,}(.+)$/);
      if (match && match[1] && match[2]) {
        parsed.push({ key: match[1].trim(), value: match[2].trim() });
      } else if (parsed.length > 0) {
        // Continuation line — append to previous value
        const last = parsed[parsed.length - 1];
        if (last) last.value = last.value ? last.value + ' / ' + line : line;
      } else {
        parsed.push({ key: line, value: '' });
      }
    }
    setSpecs(prev => [...prev, ...parsed]);
    setBulkText('');
    setShowBulkImport(false);
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
                    Código Interno {isEdit ? '(ERP)' : '(opcional)'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register('codigo_interno')}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder={isEdit ? 'Código ERP (ej: 20230)' : 'SKU-001'}
                    />
                    {isEdit && (
                      <button
                        type="button"
                        onClick={async () => {
                          const code = watch('codigo_interno')?.trim();
                          if (!code) { toast.error('Ingresa un código ERP primero'); return; }
                          setSearchingCode(true);
                          try {
                            const res = await fetch(`${getApiBase()}/admin/products/erp-lookup/${code}`);
                            const json = await res.json();
                            if (json.found && json.source === 'erp') {
                              setValue('price', json.product.precio);
                              setValue('stock', json.product.stock);
                              toast.success(`ERP: S/. ${json.product.precio} — Stock: ${json.product.stock}`);
                            } else if (json.found && json.source === 'db') {
                              toast.error('Ese código ya pertenece a otro producto');
                            } else {
                              toast.error('Código no encontrado en el ERP');
                            }
                          } catch { toast.error('Error al conectar con el ERP'); }
                          finally { setSearchingCode(false); }
                        }}
                        disabled={searchingCode}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
                      >
                        {searchingCode ? '⏳' : '🔄 Sync ERP'}
                      </button>
                    )}
                  </div>
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
                <RichTextEditor
                  value={watch('description') || ''}
                  onChange={(html) => setValue('description', html, { shouldValidate: true })}
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
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Imágenes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Arrastra para reordenar. La primera imagen es la principal.</p>

            {/* Drag-and-drop grid */}
            {allImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {allImages.map((url, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-lg border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                      dragIdx === idx ? 'opacity-50 scale-95' : 'opacity-100'
                    } ${idx === 0 ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                      <img
                        src={url}
                        alt={`Imagen ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/no-image.svg'; }}
                      />
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Principal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setAllImages(allImages.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add image URL */}
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                placeholder="https://... agregar URL de imagen"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) { setAllImages(prev => [...prev, val]); (e.target as HTMLInputElement).value = ''; }
                  }
                }}
              />
              <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors whitespace-nowrap">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir
              </label>
            </div>
            <p className="text-xs text-gray-400">Pega una URL y presiona Enter, o sube archivos directamente.</p>
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

          {/* Video */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Video del Producto</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL del Video
                </label>
                <input
                  {...register('video_url')}
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... o https://cdn.ejemplo.com/video.mp4"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Soportado: <strong>YouTube</strong>, <strong>Vimeo</strong>, <strong>Bilibili</strong>, enlace directo <strong>.mp4</strong>
                </p>
              </div>

              {/* Extractor de video de Alibaba/AliExpress */}
              <AlbabaVideoExtractor onExtracted={(url) => setValue('video_url', url)} getApiBase={getApiBase} />
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Especificaciones Técnicas</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aparecen en la pestaña "Especificaciones" del producto.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Importar en lote
                </button>
                <button
                  type="button"
                  onClick={addSpec}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {showBulkImport && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 font-medium">
                  Pega el texto con especificaciones. Cada línea debe tener el formato: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">NOMBRE    VALOR</code> (separado por tab o varios espacios).
                </p>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                  placeholder={"TIPO    IMPRESORA MULTIFUNCIONAL TINTA\nMARCA    EPSON\nMODELO    ECOTANK L4360\n..."}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={parseBulkSpecs}
                    disabled={!bulkText.trim()}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Importar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowBulkImport(false); setBulkText(''); }}
                    className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {specs.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sin especificaciones. Haz clic en "Agregar" para añadir.</p>
            ) : (
              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={e => updateSpec(idx, 'key', e.target.value)}
                      placeholder="Nombre (ej: Procesador)"
                      className="w-40 flex-none px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={e => updateSpec(idx, 'value', e.target.value)}
                      placeholder="Valor (ej: Intel Core i7-12700H)"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(idx)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
