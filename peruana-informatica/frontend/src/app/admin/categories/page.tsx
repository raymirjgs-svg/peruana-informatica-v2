"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoryHeader } from "./components/CategoryHeader";
import { CategoryList } from "./components/CategoryList";
import { CategoryModal } from "./components/CategoryModal";
import { SubcategoryModal } from "./components/SubcategoryModal";
import type { Category, SubCategory } from "./components/types";

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

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCategoryForm({
      ...categoryForm,
      name,
      slug: editingCategory ? categoryForm.slug : generateSlug(name)
    });
  };

  const handleCategorySlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryForm({ ...categoryForm, slug: e.target.value });
  };

  const handleCategoryAppearsInMenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryForm({ ...categoryForm, appears_in_menu: e.target.checked });
  };

  const handleCategorySeoTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryForm({ ...categoryForm, seo_title: e.target.value });
  };

  const handleCategorySeoDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCategoryForm({ ...categoryForm, seo_description: e.target.value });
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

  const handleSubcategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSubcategoryForm({
      ...subcategoryForm,
      name,
      slug: editingSubcategory ? subcategoryForm.slug : generateSlug(name)
    });
  };

  const handleSubcategorySlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubcategoryForm({ ...subcategoryForm, slug: e.target.value });
  };

  const handleSubcategoryCategoryIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubcategoryForm({ ...subcategoryForm, category_id: parseInt(e.target.value) });
  };

  const handleSubcategoryDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubcategoryForm({ ...subcategoryForm, description: e.target.value });
  };

  const handleSubcategoryOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubcategoryForm({ ...subcategoryForm, order: parseInt(e.target.value) || 0 });
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
        <CategoryHeader
          categoriesCount={categories.length}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onCreateCategory={handleCreateCategory}
        />

        <CategoryList
          loading={loading}
          filteredCategories={filteredCategories}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          onCreateSubcategory={handleCreateSubcategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onEditSubcategory={handleEditSubcategory}
          onDeleteSubcategory={handleDeleteSubcategory}
        />

        {/* Modal de Categoría */}
        {showCategoryModal && (
          <CategoryModal
            editingCategory={editingCategory}
            form={categoryForm}
            onSubmit={handleSubmitCategory}
            onClose={closeCategoryModal}
            onNameChange={handleCategoryNameChange}
            onSlugChange={handleCategorySlugChange}
            onAppearsInMenuChange={handleCategoryAppearsInMenuChange}
            onSeoTitleChange={handleCategorySeoTitleChange}
            onSeoDescriptionChange={handleCategorySeoDescriptionChange}
          />
        )}

        {/* Modal de Subcategoría */}
        {showSubcategoryModal && (
          <SubcategoryModal
            editingSubcategory={editingSubcategory}
            form={subcategoryForm}
            categories={categories}
            onSubmit={handleSubmitSubcategory}
            onClose={closeSubcategoryModal}
            onNameChange={handleSubcategoryNameChange}
            onSlugChange={handleSubcategorySlugChange}
            onCategoryIdChange={handleSubcategoryCategoryIdChange}
            onDescriptionChange={handleSubcategoryDescriptionChange}
            onOrderChange={handleSubcategoryOrderChange}
          />
        )}
      </div>
    </AdminLayout>
  );
}
