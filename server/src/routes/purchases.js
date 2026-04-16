import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.customer_email) where.customer_email = req.query.customer_email;
  if (req.query.stripe_session_id) where.stripe_session_id = req.query.stripe_session_id;
  if (req.query.company_id) where.company_id = req.query.company_id;
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const list = await prisma.purchase.findMany({ where, orderBy: { created_at: order } });
  res.json(list);
});

router.get('/all', requireAdmin, async (_req, res) => {
  const list = await prisma.purchase.findMany({ orderBy: { created_at: 'desc' } });
  res.json(list);
});

export default router;
