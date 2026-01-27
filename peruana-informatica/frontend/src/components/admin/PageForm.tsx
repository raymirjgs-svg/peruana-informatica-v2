'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

const pageSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    slug: z.string().min(3, 'El enlace permanente es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    content: z.string().min(10, 'El contenido es muy corto'),
    is_published: z.boolean(),
    meta_title: z.string().optional().or(z.literal('')),
    meta_description: z.string().optional().or(z.literal('')),
});

type PageFormData = z.infer<typeof pageSchema>;

interface PageFormProps {
    initialData?: PageFormData;
    onSubmit: (data: PageFormData) => Promise<void>;
    isSubmitting: boolean;
    isEdit?: boolean;
}

export function PageForm({ initialData, onSubmit, isSubmitting, isEdit }: PageFormProps) {
    const router = useRouter();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PageFormData>({
        resolver: zodResolver(pageSchema),
        defaultValues: initialData || {
            is_published: false,
            content: '',
            title: '',
            slug: '',
        }
    });

    const title = watch('title');

    // Auto-generate slug from title only in create mode
    useEffect(() => {
        if (!isEdit && title) {
            const slug = title
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                .trim()
                .replace(/\s+/g, '-'); // Replace spaces with dashes
            setValue('slug', slug, { shouldValidate: true });
        }
    }, [title, isEdit, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pages" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEdit ? 'Editar Página' : 'Nueva Página'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isEdit ? 'Modifica el contenido y SEO de la página' : 'Crea una nueva página estática para el sitio'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Guardar Página
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contenido Principal</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Título de la Página
                                </label>
                                <input
                                    {...register('title')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Sobre Nosotros"
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Enlace Permanente (Slug)
                                </label>
                                <div className="flex items-center">
                                    <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-300 dark:border-gray-700 rounded-l-lg text-gray-500 text-sm">
                                        /pages/
                                    </span>
                                    <input
                                        {...register('slug')}
                                        className="flex-1 px-4 py-2 rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="sobre-nosotros"
                                    />
                                </div>
                                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contenido (HTML soportado)
                                </label>
                                <textarea
                                    {...register('content')}
                                    rows={15}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                    placeholder="<p>Escribe aquí el contenido de tu página...</p>"
                                />
                                <p className="text-xs text-gray-500 mt-1">Puedes escribir texto plano o código HTML.</p>
                                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Publicación</h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register('is_published')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    {watch('is_published') ? 'Visible' : 'Oculto'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">SEO (Opcional)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Meta Título
                                </label>
                                <input
                                    {...register('meta_title')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Título para buscadores"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Meta Descripción
                                </label>
                                <textarea
                                    {...register('meta_description')}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Descripción breve para resultados de búsqueda"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
