import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  const list = await prisma.template.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { _count: { select: { profiles: true } } },
  });
  res.json(list.map((t) => ({ ...t, profile_count: t._count.profiles })));
});

router.get('/:id', requireAuth, async (req, res) => {
  const t = await prisma.template.findUnique({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

router.post('/', requireAuth, async (req, res) => {
  const { company_id, name, common_links, locked_fields, design_settings } = req.body || {};
  if (!company_id || !name) return res.status(400).json({ error: 'company_id and name required' });
  const created = await prisma.template.create({
    data: {
      company_id, name,
      common_links: common_links ?? null,
      locked_fields: locked_fields ?? [],
      design_settings: design_settings ?? null,
    },
  });
  res.json(created);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { name, common_links, locked_fields, design_settings } = req.body || {};
  const updated = await prisma.template.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(common_links !== undefined ? { common_links } : {}),
      ...(locked_fields !== undefined ? { locked_fields } : {}),
      ...(design_settings !== undefined ? { design_settings } : {}),
    },
  });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.template.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Assign a template to one or many profiles.
router.post('/:id/apply', requireAuth, async (req, res) => {
  const { profile_ids = [] } = req.body || {};
  if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
    return res.status(400).json({ error: 'profile_ids required' });
  }
  await prisma.profile.updateMany({
    where: { id: { in: profile_ids } },
    data: { template_id: req.params.id },
  });
  res.json({ success: true, applied: profile_ids.length });
});

export default router;
