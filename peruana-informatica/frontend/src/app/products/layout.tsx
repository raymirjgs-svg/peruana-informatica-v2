import type { Metadata } from "next";
import Script from "next/script";
import { getApiBase as getApiHost } from '@/lib/apiBase';

function getApiBase() {
  return `${getApiHost()}/api`;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
