"use client";

import { useProductBulkUpdate } from "./useProductBulkUpdate";
import { useProductCreateForm } from "./useProductCreateForm";
import { useProductEditForm } from "./useProductEditForm";
import type { UseProductsFormsParams } from "./types";

export type { UseProductsFormsParams };

export function useProductsForms(params: UseProductsFormsParams) {
  const create = useProductCreateForm(params);
  const edit = useProductEditForm(params);
  const bulk = useProductBulkUpdate(params);

  return {
    subcategories: create.subcategories,
    loadingSubcategories: create.loadingSubcategories,
    form: create.form,
    setForm: create.setForm,
    additionalImages: create.additionalImages,
    setAdditionalImages: create.setAdditionalImages,
    uploadingImage: create.uploadingImage,
    setUploadingImage: create.setUploadingImage,
    createStep: create.createStep,
    setCreateStep: create.setCreateStep,
    searchCode: create.searchCode,
    setSearchCode: create.setSearchCode,
    searchingCode: create.searchingCode,
    searchError: create.searchError,
    creating: create.creating,
    updatingId: edit.updatingId,
    editingId: edit.editingId,
    editForm: edit.editForm,
    setEditForm: edit.setEditForm,
    showCreateModal: create.showCreateModal,
    setShowCreateModal: create.setShowCreateModal,
    showEditModal: edit.showEditModal,
    showBulkPanel: bulk.showBulkPanel,
    setShowBulkPanel: bulk.setShowBulkPanel,
    bulkCategory: bulk.bulkCategory,
    setBulkCategory: bulk.setBulkCategory,
    bulkSubcategories: bulk.bulkSubcategories,
    setBulkSubcategories: bulk.setBulkSubcategories,
    bulkSubcategoryOptions: bulk.bulkSubcategoryOptions,
    loadingBulkSubcategories: bulk.loadingBulkSubcategories,
    bulkBrand: bulk.bulkBrand,
    setBulkBrand: bulk.setBulkBrand,
    bulkComponentType: bulk.bulkComponentType,
    setBulkComponentType: bulk.setBulkComponentType,
    bulkSocketType: bulk.bulkSocketType,
    setBulkSocketType: bulk.setBulkSocketType,
    bulkRamType: bulk.bulkRamType,
    setBulkRamType: bulk.setBulkRamType,
    bulkFormFactor: bulk.bulkFormFactor,
    setBulkFormFactor: bulk.setBulkFormFactor,
    applyingBulk: bulk.applyingBulk,
    duplicateProduct: create.duplicateProduct,
    handleSearchCode: create.handleSearchCode,
    resetCreateModal: create.resetCreateModal,
    handleFileUpload: create.handleFileUpload,
    onCreate: create.onCreate,
    startEdit: edit.startEdit,
    cancelEdit: edit.cancelEdit,
    onUpdate: edit.onUpdate,
    applyBulkUpdate: bulk.applyBulkUpdate,
  };
}
