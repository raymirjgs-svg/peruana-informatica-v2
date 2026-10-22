'use client';

import { Button } from '@/components/admin/Button';
import { ContactService, type Contact } from '@/services/ContactService';
import type { ContactPagination, ContactStatus } from './types';

interface ContactsListProps {
  contacts: Contact[];
  loading: boolean;
  onView: (contact: Contact) => void;
  onStatusUpdate: (id: number, status: ContactStatus) => void;
  onDelete: (id: number) => void;
  pagination: ContactPagination;
  onPageChange: (page: number) => void;
}

export function ContactsList({
  contacts,
  loading,
  onView,
  onStatusUpdate,
  onDelete,
  pagination,
  onPageChange,
}: ContactsListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Cargando contactos...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
        <p className="text-gray-500">No se encontraron contactos</p>
      </div>
    );
  }

  return (
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
                  onClick={() => onView(contact)}
                >
                  Ver Completo
                </Button>
                {contact.status === "pending" && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onStatusUpdate(contact.id, "resolved")}
                  >
                    Marcar Resuelto
                  </Button>
                )}
                {contact.status !== "spam" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onStatusUpdate(contact.id, "spam")}
                  >
                    Marcar Spam
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(contact.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
