import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.company_id) where.company_id = req.query.company_id;
  const list = await prisma.user.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { admin_of: { select: { company_name: true } } },
  });
  // Attach flags useful for admin UI.
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const enriched = list.map((u) => ({
    ...u,
    company_name: u.admin_of?.company_name || null,
    at_risk: !u.last_login_at || (now - new Date(u.last_login_at).getTime()) > THIRTY_DAYS,
  }));
  res.json(enriched);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
