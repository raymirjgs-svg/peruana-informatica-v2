/**
 * Regla de exposición de stock en las respuestas publicas.
 *
 * Cuando el stock real supera STOCK_DISPLAY_LIMIT unidades no se publica la
 * cantidad exacta: se devuelve el tope y una etiqueta "10+". El stock real
 * sigue intacto en la base de datos y se valida en el servidor al crear el
 * pedido (ver OrderController).
 */
export const STOCK_DISPLAY_LIMIT = 10;

type WithStock = { stock?: number | string | null };

/**
 * Aplica la mascara de stock a un producto (modelo Sequelize u objeto plano).
 */
export function maskStock<T extends WithStock>(
  product: T
): T & { stock: number; stock_display: string } {
  const plain =
    typeof (product as unknown as { get?: (opts: { plain: true }) => object }).get === 'function'
      ? (product as unknown as { get: (opts: { plain: true }) => object }).get({ plain: true })
      : { ...(product as object) };

  const stock = Number((plain as WithStock).stock) || 0;
  const capped = stock > STOCK_DISPLAY_LIMIT ? STOCK_DISPLAY_LIMIT : stock;

  return {
    ...(plain as object),
    stock: capped,
    stock_display: stock > STOCK_DISPLAY_LIMIT ? `${STOCK_DISPLAY_LIMIT}+` : String(stock),
  } as T & { stock: number; stock_display: string };
}
