import fs from 'fs';
import path from 'path';
import type { Router } from 'express';

import productRoutes from '../src/routes/productRoutes';
import brandRoutes from '../src/routes/brandRoutes';
import categoryRoutes from '../src/routes/categoryRoutes';
import laptopRoutes from '../src/routes/laptopRoutes';
import dashboardRoutes from '../src/routes/dashboardRoutes';
import { contactRoutes } from '../src/routes/contactRoutes';
import { seoRoutes } from '../src/routes/seoRoutes';
import { blogRoutes } from '../src/routes/blogRoutes';
import adminProductRoutes from '../src/routes/admin/productRoutes';
import adminCategoryRoutes from '../src/routes/admin/categoryRoutes';
import adminCarouselRoutes from '../src/routes/admin/carouselRoutes';
import adminAuthRoutes from '../src/routes/admin/authRoutes';
import adminImageRoutes from '../src/routes/admin/imageRoutes';
import adminTaxonomyRoutes from '../src/routes/admin/taxonomyRoutes';
import adminBrandRoutes from '../src/routes/admin/brandRoutes';
import adminCustomerRoutes from '../src/routes/admin/customerRoutes';
import quotationRoutes from '../src/routes/quotationRoutes';
import pdfQuotationRoutes from '../src/routes/pdfQuotationRoutes';
import orderRoutes from '../src/routes/orderRoutes';
import adminOrderRoutes from '../src/routes/admin/orderRoutes';
import adminSettingRoutes from '../src/routes/admin/settingRoutes';
import adminSystemRoutes from '../src/routes/admin/systemRoutes';
import cotizadorRoutes from '../src/routes/cotizadorRoutes';
import paymentRoutes from '../src/routes/paymentRoutes';
import adminPaymentRoutes from '../src/routes/admin/paymentRoutes';
import uploadRoutes from '../src/routes/admin/uploadRoutes';
import externalApiRoutes from '../src/routes/externalApiRoutes';
import syncRoutes from '../src/routes/syncRoutes';
import clientRoutes from '../src/routes/clientRoutes';
import companySettingsRoutes from '../src/routes/companySettingsRoutes';
import globalSettingsRoutes from '../src/routes/globalSettingsRoutes';
import adminCompanySettingsRoutes from '../src/routes/admin/companySettingsRoutes';
import authRoutes from '../src/routes/authRoutes';
import customerRoutes from '../src/routes/customerRoutes';
import cartRoutes from '../src/routes/cartRoutes';
import compatibilityRoutes from '../src/routes/compatibilityRoutes';
import reviewRoutes from '../src/routes/reviewRoutes';
import wishlistRoutes from '../src/routes/wishlistRoutes';
import couponRoutes from '../src/routes/couponRoutes';
import promoBannerRoutes from '../src/routes/promoBannerRoutes';
import pageRoutes from '../src/routes/pageRoutes';
import adminReviewRoutes from '../src/routes/admin/reviewRoutes';
import adminCouponRoutes from '../src/routes/admin/couponRoutes';
import adminPromoBannerRoutes from '../src/routes/admin/promoBannerRoutes';
import adminPageRoutes from '../src/routes/admin/pageRoutes';
import adminWishlistRoutes from '../src/routes/admin/wishlistRoutes';
import adminAnalyticsRoutes from '../src/routes/admin/analyticsRoutes';
import adminRoleRoutes from '../src/routes/admin/roleRoutes';
import adminDiscountRoutes from '../src/routes/admin/discountRoutes';

type Mount = { prefix: string; router: Router; tag: string };

