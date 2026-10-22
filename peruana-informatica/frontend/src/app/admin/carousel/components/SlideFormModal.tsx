'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/admin/Button';
import type { SlideForm } from './types';

interface SlideFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  form: SlideForm;
  onChange: (form: SlideForm) => void;
  onSubmit: (e: FormEvent) => void;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  uploadingImage: boolean;
  submitting: boolean;
  submitLabel: string;
  error: string | null;
  isEdit: boolean;
}

export function SlideFormModal({
  isOpen,
  onClose,
  title,
  form,
  onChange,
  onSubmit,
  onImageUpload,
  uploadingImage,
  submitting,
  submitLabel,
  error,
  isEdit,
}: SlideFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.title} onChange={(e)=>onChange({...form, title: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.description} onChange={(e)=>onChange({...form, description: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto del botón *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.buttonText} onChange={(e)=>onChange({...form, buttonText: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del botón *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.buttonUrl} onChange={(e)=>onChange({...form, buttonUrl: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fondo (gradiente Tailwind)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="from-blue-500 to-blue-700" value={form.backgroundColor} onChange={(e)=>onChange({...form, backgroundColor: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <div className="space-y-2">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => onImageUpload(e, isEdit)}
                disabled={uploadingImage}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="O ingresa una URL: https://..." value={form.imageUrl} onChange={(e)=>onChange({...form, imageUrl: e.target.value})} />
              {uploadingImage && <p className="text-xs text-gray-500">Subiendo imagen...</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" className="rounded" checked={form.isActive} onChange={(e)=>onChange({...form, isActive: e.target.checked})} />
              Activo
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input type="number" className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.order} onChange={(e)=>onChange({...form, order: Number(e.target.value)})} />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={submitting}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
