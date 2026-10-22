"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import apiClient from '@/utils/api';
import { TaxonomyLoading } from './components/TaxonomyLoading';
import { TaxonomyFilters } from './components/TaxonomyFilters';
import { BulkAssignmentPanel } from './components/BulkAssignmentPanel';
import { ProductTable } from './components/ProductTable';
import { AssignTaxonomyModal } from './components/AssignTaxonomyModal';
import type { Brand, Category, TaxonomyForm, BulkTaxonomyForm } from './components/types';

const productService = new ProductService();

export default function TaxonomyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Formulario de asignación individual
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<TaxonomyForm>({
    brandName: '',
    categoryName: '',
    subCategoryNames: [] as string[]
  });

  // Formulario de asignación masiva
  const [bulkFormData, setBulkFormData] = useState<BulkTaxonomyForm>({
    productIds: [] as number[],
    brandName: '',
    categoryName: '',
    subCategoryNames: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products using the service which normalizes data
      const productsData = await productService.getAllProducts();
      setProducts(productsData);

      // Extract unique brands and categories from products directly since we know they are there now
      // This is a safer fallback if the dedicated endpoints fail or are empty
      const uniqueBrands = Array.from(new Set(productsData.map(p => p.brand).filter(Boolean))).sort();
      const uniqueCategories = Array.from(new Set(productsData.map(p => p.category).filter(Boolean))).sort();

      setBrands(uniqueBrands.map((name, i) => ({ id: i, name: name as string })));
      setCategories(uniqueCategories.map((name, i) => ({ id: i, name: name as string })));

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTaxonomy = async (productId: number, codigoInterno?: string) => {
    try {
      setAssigning(true);
      const result = await apiClient.request<{ success: boolean; message?: string }>('/api/admin/taxonomy/assign', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
        body: {
          productId: codigoInterno ? undefined : productId,
          codigoInterno: codigoInterno,
          brandName: formData.brandName || undefined,
          categoryName: formData.categoryName || undefined,
          subCategoryNames: formData.subCategoryNames.length > 0 ? formData.subCategoryNames : undefined
        }
      });

      if (result.success) {
        toast.success('Taxonomía asignada exitosamente');
        setSelectedProduct(null);
        setFormData({ brandName: '', categoryName: '', subCategoryNames: [] });
        loadData();
      } else {
        toast.error(result.message || 'Error al asignar taxonomía');
      }
    } catch (error) {
      toast.error('Error al asignar taxonomía');
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkAssign = async () => {
    if (bulkFormData.productIds.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    try {
      setAssigning(true);
      const result = await apiClient.request<{ success: boolean; message?: string; data?: { count?: number } }>('/api/admin/taxonomy/bulk-assign', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
        body: {
          productIds: bulkFormData.productIds,
          brandName: bulkFormData.brandName || undefined,
          categoryName: bulkFormData.categoryName || undefined,
          subCategoryNames: bulkFormData.subCategoryNames.length > 0 ? bulkFormData.subCategoryNames : undefined
        }
      });

      if (result.success) {
        toast.success(`Taxonomía asignada a ${result.data?.count || bulkFormData.productIds.length} productos`);
        setBulkFormData({ productIds: [], brandName: '', categoryName: '', subCategoryNames: [] });
        loadData();
      } else {
        toast.error(result.message || 'Error al asignar taxonomía');
      }
    } catch (error) {
      toast.error('Error al asignar taxonomía');
    } finally {
      setAssigning(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const name = (product.name || '').toLowerCase();
    const code = (product.codigo_interno || String(product.id) || '').toLowerCase();
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
    const matchesBrand = !selectedBrand || product.brand === selectedBrand;
    const matchesCategory = !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setBulkFormData({ ...bulkFormData, productIds: filteredProducts.map(p => p.id) });
    } else {
      setBulkFormData({ ...bulkFormData, productIds: [] });
    }
  };

  const handleToggleProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setBulkFormData({ ...bulkFormData, productIds: [...bulkFormData.productIds, productId] });
    } else {
      setBulkFormData({ ...bulkFormData, productIds: bulkFormData.productIds.filter(id => id !== productId) });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      brandName: product.brand || '',
      categoryName: product.category || '',
      subCategoryNames: []
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <TaxonomyLoading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asignar Taxonomía</h1>
          <p className="text-gray-600">Asigna marcas, categorías y subcategorías a los productos</p>
        </div>

        <TaxonomyFilters
          searchTerm={searchTerm}
          selectedBrand={selectedBrand}
          selectedCategory={selectedCategory}
          brands={brands}
          categories={categories}
          onSearchChange={setSearchTerm}
          onBrandChange={setSelectedBrand}
          onCategoryChange={setSelectedCategory}
        />

        <BulkAssignmentPanel
          bulkFormData={bulkFormData}
          onChange={setBulkFormData}
          onAssign={handleBulkAssign}
          assigning={assigning}
        />

        <ProductTable
          products={filteredProducts}
          selectedIds={bulkFormData.productIds}
          onToggleAll={handleToggleAll}
          onToggleProduct={handleToggleProduct}
          onAssign={handleSelectProduct}
        />

        {selectedProduct && (
          <AssignTaxonomyModal
            product={selectedProduct}
            formData={formData}
            onChange={setFormData}
            onCancel={() => {
              setSelectedProduct(null);
              setFormData({ brandName: '', categoryName: '', subCategoryNames: [] });
            }}
            onAssign={() => handleAssignTaxonomy(selectedProduct.id, selectedProduct.codigo_interno)}
            assigning={assigning}
          />
        )}
      </div>
    </AdminLayout>
  );
}
