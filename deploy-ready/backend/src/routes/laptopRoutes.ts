import express from 'express';
import * as LaptopController from '../controllers/LaptopController';

const router = express.Router();

// Rutas para laptops con subcategorías
router.get('/', LaptopController.getLaptopsWithSubcategories);
router.get('/subcategories', LaptopController.getLaptopSubcategories);
router.get('/processors', LaptopController.getLaptopProcessors);
router.get('/ram', LaptopController.getLaptopRamOptions);
router.get('/storage', LaptopController.getLaptopStorageOptions);

export default router;