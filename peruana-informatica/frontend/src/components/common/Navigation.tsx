// ============================================
// 6. src/components/common/Navigation.tsx
// ============================================
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface NavigationProps {
  items?: BreadcrumbItem[];
}

export function Navigation({ items = [] }: NavigationProps) {
  const pathname = usePathname();

  const defaultItems: BreadcrumbItem[] = [{ name: 'Inicio', href: '/' }];

  if (pathname.includes('/products') && !pathname.includes('/products/')) {
    defaultItems.push({ name: 'Productos', href: '/products' });
  }
  if (pathname.includes('/blog') && !pathname.includes('/blog/')) {
    defaultItems.push({ name: 'Blog', href: '/blog' });
  }

  const breadcrumbs = items.length > 0 ? items : defaultItems;

  return (
    <nav className="bg-gray-100 py-3 mb-8 rounded-lg border border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 text-sm flex-wrap">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              <Link href={item.href} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                {item.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}