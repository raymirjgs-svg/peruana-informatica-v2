import { Request, Response } from 'express';
import { Product, ProductBrand } from '../models';

export class FeedController {
  static async googleMerchantFeed(req: Request, res: Response) {
    try {
      const products = await Product.findAll({
        where: { estado: 'activo' },
        include: [{ model: ProductBrand, as: 'productBrand', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
      });

      const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://peruanadeinformatica.com.pe';
      const items = products
        .filter((p: any) => (p.stock ?? 0) > 0)
        .map((p: any) => {
          const price = p.price_web || p.price || 0;
          const image = p.image ? (p.image.startsWith('http') ? p.image : `${siteUrl}/images/products/${p.image}`) : `${siteUrl}/og-image.jpg`;
          const link = `${siteUrl}/products/${p.slug}`;
          const description = (p.short_description || p.description || p.name || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000);
          const title = (p.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `    <item>
      <g:id>${p.cod_producto || p.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${image}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${Number(price).toFixed(2)} PEN</g:price>
      <g:brand>${(p.productBrand?.name || 'Peruana Informática').replace(/&/g, '&amp;')}</g:brand>
      <g:condition>new</g:condition>
    </item>`;
        })
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Peruana Informática - Google Merchant Feed</title>
    <link>${siteUrl}</link>
    <description>Productos activos con stock</description>
${items}
  </channel>
</rss>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (error) {
      res.status(500).send('<?xml version="1.0"?><error>feed_error</error>');
    }
  }
}
