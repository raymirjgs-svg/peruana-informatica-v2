'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PageForm } from '@/components/admin/PageForm';
import { pageService, CreatePageData } from '@/services/PageService';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

export default function EditPagePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const id = Number(params?.id);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<CreatePageData | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            if (!id || !session?.accessToken) return;
            try {
                const response = await pageService.getPageById(id, session.accessToken);
                setInitialData(response.data);
            } catch (error) {
                toast.error('Error al cargar la página');
                router.push('/admin/pages');
            } finally {
                setLoading(false);
            }
        };

        if (session?.accessToken) {
            fetchPage();
        }
    }, [id, session, router]);

    const handleSubmit = async (data: CreatePageData) => {
        if (!session?.accessToken) {
            toast.error('Sesión no válida');
            return;
        }

        setIsSubmitting(true);
        try {
            await pageService.updatePage(id, data, session.accessToken);
            toast.success('Página actualizada exitosamente');
            router.push('/admin/pages');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar página');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <PageForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEdit
                />
            </div>
        </AdminLayout>
    );
}
