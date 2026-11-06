import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname === "/detalle-producto.php" || pathname === "/producto.php") {
    const cod = req.nextUrl.searchParams.get("cod_producto");
    if (cod && /^\d+$/.test(cod)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_URL}/api/products/${cod}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeout);
        if (res.ok) {
          const product = await res.json();
          if (product?.slug) {
            return NextResponse.redirect(new URL(`/products/${product.slug}`, req.url), 301);
          }
        }
      } catch {
        // fallthrough to 404
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/products/") && pathname.endsWith("-")) {
    const slug = decodeURIComponent(pathname.split("/").pop() || "");
    if (slug.length >= 3) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `${API_URL}/api/products/resolve-slug?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.slug && data.slug !== slug) {
            return NextResponse.redirect(new URL(`/products/${data.slug}`, req.url), 301);
          }
        }
      } catch {
        // fallthrough: page renders its own 404
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/detalle-producto.php", "/producto.php", "/products/:path*"],
  runtime: "nodejs",
};
