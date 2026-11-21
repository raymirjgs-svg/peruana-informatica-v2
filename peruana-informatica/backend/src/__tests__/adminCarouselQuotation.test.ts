import express from 'express';
import request from 'supertest';

jest.mock('../models/Carousel', () => ({
  Carousel: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../models/Quotation', () => ({
  Quotation: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}));

const mockUpdateQuotationStatus = jest.fn();

jest.mock('../services/QuotationService', () => ({
  QuotationService: jest.fn().mockImplementation(() => ({
    updateQuotationStatus: mockUpdateQuotationStatus,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Carousel } = require('../models/Carousel');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const carouselRoutes = require('../routes/admin/carouselRoutes').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { QuotationService } = require('../services/QuotationService');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { updateQuotationStatus } = require('../controllers/QuotationController');

describe('Rutas admin: carrusel y estado de cotización', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin/carousel', carouselRoutes);
    app.put('/api/quotations/:id/status', updateQuotationStatus);
  });

  beforeEach(() => jest.clearAllMocks());

  it('reordena slides: /reorder no debe capturarse como un id', async () => {
    (Carousel.update as jest.Mock).mockResolvedValue([1]);

    const res = await request(app)
      .put('/api/admin/carousel/reorder')
      .send({ slides: [{ id: 3, order: 0 }, { id: 5, order: 1 }] })
      .expect(200);

    expect(res.body.message).toMatch(/orden actualizado/i);
    expect(Carousel.update).toHaveBeenCalledTimes(2);
  });

  it('rechaza un reorder sin slides', async () => {
    await request(app).put('/api/admin/carousel/reorder').send({}).expect(400);
  });

  it('sigue validando el id numérico en PUT /:id', async () => {
    await request(app).put('/api/admin/carousel/abc').send({ title: 'x' }).expect(400);
  });

  it('devuelve 404 al cambiar el estado de una cotización inexistente', async () => {
    mockUpdateQuotationStatus.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/quotations/999/status')
      .send({ status: 'sent' })
      .expect(404);

    expect(res.body.error).toMatch(/no encontrada/i);
  });

  it('confirma el cambio de estado cuando la cotización existe', async () => {
    mockUpdateQuotationStatus.mockResolvedValue({ id: 1, status: 'sent' });

    const res = await request(app)
      .put('/api/quotations/1/status')
      .send({ status: 'sent' })
      .expect(200);

    expect(res.body.quotation.status).toBe('sent');
  });
});
