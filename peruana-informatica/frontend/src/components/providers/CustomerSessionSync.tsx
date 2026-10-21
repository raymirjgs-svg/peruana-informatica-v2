'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setAuthToken, clearAuthToken } from '@/lib/authTokens';

export default function CustomerSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const role = session?.user?.role;
    const isAdmin = role === 'admin' || role === 'super-admin';

    if (status === 'authenticated' && session?.accessToken && !isAdmin) {
      setAuthToken('customer', session.accessToken);
      return;
    }

    clearAuthToken('customer');
  }, [session, status]);

  return null;
}
