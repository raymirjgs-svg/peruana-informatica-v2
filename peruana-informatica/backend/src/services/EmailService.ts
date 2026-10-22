import nodemailer from 'nodemailer';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { emailTemplates } from '../utils/emailTemplates';

export interface EmailOrderItem {
    product_name: string;
    quantity: number;
    price: string | number;
}

export interface EmailOrder {
    id: number;
    customer_email: string;
    customer_name?: string;
    invoice_type?: string;
    invoice_number?: string;
}

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendOrderConfirmationToClient(order: EmailOrder, items: EmailOrderItem[]) {
        const html = emailTemplates.orderConfirmation(order, items);

        await this.transporter.sendMail({
            from: `"Peruana Informática" <${process.env.SMTP_USER}>`,
            to: order.customer_email,
            subject: `Pedido #${order.id} - Confirmación de Recepción`,
            html: html
        });
    }

    async sendNewOrderNotificationToAdmin(order: EmailOrder, items: EmailOrderItem[]) {
        const itemsList = items.map(item =>
            `- ${item.product_name} (x${item.quantity}) - S/ ${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}`
        ).join('\n');

        const html = emailTemplates.adminNotification(order, itemsList);

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

        await this.transporter.sendMail({
            from: `"Sistema Peruana Informática" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `🔔 Nuevo Pedido #${order.id} - ${order.customer_name}`,
            html: html
        });
    }

    async sendPaymentVerifiedToClient(order: EmailOrder) {
        const html = emailTemplates.paymentVerified(order);

        await this.transporter.sendMail({
            from: `"Peruana Informática" <${process.env.SMTP_USER}>`,
            to: order.customer_email,
            subject: `Pedido #${order.id} - Pago Verificado ✅`,
            html: html
        });
    }

    async sendInvoiceToClient(order: EmailOrder, invoiceFilename: string) {
        const fs = require('fs');
        const path = require('path');
        const invoicePath = path.join(__dirname, '../../uploads/invoices', invoiceFilename);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>body { font-family: sans-serif; }</style>
            </head>
            <body>
                <h1>📄 Tu ${order.invoice_type === 'factura' ? 'Factura' : 'Boleta'}</h1>
                <p>Adjunto encontrarás tu comprobante.</p>
            </body>
            </html>
        `;

        await this.transporter.sendMail({
            from: `"Peruana Informática" <${process.env.SMTP_USER}>`,
            to: order.customer_email,
            subject: `${order.invoice_type === 'factura' ? 'Factura' : 'Boleta'} #${order.invoice_number} - Pedido #${order.id}`,
            html: html,
            attachments: [{
                filename: invoiceFilename,
                path: invoicePath
            }]
        });
    }

    async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
        await this.transporter.sendMail({
            from: `"Peruana Informática" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
    }
}

export const emailService = new EmailService();
export default emailService;
