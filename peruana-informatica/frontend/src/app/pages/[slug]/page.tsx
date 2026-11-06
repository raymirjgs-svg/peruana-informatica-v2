import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageService } from '@/services/PageService';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await pageService.getPageBySlug(slug);

    if (!page || !page.data) {
        return {
            title: 'Página no encontrada',
        };
    }

    return {
        title: page.data.meta_title || page.data.title,
        description: page.data.meta_description || `Contenido de ${page.data.title}`,
    };
}

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params;
    const response = await pageService.getPageBySlug(slug);

    if (!response || !response.success || !response.data) {
        notFound();
    }

    const page = response.data;

    // Render content safely
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{page.title}</h1>
                    <div className="h-1 w-20 bg-blue-400 rounded-full"></div>
                    <p className="text-blue-100 mt-4 text-sm">
                        Última actualización: {new Date(page.updated_at).toLocaleDateString()}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 prose prose-lg max-w-none prose-blue prose-img:rounded-xl prose-headings:text-gray-900 prose-p:text-gray-600">
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>
            </div>
        </div>
    );
}
