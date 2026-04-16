import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const where = {};
  if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
  const list = await prisma.pricingPlan.findMany({ where, orderBy: { sort_order: 'asc' } });
  res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
  const created = await prisma.pricingPlan.create({ data: req.body });
  res.json(created);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await prisma.pricingPlan.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.pricingPlan.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
