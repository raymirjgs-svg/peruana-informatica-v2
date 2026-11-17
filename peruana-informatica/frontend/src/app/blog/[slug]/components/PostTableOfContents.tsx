import type { TableOfContentsItem } from "../types";

interface PostTableOfContentsProps {
  items: TableOfContentsItem[];
}

export function PostTableOfContents({ items }: PostTableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
      <div className="sticky top-24 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          En este artículo
        </h3>
        <nav className="space-y-2">
          {items.map((heading, index) => (
            <a
              key={index}
              href={`#${heading.id}`}
              className={`block text-sm hover:text-blue-600 transition ${heading.level === 1 ? 'font-bold' : heading.level === 2 ? 'ml-0 font-semibold' : 'ml-4 text-gray-600'
                }`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
