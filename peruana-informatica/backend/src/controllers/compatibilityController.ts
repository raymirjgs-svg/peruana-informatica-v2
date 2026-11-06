import { Request, Response } from 'express';
import { compatibilityService } from '../services/CompatibilityService';

/**
 * Get compatible products based on current selection
 * POST /api/compatibility/filter
 */
export const filterCompatibleProducts = async (req: Request, res: Response) => {
    try {
        const { targetComponentType, selectedProducts } = req.body;

        if (!targetComponentType) {
            return res.status(400).json({
                success: false,
                message: 'targetComponentType is required'
            });
        }

        const result = await compatibilityService.getCompatibleProducts(
            targetComponentType,
            selectedProducts || []
        );

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in filterCompatibleProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al filtrar productos compatibles'
        });
    }
};

/**
 * Validate complete PC build
 * POST /api/compatibility/validate
 */
export const validateBuild = async (req: Request, res: Response) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            return res.status(400).json({
                success: false,
                message: 'productIds array is required'
            });
        }

        const result = await compatibilityService.validateBuild(productIds);

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in validateBuild:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al validar build'
        });
    }
};

/**
 * Get attributes by component type
 * GET /api/compatibility/attributes/:componentType
 */
export const getAttributesByComponentType = async (req: Request, res: Response) => {
    try {
        const { componentType } = req.params;

        if (!componentType) {
            return res.status(400).json({
                success: false,
                message: 'componentType parameter is required'
            });
        }

        const attributes = await compatibilityService.getAttributesByComponentType(componentType);

        return res.json({
            success: true,
            data: attributes
        });

    } catch (error) {
        console.error('Error in getAttributesByComponentType:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener atributos'
        });
    }
};
