"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  ContactService,
  type Contact,
  type ContactStats,
} from "@/services/ContactService";
import { ContactStatsCards } from "./components/ContactStatsCards";
import { ContactFiltersBar } from "./components/ContactFiltersBar";
import { ContactsList } from "./components/ContactsList";
import { ContactDetailModal } from "./components/ContactDetailModal";
import type { ContactFilters, ContactPagination, ContactStatus } from "./components/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filters, setFilters] = useState<ContactFilters>({
    status: "",
    asunto: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState<ContactPagination>({
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los contactos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Actualizar estado de contacto
  const handleStatusUpdate = async (
    id: number,
    status: ContactStatus,
  ) => {
    try {
      await ContactService.updateContactStatus(id, status);
      await loadContacts(); // Recargar datos
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estado");
    }
  };

  // Eliminar contacto
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este contacto?")) return;

    try {
      await ContactService.deleteContact(id);
      await loadContacts(); // Recargar datos
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el contacto");
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

        {stats && <ContactStatsCards stats={stats} />}

        <ContactFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={loadContacts}
          loading={loading}
        />

        <ContactsList
          contacts={contacts}
          loading={loading}
          onView={handleViewContact}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={handlePageChange}
        />

        {selectedContact && (
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onResolve={() => {
              handleStatusUpdate(selectedContact.id, "resolved");
              setSelectedContact(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
