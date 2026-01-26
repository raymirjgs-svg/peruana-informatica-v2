"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Category {
  id: number;
  name: string;
  slug: string;
  appears_in_menu: boolean;
  seo_title?: string;
  seo_description?: string;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  order: number;
  description?: string;
  is_active: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export default function TaxonomyManagePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<SubCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    appears_in_menu: true,
    seo_title: "",
    seo_description: "",
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    slug: "",
    category_id: 0,
    order: 0,
    description: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/admin/taxonomy/categories');
      setCategories(response as Category[]);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  // ========== CATEGORÍAS ==========

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      appears_in_menu: true,
      seo_title: "",
      seo_description: "",
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      appears_in_menu: category.appears_in_menu,
      seo_title: category.seo_title || "",
      seo_description: category.seo_description || "",
    });
    setShowCategoryModal(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiClient.put(`/api/admin/taxonomy/categories/${editingCategory.id}`, categoryForm);
        toast.success("Categoría actualizada");
      } else {
        await apiClient.post('/api/admin/taxonomy/categories', categoryForm);
        toast.success("Categoría creada");
      }
      loadCategories();
      closeCategoryModal();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Error al guardar categoría");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    try {
      await apiClient.delete(`/api/admin/taxonomy/categories/${id}`);
      toast.success("Categoría eliminada");
      loadCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Error al eliminar categoría");
    }
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  // ========== SUBCATEGORÍAS ==========

  const handleCreateSubcategory = (categoryId: number) => {
    setEditingSubcategory(null);
    setSubcategoryForm({
      name: "",
      slug: "",
      category_id: categoryId,
      order: 0,
      description: "",
    });
    setShowSubcategoryModal(true);
  };

  const handleEditSubcategory = (subcategory: SubCategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      slug: subcategory.slug,
      category_id: subcategory.category_id,
      order: subcategory.order,
      description: subcategory.description || "",
    });
    setShowSubcategoryModal(true);
  };

  const handleSubmitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubcategory) {
        await apiClient.put(`/api/admin/taxonomy/subcategories/${editingSubcategory.id}`, subcategoryForm);
        toast.success("Subcategoría actualizada");
      } else {
        await apiClient.post('/api/admin/taxonomy/subcategories', subcategoryForm);
        toast.success("Subcategoría creada");
      }
      loadCategories();
      closeSubcategoryModal();
    } catch (error: any) {
      console.error("Error saving subcategory:", error);
      toast.error(error.message || "Error al guardar subcategoría");
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta subcategoría?")) return;
    try {
      await apiClient.delete(`/api/admin/taxonomy/subcategories/${id}`);
      toast.success("Subcategoría eliminada");
      loadCategories();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Error al eliminar subcategoría");
    }
  };

  const closeSubcategoryModal = () => {
    setShowSubcategoryModal(false);
    setEditingSubcategory(null);
  };

  // ========== UTILIDADES ==========

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.subcategories?.some(sub =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías y Subcategorías</h1>
            <p className="text-sm text-gray-500 mt-1">
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-medium"
          >
            <span className="text-xl">+</span>
            Nueva Categoría
          </button>
        </div>

        {/* Búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <input
            type="text"
            placeholder="Buscar categorías o subcategorías..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de Categorías */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No se encontraron categorías</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map(category => {
              const isExpanded = expandedCategories.has(category.id);
              const subcategories = category.subcategories || [];

              return (
                <div key={category.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  {/* Categoría Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                      >
                        <span className={`transition-transform text-blue-600 ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
                          <p className="text-sm text-gray-600">
                            <code className="bg-blue-100 px-2 py-0.5 rounded">{category.slug}</code>
                            {" • "}
                            {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateSubcategory(category.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <span>+</span>
                          Subcategoría
                        </button>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subcategorías */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50">
                      {subcategories.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          No hay subcategorías.
                          <button
                            onClick={() => handleCreateSubcategory(category.id)}
                            className="text-blue-600 hover:underline ml-1"
                          >
                            Crear una ahora
                          </button>
                        </p>
                      ) : (
                        <div className="grid gap-3">
                          {subcategories.map(subcategory => (
                            <div
                              key={subcategory.id}
                              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow border border-gray-200"
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Slug: <code className="bg-gray-200 px-2 py-0.5 rounded">{subcategory.slug}</code>
                                  {" • "}Orden: {subcategory.order}
                                </p>
                                {subcategory.description && (
                                  <p className="text-sm text-gray-600 mt-1">{subcategory.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSubcategory(subcategory)}
                                  className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteSubcategory(subcategory.id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Categoría */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={categoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm({
                        ...categoryForm,
                        name,
                        slug: editingCategory ? categoryForm.slug : generateSlug(name)
                      });
                    }}
                    placeholder="Ej: Laptops"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="ej: laptops"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="appears_in_menu"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    checked={categoryForm.appears_in_menu}
                    onChange={(e) => setCategoryForm({ ...categoryForm, appears_in_menu: e.target.checked })}
                  />
                  <label htmlFor="appears_in_menu" className="text-sm font-medium text-gray-700">
                    Mostrar en menú
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título SEO
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={categoryForm.seo_title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, seo_title: e.target.value })}
                    placeholder="Título para motores de búsqueda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción SEO
                  </label>
                  <textarea
                    maxLength={300}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={categoryForm.seo_description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, seo_description: e.target.value })}
                    placeholder="Descripción para motores de búsqueda"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingCategory ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Subcategoría */}
        {showSubcategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingSubcategory ? "Editar Subcategoría" : "Nueva Subcategoría"}
              </h2>
              <form onSubmit={handleSubmitSubcategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={subcategoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSubcategoryForm({
                        ...subcategoryForm,
                        name,
                        slug: editingSubcategory ? subcategoryForm.slug : generateSlug(name)
                      });
                    }}
                    placeholder="Ej: Socket AM5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                    placeholder="ej: socket-am5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={subcategoryForm.category_id}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: parseInt(e.target.value) })}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    placeholder="Descripción opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={subcategoryForm.order}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Orden de aparición (menor = primero)</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeSubcategoryModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingSubcategory ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
