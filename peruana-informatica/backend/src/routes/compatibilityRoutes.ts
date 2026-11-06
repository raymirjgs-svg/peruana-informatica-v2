import { Router } from 'express';
import {
    filterCompatibleProducts,
    validateBuild,
    getAttributesByComponentType
} from '../controllers/compatibilityController';

const router = Router();

// Filter compatible products based on current selection
router.post('/filter', filterCompatibleProducts);

// Validate complete PC build
router.post('/validate', validateBuild);

// Get attributes by component type
router.get('/attributes/:componentType', getAttributesByComponentType);

export default router;
