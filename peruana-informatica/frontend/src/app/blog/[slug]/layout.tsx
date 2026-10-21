import type { Metadata } from 'next';
import { BlogService } from '@/services/BlogService';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://peruanainformatica.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const url = `${siteUrl}/blog/${slug}`;

  try {
    const response = await BlogService.getPostBySlug(slug);
    const post = response.data;
    if (!post) {
      return { title: 'Artículo no encontrado | Peruana de Informática' };
    }

    const title = post.meta_title || post.title;
    const description = (post.meta_description || post.excerpt || '').substring(0, 160);
    const image = post.featured_image;

    return {
      title: `${title} | Peruana de Informática`,
      description,
      keywords: post.meta_keywords,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        publishedTime: post.published_at,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: 'Blog | Peruana de Informática',
      description: 'Artículos, guías y novedades sobre tecnología.',
    };
  }
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
