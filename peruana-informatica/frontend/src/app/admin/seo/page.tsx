"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/admin/Button";
import {
  SeoService,
  type SeoSettings,
  type SeoAnalysis,
  type SeoFormData,
} from "@/services/SeoService";

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
      <div className="space-y-5">
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

        {/* SEO Score */}
        {analysis && (
          <div
            className={`bg-gradient-to-r ${SeoService.getScoreBackgroundColor(analysis.score)} rounded-xl p-8 mb-6 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Score SEO General</h2>
                <p className="text-white/90">
                  {analysis.score >= 80
                    ? "Excelente optimización SEO"
                    : analysis.score >= 60
                      ? "Buena optimización SEO"
                      : "Necesita mejoras en SEO"}
                </p>
              </div>
              <div className="text-6xl font-bold">{analysis.score}/100</div>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Total Páginas</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {analysis.analysis.totalPages}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Optimizadas</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {analysis.analysis.optimizedPages}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Necesitan Atención</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {analysis.analysis.pagesNeedingAttention}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Recomendaciones</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {analysis.analysis.recommendations.length}
              </div>
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        {analysis &&
          (analysis.analysis.recommendations.length > 0 ||
            (analysis.pagesWithIssues && analysis.pagesWithIssues.length > 0)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-4">
                ⚠️ Recomendaciones para llegar al 100%
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-yellow-900 mb-2">
                    General
                  </h4>
                  <ul className="space-y-2">
                    {analysis.analysis.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start text-sm text-yellow-700"
                      >
                        <span className="text-yellow-600 mr-2 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.pagesWithIssues &&
                  analysis.pagesWithIssues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-yellow-900 mb-2">
                        Páginas específicas
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {analysis.pagesWithIssues.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white/50 p-3 rounded border border-yellow-100"
                          >
                            <div className="font-semibold text-xs text-gray-800">
                              {p.page_type}: {p.page_identifier || "Global"}
                            </div>
                            <ul className="mt-1">
                              {p.issues.map((issue: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-[11px] text-red-600 flex items-center"
                                >
                                  <span className="mr-1">⚠</span> {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Configuraciones SEO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Configuraciones SEO
            </h2>
            <Button onClick={handleNew}>+ Nueva Configuración</Button>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {SeoService.getPageTypeOptions().find(
                          (opt) => opt.value === setting.page_type,
                        )?.label || setting.page_type}
                      </span>
                      {setting.page_identifier && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {setting.page_identifier}
                        </span>
                      )}
                      {!setting.is_active && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800">
                      {setting.meta_title || "Sin título"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {setting.meta_description || "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Robots: {setting.robots}</span>
                      <span>Prioridad: {setting.priority}</span>
                      <span>Frecuencia: {setting.change_frequency}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(setting)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(setting.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {settings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay configuraciones SEO. Crea la primera configuración.
              </div>
            )}
          </div>
        </div>

        {/* Herramientas SEO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Herramientas SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/sitemap.xml"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🗺️</div>
              <div className="font-semibold text-gray-800">Sitemap XML</div>
              <div className="text-xs text-gray-500 mt-1">
                Ver sitemap generado
              </div>
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold text-gray-800">Robots.txt</div>
              <div className="text-xs text-gray-500 mt-1">
                Ver archivo robots
              </div>
            </a>
            <button
              onClick={loadData}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">
                Actualizar Análisis
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Recalcular score SEO
              </div>
            </button>
          </div>
        </div>

        {/* Modal para editar/crear configuración */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedSetting
                    ? "Editar Configuración SEO"
                    : "Nueva Configuración SEO"}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAiSuggest}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-3 w-3 border-b-2 border-gray-600 rounded-full"></span>
                        Pensando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        ✨ Sugerir con IA
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Página *
                    </label>
                    <select
                      name="page_type"
                      value={formData.page_type}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.page_type ? "border-red-500" : "border-gray-300"}`}
                      disabled={!!selectedSetting}
                    >
                      <option value="">Selecciona un tipo</option>
                      {SeoService.getPageTypeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.page_type && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.page_type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Identificador de Página
                    </label>
                    <input
                      type="text"
                      name="page_identifier"
                      value={formData.page_identifier || ""}
                      onChange={handleFormChange}
                      placeholder="ej: slug, id, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para páginas específicas (opcional)
                    </p>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Meta Tags</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Meta ({formData.meta_title?.length || 0}/60)
                    </label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleFormChange}
                      maxLength={255}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.meta_title ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.meta_title && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.meta_title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Meta ({formData.meta_description?.length || 0}
                      /160)
                    </label>
                    <textarea
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleFormChange}
                      rows={3}
                      maxLength={500}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${formErrors.meta_description ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.meta_description && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.meta_description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input
                      type="text"
                      name="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={handleFormChange}
                      placeholder="palabra1, palabra2, palabra3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separa las palabras clave con comas
                    </p>
                  </div>
                </div>

                {/* Open Graph */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Open Graph (Facebook)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título OG
                      </label>
                      <input
                        type="text"
                        name="og_title"
                        value={formData.og_title}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen OG
                      </label>
                      <input
                        type="url"
                        name="og_image"
                        value={formData.og_image}
                        onChange={handleFormChange}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción OG
                    </label>
                    <textarea
                      name="og_description"
                      value={formData.og_description}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Twitter Cards</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título Twitter
                      </label>
                      <input
                        type="text"
                        name="twitter_title"
                        value={formData.twitter_title}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen Twitter
                      </label>
                      <input
                        type="url"
                        name="twitter_image"
                        value={formData.twitter_image}
                        onChange={handleFormChange}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Twitter
                    </label>
                    <textarea
                      name="twitter_description"
                      value={formData.twitter_description}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Configuración avanzada */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Configuración Avanzada
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Robots
                      </label>
                      <select
                        name="robots"
                        value={formData.robots}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {SeoService.getRobotsOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridad (0.0-1.0)
                      </label>
                      <input
                        type="number"
                        name="priority"
                        value={formData.priority}
                        onChange={handleFormChange}
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        name="change_frequency"
                        value={formData.change_frequency}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {SeoService.getChangeFrequencyOptions().map(
                          (option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Canónica
                    </label>
                    <input
                      type="url"
                      name="canonical_url"
                      value={formData.canonical_url}
                      onChange={handleFormChange}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schema Markup (JSON-LD)
                    </label>
                    <textarea
                      name="schema_markup"
                      value={formData.schema_markup}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Personalizado (Head)
                    </label>
                    <textarea
                      name="custom_head"
                      value={formData.custom_head}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder='<meta name="..." content="..." />'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Configuración activa
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {selectedSetting ? "Actualizar" : "Crear"} Configuración
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
