import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAudit } from '../lib/audit.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  const list = await prisma.team.findMany({
    where,
    orderBy: { created_at: 'asc' },
    include: { _count: { select: { profiles: true, children: true } } },
  });
  res.json(list.map((t) => ({ ...t, profile_count: t._count.profiles, children_count: t._count.children })));
});

router.get('/:id', requireAuth, async (req, res) => {
  const t = await prisma.team.findUnique({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

router.post('/', requireAuth, async (req, res) => {
  const { company_id, name, parent_team_id } = req.body || {};
  if (!company_id || !name) return res.status(400).json({ error: 'company_id and name required' });
  const t = await prisma.team.create({ data: { company_id, name, parent_team_id: parent_team_id || null } });
  await recordAudit(req, { company_id, action: 'team.created', entity_type: 'team', entity_id: t.id, metadata: { name } });
  res.json(t);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { name, parent_team_id } = req.body || {};
  const t = await prisma.team.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(parent_team_id !== undefined ? { parent_team_id: parent_team_id || null } : {}),
    },
  });
  await recordAudit(req, { company_id: t.company_id, action: 'team.updated', entity_type: 'team', entity_id: t.id });
  res.json(t);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const t = await prisma.team.delete({ where: { id: req.params.id } });
  await recordAudit(req, { company_id: t.company_id, action: 'team.deleted', entity_type: 'team', entity_id: t.id });
  res.json({ success: true });
});

// Assign/remove profiles to/from a team.
router.post('/:id/assign', requireAuth, async (req, res) => {
  const { profile_ids = [] } = req.body || {};
  const updated = await prisma.profile.updateMany({
    where: { id: { in: profile_ids } },
    data: { team_id: req.params.id },
  });
  const t = await prisma.team.findUnique({ where: { id: req.params.id } });
  if (t) await recordAudit(req, { company_id: t.company_id, action: 'team.members_assigned', entity_type: 'team', entity_id: t.id, metadata: { count: updated.count } });
  res.json({ success: true, assigned: updated.count });
});

export default router;
