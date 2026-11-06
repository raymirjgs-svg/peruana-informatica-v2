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

  const inp = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
  const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorías y Subcategorías</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Nueva Categoría
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar categorías o subcategorías..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de Categorías */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-gray-400 text-sm">No se encontraron categorías</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map(category => {
              const isExpanded = expandedCategories.has(category.id);
              const subcategories = category.subcategories || [];

              return (
                <div key={category.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Categoría Header */}
                  <div className="px-5 py-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center gap-3 flex-1 text-left group"
                    >
                      <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{category.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <code className="font-mono">{category.slug}</code>
                          <span>·</span>
                          <span>{subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}</span>
                          {category.appears_in_menu && <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded text-[10px] font-semibold">En menú</span>}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCreateSubcategory(category.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                      >
                        + Sub
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Subcategorías */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-4">
                      {subcategories.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-3">
                          No hay subcategorías.{' '}
                          <button onClick={() => handleCreateSubcategory(category.id)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            Crear una ahora
                          </button>
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {subcategories.map(subcategory => (
                            <div key={subcategory.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{subcategory.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5 font-mono flex items-center gap-2">
                                  {subcategory.slug}
                                  <span className="font-sans text-gray-300 dark:text-gray-600">·</span>
                                  Orden: {subcategory.order}
                                </p>
                                {subcategory.description && (
                                  <p className="text-xs text-gray-400 mt-1 truncate">{subcategory.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-4">
                                <button
                                  onClick={() => handleEditSubcategory(subcategory)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteSubcategory(subcategory.id)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-colors"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                </h2>
                <button onClick={closeCategoryModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitCategory} className="p-6 space-y-4">
                <div>
                  <label className={lbl}>Nombre *</label>
                  <input type="text" required className={inp} value={categoryForm.name}
                    onChange={(e) => { const name = e.target.value; setCategoryForm({ ...categoryForm, name, slug: editingCategory ? categoryForm.slug : generateSlug(name) }); }}
                    placeholder="Ej: Laptops" />
                </div>
                <div>
                  <label className={lbl}>Slug *</label>
                  <input type="text" required className={`${inp} font-mono`} value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="ej: laptops" />
                </div>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" id="appears_in_menu" className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                    checked={categoryForm.appears_in_menu} onChange={(e) => setCategoryForm({ ...categoryForm, appears_in_menu: e.target.checked })} />
                  <label htmlFor="appears_in_menu" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mostrar en menú de navegación</label>
                </div>
                <div>
                  <label className={lbl}>Título SEO</label>
                  <input type="text" maxLength={160} className={inp} value={categoryForm.seo_title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, seo_title: e.target.value })} placeholder="Título para motores de búsqueda" />
                </div>
                <div>
                  <label className={lbl}>Descripción SEO</label>
                  <textarea maxLength={300} rows={3} className={`${inp} resize-none`} value={categoryForm.seo_description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, seo_description: e.target.value })} placeholder="Descripción para motores de búsqueda" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeCategoryModal}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95">
                    {editingCategory ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Subcategoría */}
        {showSubcategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingSubcategory ? "Editar Subcategoría" : "Nueva Subcategoría"}
                </h2>
                <button onClick={closeSubcategoryModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitSubcategory} className="p-6 space-y-4">
                <div>
                  <label className={lbl}>Nombre *</label>
                  <input type="text" required className={inp} value={subcategoryForm.name}
                    onChange={(e) => { const name = e.target.value; setSubcategoryForm({ ...subcategoryForm, name, slug: editingSubcategory ? subcategoryForm.slug : generateSlug(name) }); }}
                    placeholder="Ej: Socket AM5" />
                </div>
                <div>
                  <label className={lbl}>Slug *</label>
                  <input type="text" required className={`${inp} font-mono`} value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })} placeholder="ej: socket-am5" />
                </div>
                <div>
                  <label className={lbl}>Categoría *</label>
                  <select required className={inp} value={subcategoryForm.category_id}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: parseInt(e.target.value) })}>
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Descripción</label>
                  <textarea rows={2} className={`${inp} resize-none`} value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })} placeholder="Descripción opcional" />
                </div>
                <div>
                  <label className={lbl}>Orden</label>
                  <input type="number" min="0" className={inp} value={subcategoryForm.order}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, order: parseInt(e.target.value) || 0 })} />
                  <p className="text-xs text-gray-400 mt-1">Orden de aparición (menor = primero)</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeSubcategoryModal}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95">
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
