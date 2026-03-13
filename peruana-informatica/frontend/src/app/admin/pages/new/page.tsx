'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PageForm } from '@/components/admin/PageForm';
import { pageService, CreatePageData } from '@/services/PageService';
import { toast } from 'sonner';

export default function NewPagePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: CreatePageData) => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
        if (!token) {
            toast.error('Sesión no válida');
            return;
        }

        setIsSubmitting(true);
        try {
            await pageService.createPage(data, token);
            toast.success('Página creada exitosamente');
            router.push('/admin/pages');
        } catch (error: any) {
            toast.error(error.message || 'Error al crear página');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <PageForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </AdminLayout>
    );
}
