import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuotationService } from './QuotationService';

export class PdfQuotationService {
  private quotationService: QuotationService;

  constructor() {
    this.quotationService = new QuotationService();
  }

  async generateQuotationPdf(code: string): Promise<Buffer> {
    const quotation = await this.quotationService.getQuotationByCode(code);

    if (!quotation) {
      throw new Error('Cotización no encontrada');
    }

    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar colores
    doc.setFillColor(239, 246, 255); // Fondo azul claro para cabecera

    // Título del documento
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN', 105, 20, { align: 'center' });

    // Información de la empresa (en rectángulo destacado)
    doc.setDrawColor(0, 64, 128); // Azul oscuro
    doc.setFillColor(239, 246, 255); // Azul muy claro
    doc.rect(15, 25, 180, 40, 'F'); // Rellenar rectángulo
    doc.line(15, 25, 195, 25); // Borde superior
    doc.line(15, 65, 195, 65); // Borde inferior
    doc.line(15, 25, 15, 65); // Borde izquierdo
    doc.line(195, 25, 195, 65); // Borde derecho

    doc.setFontSize(10);
    doc.setTextColor(0, 64, 128); // Azul oscuro
    doc.setFont('helvetica', 'normal');
    doc.text('Peruana Informática', 20, 35);
    doc.text('RUC: 20123456789', 20, 40);
    doc.text('Av. Ejemplo 123, Lima', 20, 45);
    doc.text('Teléfono: (01) 123-4567', 20, 50);
    doc.text('Email: info@peruana-informatica.com', 20, 55);
    doc.text(`Código: ${quotation.code}`, 150, 35);
    doc.text(`Fecha: ${new Date(quotation.created_at).toLocaleDateString()}`, 150, 40);
    doc.text(`Válido hasta: ${new Date(quotation.valid_until).toLocaleDateString()}`, 150, 45);

    // Línea divisoria
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255); // Blanco
    doc.line(20, 70, 190, 70);

    // Información del cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 64, 128); // Azul oscuro
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text(`Nombre: ${quotation.client_name}`, 20, 88);
    doc.text(`Email: ${quotation.client_email}`, 20, 93);
    if (quotation.client_phone) doc.text(`Teléfono: ${quotation.client_phone}`, 20, 98);
    if (quotation.client_company) doc.text(`Empresa: ${quotation.client_company}`, 20, 103);
    if (quotation.client_ruc) doc.text(`RUC: ${quotation.client_ruc}`, 20, 108);
    if (quotation.client_address) doc.text(`Dirección: ${quotation.client_address}`, 20, 113);

    // Cabecera de tabla de productos
    doc.setFontSize(12);
    doc.setTextColor(0, 64, 128); // Azul oscuro
    doc.text('DETALLE DE PRODUCTOS', 20, 125);

    // Tabla de productos
    const startY = 130;
    autoTable(doc, {
      head: [['PRODUCTO', 'CANT.', 'PRECIO UNITARIO', 'SUBTOTAL']],
      body: quotation.items.map((item: any) => [
        item.product_name || item.product?.name || 'Producto desconocido',
        String(item.quantity),
        `S/. ${(typeof item.product_price === 'string' ? parseFloat(item.product_price) : item.product_price).toFixed(2)}`,
        `S/. ${(typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal).toFixed(2)}`
      ]),
      startY: startY,
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [0, 64, 128], // Azul oscuro
        textColor: 255,
        fontSize: 9
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: 0
      }
    });

    // Calcular la posición final de la tabla
    const finalY = (doc as any).lastAutoTable.finalY || startY;

    // Subtotales y totales
    const subtotal = typeof quotation.subtotal === 'string' ? parseFloat(quotation.subtotal) : quotation.subtotal;
    const igv = typeof quotation.igv === 'string' ? parseFloat(quotation.igv) : quotation.igv;
    const total = typeof quotation.total === 'string' ? parseFloat(quotation.total) : quotation.total;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Negro
    doc.text(`Subtotal: S/. ${subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`IGV (18%): S/. ${igv.toFixed(2)}`, 140, finalY + 15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/. ${total.toFixed(2)}`, 140, finalY + 25);

    // Notas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 64, 128); // Azul oscuro
    doc.text('NOTAS:', 20, finalY + 40);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text('• La cotización tiene una vigencia de 7 días hábiles.', 20, finalY + 45);
    doc.text('• Precios sujetos a cambio sin previo aviso.', 20, finalY + 50);
    doc.text('• Los productos se entregarán previo pago.', 20, finalY + 55);

    // Pie de página
    doc.setDrawColor(0, 64, 128); // Azul oscuro
    doc.line(20, 275, 190, 275);
    doc.setFontSize(8);
    doc.setTextColor(0, 64, 128); // Azul oscuro
    doc.text('Gracias por su preferencia', 105, 280, { align: 'center' });
    doc.text('Peruana Informática © 2025', 105, 285, { align: 'center' });

    // Devolver el PDF como buffer
    return Buffer.from(doc.output('arraybuffer'));
  }
}