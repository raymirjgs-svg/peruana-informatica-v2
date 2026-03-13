'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Eye, Trash2, Globe } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MotionWrapper } from '@/components/ui/MotionWrapper';
import Link from 'next/link';
import { pageService, Page } from '@/services/PageService';
import { toast } from 'sonner';

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPages = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
    if (!token) return;
    setLoading(true);
    try {
      const response = await pageService.getAllPages(currentPage, 10, searchTerm, token);
      setPages(response.data);
      setTotalPages(response.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar páginas');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [currentPage, searchTerm]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta página?')) return;
    const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
    if (!token) return;

    try {
      await pageService.deletePage(id, token);
      toast.success('Página eliminada');
      fetchPages();
    } catch (error) {
      toast.error('Error al eliminar página');
    }
  };

  const publishedCount = pages.filter(p => p.is_published).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Gestión de Páginas"
          description="Crea y administra el contenido estático de tu sitio web"
          icon={FileText}
          action={
            <Link href="/admin/pages/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
              <Plus className="h-4 w-4" />
              Nueva Página
            </Link>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StatsCard
            title="Páginas Publicadas"
            value={publishedCount.toString()}
            description="Visibles en el sitio"
            icon={Globe}
            color="green"
          />
          <StatsCard
            title="Borradores"
            value={(pages.length - publishedCount).toString()}
            description="En edición"
            icon={FileText}
            color="yellow"
          />
          <StatsCard
            title="Total Páginas"
            value={pages.length.toString()}
            description="En el sistema"
            icon={FileText}
            color="blue"
          />
        </div>

        <MotionWrapper className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Listado de Páginas
            </h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay páginas creadas aún o no coinciden con la búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{page.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${page.is_published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {page.is_published ? 'Publicada' : 'Borrador'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>/{page.slug}</span>
                      <span className="text-gray-300">•</span>
                      <span>Actualizado: {new Date(page.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {page.is_published && (
                      <Link
                        href={`/pages/${page.slug}`}
                        target="_blank"
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Ver en vivo"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/pages/${page.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Simple Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-500">Pág {currentPage} de {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </MotionWrapper>
      </div>
    </AdminLayout>
  );
}
