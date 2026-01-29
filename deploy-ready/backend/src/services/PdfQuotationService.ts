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

    // --- HELPER FUNCTION: Number to Words (Spanish) ---
    const numberToWords = (num: number): string => {
      const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
      const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
      const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

      const convertGroup = (n: number): string => {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';

        let str = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (c > 0) str += centenas[c] + ' ';

        if (d === 1) {
          if (u === 0) str += 'DIEZ';
          else if (u === 1) str += 'ONCE';
          else if (u === 2) str += 'DOCE';
          else if (u === 3) str += 'TRECE';
          else if (u === 4) str += 'CATORCE';
          else if (u === 5) str += 'QUINCE';
          else str += 'DIECI' + unidades[u];
        } else if (d > 1) {
          str += decenas[d];
          if (u > 0) str += ' Y ' + unidades[u];
        } else {
          if (u > 0) str += unidades[u];
        }
        return str.trim();
      };

      const integerPart = Math.floor(num);
      const decimalPart = Math.round((num - integerPart) * 100);

      let output = '';
      if (integerPart === 0) output = 'CERO';
      else if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000);
        const remainder = integerPart % 1000;
        if (thousands === 1) output += 'MIL ';
        else output += convertGroup(thousands) + ' MIL ';
        if (remainder > 0) output += convertGroup(remainder);
      } else {
        output += convertGroup(integerPart);
      }

      return `${output} CON ${decimalPart.toString().padStart(2, '0')}/100 SOLES`;
    };

    // --- HEADER ---

    // Logo (Simulated or Placeholder) - Left
    // doc.addImage(...) if we had one. For now, we leave the space or draw a box.
    doc.setFillColor(200, 200, 200);
    // doc.rect(10, 10, 25, 25, 'F'); // Placeholder for logo
    doc.setFontSize(30);
    doc.setTextColor(200, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('P', 15, 28); // "P" Logo placeholder

    // Company Info - Center
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERUANA DE INFORMATICA SAC', 40, 15);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const startXHeader = 40;
    doc.text('Direccion : CAL.OCTAVIO MUÑOZ NAJAR NRO. 223B URB. CERCADO', startXHeader, 20);
    doc.text('Sucursal  : CALLE OCTAVIO MUÑOZ NAJAR N°223-B', startXHeader, 24);
    doc.text('Visite    : www.peruanadeinformatica.com.pe', startXHeader, 28);
    doc.text('Email     : ventas@peruanadeinformatica.com.pe', startXHeader, 32);
    doc.text('Telefonos : Cel. 973822146', startXHeader, 36);

    // RUC Box - Right
    doc.setDrawColor(200, 200, 200);
    doc.rect(130, 8, 70, 28); // Box Frame

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RUC 20454836066', 165, 14, { align: 'center' });

    doc.setFillColor(240, 240, 240); // Optional background for title
    doc.rect(130, 16, 70, 8, 'F'); // Background strip
    doc.setTextColor(0, 0, 0);
    doc.text('COTIZACION', 165, 21, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`${quotation.code}`, 165, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Cod. 131977', 165, 34, { align: 'center' });


    // --- CLIENT INFO ---
    const clientY = 45;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Señor(es) :', 10, clientY);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.client_name || '-', 30, clientY);

    doc.setFont('helvetica', 'bold');
    doc.text('Dirección :', 10, clientY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.client_address || '-', 30, clientY + 5);

    // Row with multiple fields
    const rowY = clientY + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('RUC :', 10, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.client_ruc || '-', 20, rowY);

    doc.setFont('helvetica', 'bold');
    doc.text('Forma de pago :', 50, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text('Contado', 75, rowY); // Hardcoded as per sample, or dynamic if available

    doc.setFont('helvetica', 'bold');
    doc.text('Validez :', 110, rowY);
    doc.setFont('helvetica', 'normal');
    // Calculate validity days approx or hardcode
    const days = Math.ceil((new Date(quotation.valid_until).getTime() - new Date(quotation.created_at).getTime()) / (1000 * 3600 * 24));
    doc.text(`${days} día(s)`, 125, rowY);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Emision :', 145, rowY);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(quotation.created_at).toLocaleString('es-PE', { hour12: false });
    doc.text(dateStr, 168, rowY);


    // --- TABLE ---
    const tableY = rowY + 5;

    autoTable(doc, {
      startY: tableY,
      head: [['CANTIDAD', 'UND', 'CODIGO', 'DESCRIPCIÓN', 'P. UNITARIO', 'TOTAL']],
      body: quotation.items.map((item: any) => {
        // Format description possibly with specs
        let description = item.product_name || item.product?.name || 'Producto desconocido';
        // Clean description needed?

        return [
          item.quantity.toFixed(3), // 1.000
          'UND', // Hardcoded unit
          item.product?.codigo_interno || item.product?.cod_producto || '-',
          description,
          (Number(item.product_price) || 0).toFixed(2),
          (Number(item.subtotal) || 0).toFixed(2)
        ];
      }),
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [220, 220, 220], // Light gray
        textColor: 0, // Black text
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // Cantidad
        1: { halign: 'center', cellWidth: 10 }, // Und
        2: { halign: 'center', cellWidth: 15 }, // Codigo
        3: { halign: 'left' }, // Descripcion (Auto width)
        4: { halign: 'right', cellWidth: 20 }, // Unitario
        5: { halign: 'right', cellWidth: 20 }  // Total
      },
      theme: 'plain' // Removes default striping, we want simple borders
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;


    // --- FOOTER & TOTALS ---

    // Amount in words
    const totalAmount = typeof quotation.total === 'string' ? parseFloat(quotation.total) : quotation.total;
    const amountText = numberToWords(totalAmount);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`SON: ${amountText}`, 10, finalY);

    const boxY = finalY + 5;

    // Totals Box (Right)
    const totalsX = 140;
    const totalsWidth = 60;
    const totalsLineH = 5;

    // Calculate totals
    const opGravada = totalAmount / 1.18;
    const igv = totalAmount - opGravada;

    doc.setDrawColor(200, 200, 200);
    // doc.rect(totalsX, boxY, totalsWidth, 20); // Box frame

    doc.text('Op. Gravada', totalsX + 2, boxY + totalsLineH);
    doc.text('S/', totalsX + 35, boxY + totalsLineH);
    doc.text(opGravada.toFixed(2), 195, boxY + totalsLineH, { align: 'right' });

    doc.text('IGV (18%)', totalsX + 2, boxY + totalsLineH * 2);
    doc.text('S/', totalsX + 35, boxY + totalsLineH * 2);
    doc.text(igv.toFixed(2), 195, boxY + totalsLineH * 2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('Importe Total', totalsX + 2, boxY + totalsLineH * 3);
    doc.text('S/', totalsX + 35, boxY + totalsLineH * 3);
    doc.text(totalAmount.toFixed(2), 195, boxY + totalsLineH * 3, { align: 'right' });


    // Notes / Conditions (Left)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CONDICIONES DE VENTA: IGV Incluido - Sin otro Particular, quedamos de ustedes', 10, boxY + 20);

    // Sales Assitant
    doc.setFontSize(8);
    doc.text('VENDEDOR(A): SISTEMA WEB', 130, boxY + 30);
    doc.setFontSize(7);
    doc.text('Observacion: Sujeta a variación de precios', 130, boxY + 34);

    return Buffer.from(doc.output('arraybuffer'));
  }
}