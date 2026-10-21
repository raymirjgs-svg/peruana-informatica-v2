'use client';

import { SWRConfig } from 'swr';

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000,
  keepPreviousData: true,
  errorRetryCount: 1,
};

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={SWR_OPTIONS}>{children}</SWRConfig>;
}
