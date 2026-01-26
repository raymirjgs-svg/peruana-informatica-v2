"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/admin/Button";
import {
  ContactService,
  type Contact,
  type ContactStats,
} from "@/services/ContactService";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    asunto: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Cargar contactos y estadísticas
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const [contactsResponse, statsResponse] = await Promise.all([
        ContactService.getAllContacts(filters),
        ContactService.getContactStats(),
      ]);

      setContacts(contactsResponse.data);
      setPagination(contactsResponse.pagination);
      setStats(statsResponse.data || null);
    } catch (err: any) {
      setError(err.message || "Error al cargar los contactos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Actualizar estado de contacto
  const handleStatusUpdate = async (
    id: number,
    status: "pending" | "resolved" | "spam",
  ) => {
    try {
      await ContactService.updateContactStatus(id, status);
      await loadContacts(); // Recargar datos
    } catch (err: any) {
      setError(err.message || "Error al actualizar el estado");
    }
  };

  // Eliminar contacto
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este contacto?")) return;

    try {
      await ContactService.deleteContact(id);
      await loadContacts(); // Recargar datos
    } catch (err: any) {
      setError(err.message || "Error al eliminar el contacto");
    }
  };

  // Ver contacto completo
  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Filtros
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filtering
    }));
  };

  // Paginación
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Mensajes de Contacto
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona las consultas de tus clientes
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Mensajes Pendientes</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.totals.pending}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Resueltos</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.totals.resolved}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Hoy</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {stats.periods.today}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500">Total Mensajes</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {stats.totals.total}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="resolved">Resueltos</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto
              </label>
              <select
                value={filters.asunto}
                onChange={(e) => handleFilterChange("asunto", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los asuntos</option>
                {ContactService.getSubjectOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Buscar por nombre, email o mensaje..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadContacts} disabled={loading}>
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando contactos...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-500">No se encontraron contactos</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {ContactService.getSubjectOptions().find(
                          (opt) => opt.value === contact.asunto,
                        )?.label || contact.asunto}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        De:{" "}
                        <span className="font-medium text-gray-700">
                          {contact.nombre}
                        </span>{" "}
                        ({contact.email})
                      </p>
                      {contact.telefono && (
                        <p className="text-sm text-gray-500">
                          Tel: {contact.telefono}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${ContactService.getStatusClass(contact.status)}`}
                    >
                      {ContactService.getStatusText(contact.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {contact.mensaje}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {ContactService.formatDate(contact.createdAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewContact(contact)}
                      >
                        Ver Completo
                      </Button>
                      {contact.status === "pending" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            handleStatusUpdate(contact.id, "resolved")
                          }
                        >
                          Marcar Resuelto
                        </Button>
                      )}
                      {contact.status !== "spam" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusUpdate(contact.id, "spam")}
                        >
                          Marcar Spam
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(contact.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">
                  Página {pagination.currentPage} de {pagination.totalPages} (
                  {pagination.totalItems} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal para ver contacto completo */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {ContactService.getSubjectOptions().find(
                        (opt) => opt.value === selectedContact.asunto,
                      )?.label || selectedContact.asunto}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {ContactService.formatDate(selectedContact.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${ContactService.getStatusClass(selectedContact.status)}`}
                  >
                    {ContactService.getStatusText(selectedContact.status)}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <p className="text-gray-800">{selectedContact.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-gray-800">{selectedContact.email}</p>
                  </div>
                  {selectedContact.telefono && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <p className="text-gray-800">
                        {selectedContact.telefono}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedContact.mensaje}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                {selectedContact.status === "pending" && (
                  <Button
                    variant="success"
                    onClick={() => {
                      handleStatusUpdate(selectedContact.id, "resolved");
                      setSelectedContact(null);
                    }}
                  >
                    Marcar Resuelto
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setSelectedContact(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
