import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  if (req.query.url_id) where.url_id = req.query.url_id;
  if (req.query.status) where.status = req.query.status;
  const list = await prisma.hardwareCard.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { url: true },
  });
  res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
  const { company_id, url_id, nfc_uid, batch_number, status } = req.body || {};
  if (!company_id) return res.status(400).json({ error: 'company_id required' });
  const card = await prisma.hardwareCard.create({
    data: { company_id, url_id: url_id || null, nfc_uid: nfc_uid || null, batch_number, status: status || 'inventory' },
  });
  res.json(card);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await prisma.hardwareCard.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.hardwareCard.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
