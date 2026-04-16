import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  if (req.query.action) where.action = req.query.action;
  if (req.query.entity_id) where.entity_id = req.query.entity_id;
  const list = await prisma.auditLog.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: Math.min(parseInt(req.query.limit || '200', 10), 1000),
  });
  res.json(list);
});

export default router;
