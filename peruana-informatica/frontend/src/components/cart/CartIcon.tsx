'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
      <div className="text-2xl">🛒</div>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}
