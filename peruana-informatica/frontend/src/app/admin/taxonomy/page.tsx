"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

const productService = new ProductService();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TaxonomyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Formulario de asignación individual
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    categoryName: '',
    subCategoryNames: [] as string[]
  });

  // Formulario de asignación masiva
  const [bulkFormData, setBulkFormData] = useState({
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
      // Remove /api if present to avoid double slash if API_URL has it
      const base = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

      const response = await fetch(`${base}/api/taxonomy/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: codigoInterno ? undefined : productId,
          codigoInterno: codigoInterno,
          brandName: formData.brandName || undefined,
          categoryName: formData.categoryName || undefined,
          subCategoryNames: formData.subCategoryNames.length > 0 ? formData.subCategoryNames : undefined
        })
      });

      const result = await response.json();

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
      // Remove /api if present to avoid double slash if API_URL has it
      const base = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

      const response = await fetch(`${base}/api/taxonomy/bulk-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: bulkFormData.productIds,
          brandName: bulkFormData.brandName || undefined,
          categoryName: bulkFormData.categoryName || undefined,
          subCategoryNames: bulkFormData.subCategoryNames.length > 0 ? bulkFormData.subCategoryNames : undefined
        })
      });

      const result = await response.json();

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asignar Taxonomía</h1>
          <p className="text-gray-600">Asigna marcas, categorías y subcategorías a los productos</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o código..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las marcas</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.name}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Asignación Masiva */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Asignación Masiva</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={bulkFormData.brandName}
                onChange={(e) => setBulkFormData({ ...bulkFormData, brandName: e.target.value })}
                placeholder="Nombre de la marca..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={bulkFormData.categoryName}
                onChange={(e) => setBulkFormData({ ...bulkFormData, categoryName: e.target.value })}
                placeholder="Nombre de la categoría..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías (separadas por comas)</label>
              <input
                type="text"
                value={bulkFormData.subCategoryNames.join(', ')}
                onChange={(e) => setBulkFormData({
                  ...bulkFormData,
                  subCategoryNames: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
                placeholder="Subcategoría 1, Subcategoría 2..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleBulkAssign}
            disabled={assigning || bulkFormData.productIds.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Asignando...' : `Asignar a ${bulkFormData.productIds.length} productos seleccionados`}
          </button>
        </div>

        {/* Lista de Productos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Productos ({filteredProducts.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => bulkFormData.productIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkFormData({ ...bulkFormData, productIds: filteredProducts.map(p => p.id) });
                        } else {
                          setBulkFormData({ ...bulkFormData, productIds: [] });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={bulkFormData.productIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkFormData({ ...bulkFormData, productIds: [...bulkFormData.productIds, product.id] });
                          } else {
                            setBulkFormData({ ...bulkFormData, productIds: bulkFormData.productIds.filter(id => id !== product.id) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.codigo_interno || product.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.brand || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setFormData({
                            brandName: product.brand || '',
                            categoryName: product.category || '',
                            subCategoryNames: []
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Asignación Individual */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Asignar Taxonomía: {selectedProduct.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Nombre de la marca..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    placeholder="Nombre de la categoría..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategorías (separadas por comas)</label>
                  <input
                    type="text"
                    value={formData.subCategoryNames.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      subCategoryNames: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="Subcategoría 1, Subcategoría 2..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setFormData({ brandName: '', categoryName: '', subCategoryNames: [] });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAssignTaxonomy(selectedProduct.id, selectedProduct.codigo_interno)}
                  disabled={assigning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? 'Asignando...' : 'Asignar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
