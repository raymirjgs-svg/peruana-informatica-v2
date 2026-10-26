import type { Request, Response } from 'express';
import { FeedController } from '../../controllers/FeedController';
import { Product } from '../../models/Product';

jest.mock('../../models/Product');

const mockRes = () => {
  const res: Partial<Response> = {};
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockReq = () => ({ method: 'GET', url: '/feed/google-merchant.xml' } as Request);

describe('FeedController.googleMerchantFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only includes active products with stock greater than zero', async () => {
    (Product.findAll as jest.Mock).mockResolvedValue([
      {
        id: 1,
        cod_producto: 'SKU-1',
        name: 'Laptop Gamer',
        slug: 'laptop-gamer',
        price_web: 4500,
        price: 5000,
        stock: 3,
        image: 'laptop.jpg',
        short_description: 'Una laptop potente',
        productBrand: { name: 'Asus' },
      },
      {
        id: 2,
        cod_producto: 'SKU-2',
        name: 'Mouse',
        slug: 'mouse',
        price: 50,
        stock: 0,
        image: 'mouse.jpg',
      },
    ]);

    const res = mockRes();
    await FeedController.googleMerchantFeed(mockReq(), res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/xml; charset=utf-8');
    const xml = (res.send as jest.Mock).mock.calls[0][0] as string;
    expect(xml).toContain('SKU-1');
    expect(xml).not.toContain('SKU-2');
    expect(xml).toContain('4500.00 PEN');
    expect(xml).toContain('in stock');
  });

  it('escapes special characters in the title', async () => {
    (Product.findAll as jest.Mock).mockResolvedValue([
      {
        id: 1,
        cod_producto: 'SKU-3',
        name: 'Monitor <4K> & HDR',
        slug: 'monitor',
        price: 1200,
        stock: 5,
        image: 'https://cdn.example.com/monitor.png',
      },
    ]);

    const res = mockRes();
    await FeedController.googleMerchantFeed(mockReq(), res);

    const xml = (res.send as jest.Mock).mock.calls[0][0] as string;
    expect(xml).toContain('Monitor &lt;4K&gt; &amp; HDR');
    expect(xml).toContain('https://cdn.example.com/monitor.png');
  });

  it('returns 500 with an xml error body when the query fails', async () => {
    (Product.findAll as jest.Mock).mockRejectedValue(new Error('db down'));

    const res = mockRes();
    await FeedController.googleMerchantFeed(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect((res.send as jest.Mock).mock.calls[0][0]).toContain('<error>feed_error</error>');
  });
});
