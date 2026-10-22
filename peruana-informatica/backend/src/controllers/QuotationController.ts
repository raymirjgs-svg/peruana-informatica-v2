import { Request, Response } from 'express';
import { QuotationService } from '../services/QuotationService';
import { compatibilityService } from '../services/CompatibilityService';
import { sendError } from '../middleware/errorHandler';

const quotationService = new QuotationService();

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const quotationData = {
      client_name: req.body.client_name,
      client_email: req.body.client_email,
      client_phone: req.body.client_phone,
      client_company: req.body.client_company,
      client_ruc: req.body.client_ruc,
      client_address: req.body.client_address,
      items: req.body.items,
      valid_until: new Date(req.body.valid_until),
    };

    const quotation = await quotationService.createQuotation(quotationData);
    res.status(201).json({
      message: 'Cotización creada exitosamente',
      code: quotation.code,
      total: quotation.total,
    });
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

export const getQuotationByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Código de cotización es requerido'
      });
    }

    const quotation = await quotationService.getQuotationByCode(code);

    if (!quotation) {
      return res.status(404).json({
        error: 'Cotización no encontrada'
      });
    }

    // Verificar si la cotización es válida
    const validation = await quotationService.validateQuotation(code);

    res.json({
      ...quotation.toJSON(),
      isValid: validation.isValid,
      validationMessage: validation.message
    });
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

export const getAllQuotations = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await quotationService.getAllQuotations(status, page, limit);

    res.json(result);
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'ID de cotización es requerido'
      });
    }

    const quotation = await quotationService.getQuotationById(parseInt(id));

    if (!quotation) {
      return res.status(404).json({
        error: 'Cotización no encontrada'
      });
    }

    res.json(quotation);
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

export const updateQuotationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'ID de cotización es requerido'
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Estado de cotización es requerido'
      });
    }

    const quotation = await quotationService.updateQuotationStatus(parseInt(id), status as any);

    res.json({
      message: 'Estado de cotización actualizado exitosamente',
      quotation,
    });
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

export const validateQuotation = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Código de cotización es requerido'
      });
    }

    const validation = await quotationService.validateQuotation(code);

    res.json(validation);
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

// Deprecated - usar /api/compatibility/filter en su lugar
export const getCompatibleComponents = async (req: Request, res: Response) => {
  try {
    return res.status(410).json({
      error: 'Endpoint deprecated',
      message: 'Usar /api/compatibility/filter en su lugar'
    });
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};

// Deprecated - usar /api/compatibility/validate en su lugar
export const checkCompatibility = async (req: Request, res: Response) => {
  try {
    return res.status(410).json({
      error: 'Endpoint deprecated',
      message: 'Usar /api/compatibility/validate en su lugar'
    });
  } catch (error) {
    return sendError(res, error, 'Error interno');
  }
};