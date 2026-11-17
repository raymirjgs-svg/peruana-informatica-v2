import { Router } from 'express';
import { FeedController } from '../controllers/FeedController';

const router = Router();

router.get('/google-merchant.xml', FeedController.googleMerchantFeed);

export default router;
