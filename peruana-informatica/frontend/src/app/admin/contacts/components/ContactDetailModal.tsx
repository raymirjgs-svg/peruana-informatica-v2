'use client';

import { Button } from '@/components/admin/Button';
import { ContactService, type Contact } from '@/services/ContactService';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onResolve: () => void;
}

export function ContactDetailModal({
  contact,
  onClose,
  onResolve,
}: ContactDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {ContactService.getSubjectOptions().find(
                  (opt) => opt.value === contact.asunto,
                )?.label || contact.asunto}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {ContactService.formatDate(contact.createdAt)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${ContactService.getStatusClass(contact.status)}`}
            >
              {ContactService.getStatusText(contact.status)}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <p className="text-gray-800">{contact.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-gray-800">{contact.email}</p>
            </div>
            {contact.telefono && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <p className="text-gray-800">
                  {contact.telefono}
                </p>
              </div>
            )}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {contact.mensaje}
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
          {contact.status === "pending" && (
            <Button
              variant="success"
              onClick={onResolve}
            >
              Marcar Resuelto
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
