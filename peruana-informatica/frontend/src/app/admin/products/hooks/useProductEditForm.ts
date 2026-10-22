"use client";

import { useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import type { Product } from "../types";
import { isValidUrl } from "../utils";
import apiClient from "@/utils/api";
import type { UseProductsFormsParams } from "./types";

type EditFormDeps = Pick<UseProductsFormsParams, "reloadProducts" | "showToast" | "setError">;

export function useProductEditForm({
  reloadProducts,
  showToast,
  setError,
}: EditFormDeps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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

  return {
    updatingId,
    editingId,
    editForm,
    setEditForm,
    showEditModal,
    startEdit,
    cancelEdit,
    onUpdate,
  };
}
