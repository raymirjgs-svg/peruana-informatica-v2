'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function CustomerSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const role = session?.user?.role;
    const isAdmin = role === 'admin' || role === 'super-admin';

    if (status === 'authenticated' && session?.accessToken && !isAdmin) {
      localStorage.setItem('customerToken', session.accessToken);
      return;
    }

    localStorage.removeItem('customerToken');
  }, [session, status]);

  return null;
}
