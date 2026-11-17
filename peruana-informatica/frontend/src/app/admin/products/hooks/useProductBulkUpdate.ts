"use client";

import { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import apiClient from "@/utils/api";
import type { UseProductsFormsParams } from "./types";

type BulkUpdateDeps = Pick<
  UseProductsFormsParams,
  "reloadProducts" | "showToast" | "selectedProducts" | "clearSelection"
>;

export function useProductBulkUpdate({
  reloadProducts,
  showToast,
  selectedProducts,
  clearSelection,
}: BulkUpdateDeps) {
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

  // Cargar subcategorías para bulk update cuando cambia la categoría
  useEffect(() => {
    if (bulkCategory) {
      setLoadingBulkSubcategories(true);
      setBulkSubcategories([]); // Reset subcategories when category changes
      apiClient.request<{ subCategories?: Array<{ id: number; name: string }> }>(
        `/api/categories/${bulkCategory}`,
      )
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
      const payload = { product_ids: selectedProducts } as Record<string, unknown>;
      if (bulkCategory) payload.category_id = bulkCategory;
      if (bulkSubcategories.length > 0) payload.subcategory_ids = bulkSubcategories;
      if (bulkBrand) payload.brand_id = bulkBrand;
      if (bulkComponentType) payload.component_type = bulkComponentType;
      if (bulkSocketType) payload.socket_type = bulkSocketType;
      if (bulkRamType) payload.ram_type = bulkRamType;
      if (bulkFormFactor) payload.form_factor = bulkFormFactor;

      const json = await apiClient.request<{ updated?: number }>('/api/admin/products/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: payload
      });

      showToast(`${json.updated} producto(s) actualizado(s)`);
      clearSelection();
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar en bloque', 'error');
    } finally {
      setApplyingBulk(false);
    }
  };

  return {
    showBulkPanel,
    setShowBulkPanel,
    bulkCategory,
    setBulkCategory,
    bulkSubcategories,
    setBulkSubcategories,
    bulkSubcategoryOptions,
    loadingBulkSubcategories,
    bulkBrand,
    setBulkBrand,
    bulkComponentType,
    setBulkComponentType,
    bulkSocketType,
    setBulkSocketType,
    bulkRamType,
    setBulkRamType,
    bulkFormFactor,
    setBulkFormFactor,
    applyingBulk,
    applyBulkUpdate,
  };
}
