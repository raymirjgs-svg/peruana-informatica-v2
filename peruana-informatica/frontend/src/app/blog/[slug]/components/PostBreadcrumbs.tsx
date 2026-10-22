import Link from "next/link";

interface PostBreadcrumbsProps {
  title: string;
}

export function PostBreadcrumbs({ title }: PostBreadcrumbsProps) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 max-w-4xl py-3">
        <nav className="flex items-center text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition">Inicio</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-md">{title}</span>
        </nav>
      </div>
    </div>
  );
}
