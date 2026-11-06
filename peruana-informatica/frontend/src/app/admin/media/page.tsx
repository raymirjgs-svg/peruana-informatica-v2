"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/utils/api";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface ImageItem {
  filename: string;
  url: string;
  size: number;
  created: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MediaLibraryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      const res: any = await apiClient.get(`/api/admin/upload/list?t=${Date.now()}`);
      setImages(res.images || []);
    } catch {
      toast.error("Error al cargar imágenes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload`,
          { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }
        );
        if (res.ok) uploaded++;
        else toast.error(`Error subiendo ${file.name}`);
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }
    setUploading(false);
    if (uploaded > 0) {
      toast.success(`${uploaded} imagen${uploaded > 1 ? "es" : ""} subida${uploaded > 1 ? "s" : ""}`);
      loadImages();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) uploadFiles(files);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copiada");
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteImage = async (filename: string) => {
    if (!confirm(`¿Eliminar ${filename}?`)) return;
    setDeleting(filename);
    try {
      await apiClient.delete(`/api/admin/upload/delete/${filename}`);
      toast.success("Imagen eliminada");
      setImages(prev => prev.filter(img => img.filename !== filename));
    } catch {
      toast.error("Error al eliminar imagen");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = images.filter(img =>
    img.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca de Imágenes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {images.length} imagen{images.length !== 1 ? "es" : ""} · Sube hasta 5 MB por archivo
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
          >
            {uploading ? (
              <><span className="animate-spin">⏳</span> Subiendo...</>
            ) : (
              <><span className="text-lg leading-none">+</span> Subir imágenes</>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`}
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF · Máx. 5 MB</p>
        </div>

        {/* Search */}
        {images.length > 0 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">
              {search ? "No se encontraron imágenes" : "No hay imágenes subidas aún"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((img) => (
              <div
                key={img.filename}
                className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/no-image.svg"; }}
                  />
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyUrl(img.url)}
                    title="Copiar URL"
                    className="p-2 bg-white rounded-lg text-gray-800 hover:bg-blue-500 hover:text-white transition-colors shadow"
                  >
                    {copied === img.url ? "✓" : "🔗"}
                  </button>
                  <button
                    onClick={() => deleteImage(img.filename)}
                    disabled={deleting === img.filename}
                    title="Eliminar"
                    className="p-2 bg-white rounded-lg text-gray-800 hover:bg-red-500 hover:text-white transition-colors shadow disabled:opacity-50"
                  >
                    {deleting === img.filename ? "⏳" : "🗑️"}
                  </button>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={img.filename}>
                    {img.filename}
                  </p>
                  <p className="text-[10px] text-gray-400">{formatSize(img.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
