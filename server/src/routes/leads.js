import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public: submit a lead from the tap page (Lead Capture Mode).
router.post('/capture/:short_code', async (req, res) => {
  const url = await prisma.url.findUnique({ where: { short_code: req.params.short_code } });
  if (!url) return res.status(404).json({ error: 'URL not found' });

  const { name, email, phone, company, notes } = req.body || {};
  const lead = await prisma.lead.create({
    data: {
      url_id: url.id,
      profile_id: url.active_profile_id,
      company_id: url.company_id,
      name, email, phone, company, notes,
    },
  });
  res.json({ success: true, lead });
});

// Authenticated: list leads for a company.
router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  if (req.query.url_id) where.url_id = req.query.url_id;
  if (req.query.profile_id) where.profile_id = req.query.profile_id;
  const list = await prisma.lead.findMany({ where, orderBy: { captured_at: 'desc' } });
  res.json(list);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
