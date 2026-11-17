import path from 'path';

/**
 * Directorio de los comprobantes (boletas/facturas en PDF).
 *
 * Vive dentro de `public/uploads`, que es el volumen persistente `uploads_data`
 * del contenedor: antes se guardaba en `/app/uploads/invoices` (fuera de todo
 * volumen) y los comprobantes se perdian en cada recreacion del contenedor.
 *
 * Se calcula con `process.cwd()` (WORKDIR=/app) para que todos los servicios
 * apunten al mismo lugar sin depender de su profundidad en `dist/`.
 */
export const INVOICE_DIR = path.join(process.cwd(), 'public', 'uploads', 'invoices');

/** Devuelve la ruta segura de un comprobante, o null si el nombre no es valido. */
export const resolveInvoicePath = (filename?: string | null): string | null => {
    if (!filename) return null;
    const safeFilename = path.basename(filename);
    const filepath = path.join(INVOICE_DIR, safeFilename);
    if (!filepath.startsWith(INVOICE_DIR + path.sep)) return null;
    return filepath;
};
