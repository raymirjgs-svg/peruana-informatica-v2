import { Router } from 'express';
import { renderMetrics } from '../middleware/metrics';

const router = Router();

router.get('/', (req, res) => {
  const token = process.env.METRICS_TOKEN;

  if (!token || req.header('x-metrics-token') !== token) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(renderMetrics());
});

export default router;
