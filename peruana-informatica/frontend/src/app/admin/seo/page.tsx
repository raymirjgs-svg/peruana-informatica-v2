"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  SeoService,
  type SeoSettings,
  type SeoAnalysis,
  type SeoFormData,
} from "@/services/SeoService";
import { SeoScoreCard } from "./components/SeoScoreCard";
import { SeoStatsGrid } from "./components/SeoStatsGrid";
import { SeoRecommendations } from "./components/SeoRecommendations";
import { SeoSettingsList } from "./components/SeoSettingsList";
import { SeoTools } from "./components/SeoTools";
import { SeoSettingsModal } from "./components/SeoSettingsModal";

export default function SEOPage() {
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [settings, setSettings] = useState<SeoSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSetting, setSelectedSetting] = useState<SeoSettings | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SeoFormData>({
    page_type: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    robots: "index,follow",
    priority: 0.5,
    change_frequency: "weekly",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [analysisResponse, settingsResponse] = await Promise.all([
        SeoService.getAnalysis(),
        SeoService.getAllSettings({ is_active: true }),
      ]);

      setAnalysis(analysisResponse.data || null);
      setSettings(settingsResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos SEO");
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar cambios en el formulario
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Limpiar errores de validación
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.page_type) {
      errors.page_type = "El tipo de página es requerido";
    }

    if (formData.meta_title) {
      const titleValidation = SeoService.validateMetaTitle(formData.meta_title);
      if (!titleValidation.isValid) {
        errors.meta_title = titleValidation.message || "";
      }
    }

    if (formData.meta_description) {
      const descValidation = SeoService.validateMetaDescription(
        formData.meta_description,
      );
      if (!descValidation.isValid) {
        errors.meta_description = descValidation.message || "";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar configuración SEO
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (selectedSetting) {
        await SeoService.updateById(selectedSetting.id, formData);
      } else {
        await SeoService.create(formData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar la configuración");
    }
  };

  // Editar configuración
  const handleEdit = (setting: SeoSettings) => {
    setSelectedSetting(setting);
    setFormData({
      page_type: setting.page_type,
      page_identifier: setting.page_identifier,
      meta_title: setting.meta_title || "",
      meta_description: setting.meta_description || "",
      meta_keywords: setting.meta_keywords || "",
      og_title: setting.og_title || "",
      og_description: setting.og_description || "",
      og_image: setting.og_image || "",
      twitter_title: setting.twitter_title || "",
      twitter_description: setting.twitter_description || "",
      twitter_image: setting.twitter_image || "",
      canonical_url: setting.canonical_url || "",
      robots: setting.robots,
      schema_markup: setting.schema_markup || "",
      custom_head: setting.custom_head || "",
      priority: setting.priority,
      change_frequency: setting.change_frequency,
      is_active: setting.is_active,
    });
    setIsModalOpen(true);
  };

  // Eliminar configuración
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta configuración SEO?")) return;

    try {
      await SeoService.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Error al eliminar la configuración");
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedSetting(null);
    setFormData({
      page_type: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      robots: "index,follow",
      priority: 0.5,
      change_frequency: "weekly",
      is_active: true,
    });
    setFormErrors({});
  };

  // Abrir modal para nueva configuración
  const handleNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Sugerir metadatos con IA
  const handleAiSuggest = async () => {
    if (!formData.page_type) {
      alert("Por favor selecciona un tipo de página primero");
      return;
    }

    try {
      setIsAiLoading(true);
      const result = await SeoService.suggestMetadata({
        page_type: formData.page_type,
        page_identifier: formData.page_identifier,
        current_title: formData.meta_title,
        current_description: formData.meta_description,
      });

      if (result.success && result.data) {
        const sugg = result.data;
        setFormData((prev) => ({
          ...prev,
          meta_title: sugg.meta_title || prev.meta_title,
          meta_description: sugg.meta_description || prev.meta_description,
          meta_keywords: sugg.meta_keywords || prev.meta_keywords,
          og_title: sugg.og_title || prev.og_title,
          og_description: sugg.og_description || prev.og_description,
          twitter_title: sugg.twitter_title || prev.twitter_title,
          twitter_description:
            sugg.twitter_description || prev.twitter_description,
        }));
      }
    } catch (err: any) {
      alert(err.message || "Error al obtener sugerencias de la IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Configuración SEO
          </h1>
          <p className="text-gray-500 mt-1">
            Optimiza tu sitio para motores de búsqueda
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {analysis && <SeoScoreCard analysis={analysis} />}

        {analysis && <SeoStatsGrid analysis={analysis} />}

        {analysis && <SeoRecommendations analysis={analysis} />}

        <SeoSettingsList
          settings={settings}
          onNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <SeoTools onRefresh={loadData} />

        {isModalOpen && (
          <SeoSettingsModal
            selectedSetting={selectedSetting}
            formData={formData}
            formErrors={formErrors}
            isAiLoading={isAiLoading}
            onChange={handleFormChange}
            onAiSuggest={handleAiSuggest}
            onSave={handleSave}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </AdminLayout>
  );
}
