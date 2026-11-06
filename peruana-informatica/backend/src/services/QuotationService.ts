// src/services/QuotationService.ts
import { Quotation } from '../models/Quotation';
import { QuotationItem } from '../models/QuotationItem';
import { Product } from '../models/Product';
import { Op, Transaction } from 'sequelize';

export interface QuotationItemData {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface QuotationData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  items: QuotationItemData[];
  valid_until: Date;
}

// Definir el tipo extendido para incluir los items
interface QuotationWithItems extends Quotation {
  items?: any[];
}

export class QuotationService {
  async createQuotation(data: QuotationData): Promise<any> {
    const transaction: Transaction = await (Quotation.sequelize as any).transaction();

    try {
      // Calcular totales
      const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
      const igv = subtotal * 0.18; // 18% de IGV
      const total = subtotal + igv;

      // Generar código único
      const code = this.generateQuotationCode();

      // Crear cotización
      const quotation = await Quotation.create({
        code,
        subtotal,
        igv,
        total,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_company: data.client_company,
        client_ruc: data.client_ruc,
        client_address: data.client_address,
        status: 'pending',
        valid_until: data.valid_until,
      }, { transaction });

      // Crear items de cotización
      for (const item of data.items) {
        await QuotationItem.create({
          quotation_id: quotation.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        }, { transaction });
      }

      // Commit la transacción
      await transaction.commit();

      // Ahora retornar la cotización completa sin transacción
      // No usar transacción ya comprometida, acceder directamente a los datos guardados
      const savedQuotation = await Quotation.findByPk(quotation.id, {
        include: [{
          model: QuotationItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'price', 'codigo_interno']
          }]
        }]
      }) as QuotationWithItems;

      // Verificar que la cotización tiene la estructura esperada
      if (!savedQuotation) {
        throw new Error('La cotización no pudo ser recuperada después de ser creada');
      }

      // Asegurar que la estructura de respuesta es correcta
      return {
        id: savedQuotation.id,
        code: savedQuotation.code,
        subtotal: savedQuotation.subtotal,
        igv: savedQuotation.igv,
        total: savedQuotation.total,
        client_name: savedQuotation.client_name,
        client_email: savedQuotation.client_email,
        client_phone: savedQuotation.client_phone,
        client_company: savedQuotation.client_company,
        client_ruc: savedQuotation.client_ruc,
        client_address: savedQuotation.client_address,
        status: savedQuotation.status,
        valid_until: savedQuotation.valid_until,
        created_at: savedQuotation.created_at,
        updated_at: savedQuotation.updated_at,
        items: savedQuotation.items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            codigo_interno: item.product.codigo_interno
          } : undefined
        }))
      };
    } catch (error) {
      // Solo intentar rollback si la transacción aún está activa
      if (transaction && (transaction as any).finished !== 'commit' && (transaction as any).finished !== 'rollback') {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Error during transaction rollback:', rollbackError);
        }
      }
      throw error;
    }
  }

  async getQuotationByCode(code: string): Promise<any | null> {
    return await Quotation.findOne({
      where: { code },
      include: [{
        model: QuotationItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'price', 'codigo_interno']
        }]
      }]
    });
  }

  async getQuotationById(id: number): Promise<any | null> {
    return await Quotation.findByPk(id, {
      include: [{
        model: QuotationItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'price', 'codigo_interno']
        }]
      }]
    });
  }

  async getAllQuotations(status?: string, page: number = 1, limit: number = 10) {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Quotation.findAndCountAll({
      where: whereClause,
      include: [{
        model: QuotationItem,
        as: 'items',
        attributes: ['product_id', 'product_name', 'product_price', 'quantity', 'subtotal']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      quotations: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async updateQuotationStatus(id: number, status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired'): Promise<any | null> {
    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return null;
    }

    quotation.status = status;
    await quotation.save();
    return quotation;
  }

  async validateQuotation(code: string): Promise<{ isValid: boolean; message: string }> {
    const quotation = await this.getQuotationByCode(code);

    if (!quotation) {
      return {
        isValid: false,
        message: 'Cotización no encontrada'
      };
    }

    // Verificar si ha expirado
    const now = new Date();
    const validUntil = new Date(quotation.valid_until);

    if (validUntil < now) {
      // Actualizar estado a expirado si es necesario
      if (quotation.status !== 'expired') {
        quotation.status = 'expired';
        await quotation.save();
      }

      return {
        isValid: false,
        message: 'La cotización ha expirado'
      };
    }

    // Verificar estado actual
    if (quotation.status === 'accepted') {
      return {
        isValid: true,
        message: 'Cotización aceptada'
      };
    } else if (quotation.status === 'rejected') {
      return {
        isValid: false,
        message: 'Cotización rechazada'
      };
    } else if (quotation.status === 'expired') {
      return {
        isValid: false,
        message: 'Cotización expirada'
      };
    }

    return {
      isValid: true,
      message: 'Cotización válida'
    };
  }

  private generateQuotationCode(): string {
    // Generar un código con formato QT-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `QT-${dateStr}-${randomPart}`;
  }
}