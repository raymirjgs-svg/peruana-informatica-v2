import { maskStock, STOCK_DISPLAY_LIMIT } from '../utils/stockDisplay';

describe('Mascara de stock publico', () => {
  it('no publica el stock exacto cuando supera el limite', () => {
    const result = maskStock({ name: 'DISCO 240GB', stock: 223 });

    expect(result.stock).toBe(STOCK_DISPLAY_LIMIT);
    expect(result.stock_display).toBe('10+');
    expect(result.name).toBe('DISCO 240GB');
  });

  it('muestra el valor exacto cuando el stock es igual al limite', () => {
    const result = maskStock({ stock: 10 });

    expect(result.stock).toBe(10);
    expect(result.stock_display).toBe('10');
  });

  it('muestra el valor exacto cuando el stock es menor al limite', () => {
    const result = maskStock({ stock: 3 });

    expect(result.stock).toBe(3);
    expect(result.stock_display).toBe('3');
  });

  it('acepta stock como texto y sin stock', () => {
    expect(maskStock({ stock: '42' }).stock_display).toBe('10+');
    expect(maskStock({ stock: null }).stock_display).toBe('0');
    expect(maskStock({}).stock).toBe(0);
  });

  it('enmascara tambien modelos Sequelize (get({ plain: true }))', () => {
    const model = {
      get: () => ({ name: 'DISCO 240GB', stock: 223 }),
    };

    const result = maskStock(model as unknown as { stock: number });

    expect(result.stock).toBe(10);
    expect(result.stock_display).toBe('10+');
    expect(result.name).toBe('DISCO 240GB');
  });
});
