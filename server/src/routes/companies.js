import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.email) where.email = req.query.email;
  if (req.query.id) where.id = req.query.id;
  const list = await prisma.company.findMany({ where, orderBy: { created_at: 'desc' } });
  res.json(list);
});

router.get('/:id', requireAuth, async (req, res) => {
  const c = await prisma.company.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const updated = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.post('/', requireAdmin, async (req, res) => {
  const created = await prisma.company.create({ data: req.body });
  res.json(created);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.company.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