const mounts: Mount[] = [
  { prefix: '/products', router: productRoutes, tag: 'Products' },
  { prefix: '/brands', router: brandRoutes, tag: 'Brands' },
  { prefix: '/categories', router: categoryRoutes, tag: 'Categories' },
  { prefix: '/laptops', router: laptopRoutes, tag: 'Laptops' },
  { prefix: '/contacts', router: contactRoutes, tag: 'Contacts' },
  { prefix: '/seo', router: seoRoutes, tag: 'SEO' },
  { prefix: '/blog', router: blogRoutes, tag: 'Blog' },
  { prefix: '/quotations', router: quotationRoutes, tag: 'Quotations' },
  { prefix: '/orders', router: orderRoutes, tag: 'Orders' },
  { prefix: '/payments', router: paymentRoutes, tag: 'Payments' },
  { prefix: '/payment', router: paymentRoutes, tag: 'Payments' },
  { prefix: '/cotizador', router: cotizadorRoutes, tag: 'Quoter' },
  { prefix: '/client', router: clientRoutes, tag: 'Clients' },
  { prefix: '/company-settings', router: companySettingsRoutes, tag: 'Settings' },
  { prefix: '/settings', router: globalSettingsRoutes, tag: 'Settings' },
  { prefix: '/auth', router: authRoutes, tag: 'Auth' },
  { prefix: '/customers', router: customerRoutes, tag: 'Customers' },
  { prefix: '/reviews', router: reviewRoutes, tag: 'Reviews' },
  { prefix: '/wishlist', router: wishlistRoutes, tag: 'Wishlist' },
  { prefix: '/coupons', router: couponRoutes, tag: 'Coupons' },
  { prefix: '/compatibility', router: compatibilityRoutes, tag: 'Compatibility' },
  { prefix: '/promo-banners', router: promoBannerRoutes, tag: 'Promotions' },
  { prefix: '/pages', router: pageRoutes, tag: 'Pages' },
  { prefix: '/cart', router: cartRoutes, tag: 'Cart' },
  { prefix: '/external', router: externalApiRoutes, tag: 'External' },
  { prefix: '/sync', router: syncRoutes, tag: 'Sync' },
  { prefix: '/admin', router: adminAuthRoutes, tag: 'Admin Auth' },
  { prefix: '/admin/dashboard', router: dashboardRoutes, tag: 'Admin Dashboard' },
  { prefix: '/admin/products', router: adminProductRoutes, tag: 'Admin Products' },
  { prefix: '/admin/categories', router: adminCategoryRoutes, tag: 'Admin Categories' },
  { prefix: '/admin/carousel', router: adminCarouselRoutes, tag: 'Admin Carousel' },
  { prefix: '/admin/images', router: adminImageRoutes, tag: 'Admin Images' },
  { prefix: '/admin/taxonomy', router: adminTaxonomyRoutes, tag: 'Admin Taxonomy' },
  { prefix: '/admin/brands', router: adminBrandRoutes, tag: 'Admin Brands' },
  { prefix: '/admin/customers', router: adminCustomerRoutes, tag: 'Admin Customers' },
  { prefix: '/admin/upload', router: uploadRoutes, tag: 'Admin Upload' },
  { prefix: '/admin/orders', router: adminOrderRoutes, tag: 'Admin Orders' },
  { prefix: '/admin/payments', router: adminPaymentRoutes, tag: 'Admin Payments' },
  { prefix: '/admin/settings', router: adminSettingRoutes, tag: 'Admin Settings' },
  { prefix: '/admin/company-settings', router: adminCompanySettingsRoutes, tag: 'Admin Settings' },
  { prefix: '/admin/reviews', router: adminReviewRoutes, tag: 'Admin Reviews' },
  { prefix: '/admin/coupons', router: adminCouponRoutes, tag: 'Admin Coupons' },
  { prefix: '/admin/promo-banners', router: adminPromoBannerRoutes, tag: 'Admin Promotions' },
  { prefix: '/admin/pages', router: adminPageRoutes, tag: 'Admin Pages' },
  { prefix: '/admin/wishlists', router: adminWishlistRoutes, tag: 'Admin Wishlist' },
  { prefix: '/admin/analytics', router: adminAnalyticsRoutes, tag: 'Admin Analytics' },
  { prefix: '/admin/system', router: adminSystemRoutes, tag: 'Admin System' },
  { prefix: '/admin', router: adminRoleRoutes, tag: 'Admin Roles' },
  { prefix: '/admin/discounts', router: adminDiscountRoutes, tag: 'Admin Discounts' },
];

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const toOpenApiPath = (p: string) => p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
const normalize = (prefix: string, routePath: string) => {
  const full = `${prefix}${routePath === '/' ? '' : routePath}`.replace(/\/+$/, '');
  return toOpenApiPath(full) || '/';
};

const paths: Record<string, Record<string, unknown>> = {};
const nested: string[] = [];

for (const mount of mounts) {
  const stack: any[] = (mount.router as any).stack ?? [];
  for (const layer of stack) {
    if (layer.route) {
      const routePath = normalize(mount.prefix, layer.route.path);
      const params = [...routePath.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]);
      for (const method of METHODS) {
        if (!layer.route.methods[method]) continue;
        const pathItem = (paths[routePath] ??= {});
        pathItem[method] = {
          tags: [mount.tag],
          summary: `${method.toUpperCase()} ${routePath}`,
          operationId: `${method}${routePath.replace(/[^A-Za-z0-9]+/g, '_')}`,
          ...(params.length
            ? { parameters: params.map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } })) }
            : {}),
          ...(method === 'post' || method === 'put' || method === 'patch'
            ? { requestBody: { required: false, content: { 'application/json': { schema: { type: 'object' } } } } }
            : {}),
          responses: {
            '200': { description: 'Successful response' },
            '400': { description: 'Invalid input' },
            ...(mount.prefix.startsWith('/admin')
              ? { '401': { description: 'Missing or invalid admin token' } }
              : {}),
            '500': { description: 'Unexpected server error' },
          },
          ...(mount.prefix.startsWith('/admin') ? { security: [{ bearerAuth: [] }] } : {}),
        };
      }
    } else if (layer.handle?.stack) {
      nested.push(`${mount.prefix} (${layer.name})`);
    }
  }
}

const sorted: Record<string, Record<string, unknown>> = {};
for (const p of Object.keys(paths).sort()) sorted[p] = paths[p]!;

const out = path.join(__dirname, '../src/config/openapi.paths.json');
fs.writeFileSync(out, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`paths=${Object.keys(sorted).length} operations=${Object.values(sorted).reduce((n, o) => n + Object.keys(o).length, 0)}`);
if (nested.length) console.log('nested routers (not expanded):', nested.join(', '));
