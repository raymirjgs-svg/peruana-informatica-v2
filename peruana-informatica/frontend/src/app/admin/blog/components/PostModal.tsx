import { Button } from '@/components/admin/Button';
import { BlogPost, PostFormData } from '../types';

interface PostModalProps {
  selectedPost: BlogPost | null;
  formData: PostFormData;
  onFormChange: (data: PostFormData) => void;
  savingPost: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function PostModal({
  selectedPost,
  formData,
  onFormChange,
  savingPost,
  onSave,
  onClose,
}: PostModalProps) {
  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full my-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPost ? "📝 Editar Post" : "✨ Nuevo Post"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedPost
                    ? "Modifica los campos que desees actualizar"
                    : "Completa la información del post"}
                </p>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        onFormChange({ ...formData, title: e.target.value })
                      }
                      placeholder="Título del post"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Extracto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extracto
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) =>
                        onFormChange({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Breve descripción del post"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Contenido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        onFormChange({ ...formData, content: e.target.value })
                      }
                      placeholder="Contenido completo del post (Markdown soportado)"
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  {/* Imagen destacada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Imagen Destacada
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) =>
                        onFormChange({
                          ...formData,
                          featured_image: e.target.value,
                        })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Autor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Autor
                      </label>
                      <input
                        type="text"
                        value={formData.author_name}
                        onChange={(e) =>
                          onFormChange({
                            ...formData,
                            author_name: e.target.value,
                          })
                        }
                        placeholder="Nombre del autor"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email del Autor
                      </label>
                      <input
                        type="email"
                        value={formData.author_email}
                        onChange={(e) =>
                          onFormChange({
                            ...formData,
                            author_email: e.target.value,
                          })
                        }
                        placeholder="email@ejemplo.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Tags y Categorías */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) =>
                          onFormChange({ ...formData, tags: e.target.value })
                        }
                        placeholder="tag1, tag2, tag3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separados por comas
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categorías
                      </label>
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) =>
                          onFormChange({
                            ...formData,
                            categories: e.target.value,
                          })
                        }
                        placeholder="categoría1, categoría2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separadas por comas
                      </p>
                    </div>
                  </div>

                  {/* SEO Meta */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      🔍 SEO & Metadatos
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Título
                        </label>
                        <input
                          type="text"
                          value={formData.meta_title}
                          onChange={(e) =>
                            onFormChange({
                              ...formData,
                              meta_title: e.target.value,
                            })
                          }
                          placeholder="Título para SEO (si es diferente al título del post)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Descripción
                        </label>
                        <textarea
                          value={formData.meta_description}
                          onChange={(e) =>
                            onFormChange({
                              ...formData,
                              meta_description: e.target.value,
                            })
                          }
                          placeholder="Descripción para motores de búsqueda"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.meta_keywords}
                          onChange={(e) =>
                            onFormChange({
                              ...formData,
                              meta_keywords: e.target.value,
                            })
                          }
                          placeholder="palabra1, palabra2, palabra3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ⚙️ Opciones
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            onFormChange({
                              ...formData,
                              status: e.target.value as
                                | "draft"
                                | "published"
                                | "scheduled"
                                | "archived",
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="draft">Borrador</option>
                          <option value="published">Publicado</option>
                          <option value="scheduled">Programado</option>
                          <option value="archived">Archivado</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) =>
                            onFormChange({
                              ...formData,
                              is_featured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="is_featured"
                          className="text-sm font-medium text-gray-700"
                        >
                          ⭐ Marcar como destacado
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={onSave}
                  disabled={
                    savingPost ||
                    !formData.title.trim() ||
                    !formData.content.trim()
                  }
                >
                  {savingPost
                    ? "Guardando..."
                    : selectedPost
                      ? "💾 Actualizar Post"
                      : "✨ Crear Post"}
                </Button>
              </div>
            </div>
          </div>
  );
}
