import express from 'express';
import { consultArticle } from '../controllers/ExternalApiController';

const router = express.Router();

// GET /api/external/consultar-articulo/:id
router.get('/consultar-articulo/:id', consultArticle);

export default router;
