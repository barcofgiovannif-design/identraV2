import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, resolveCompanyScope } from '../middleware/auth.js';
import { recordAudit } from '../lib/audit.js';
import { dispatchEvent } from '../lib/webhooks.js';

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

  // Fire webhooks + audit without blocking the response.
  recordAudit(null, {
    company_id: url.company_id,
    action: 'lead.captured',
    entity_type: 'lead',
    entity_id: lead.id,
    metadata: { short_code: url.short_code, email, name },
  });
  dispatchEvent({
    company_id: url.company_id,
    event: 'lead.captured',
    payload: { lead, short_code: url.short_code },
  });

  res.json({ success: true, lead });
});

// Authenticated: list leads scoped to caller's company (or any, for platform staff).
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const scoped = resolveCompanyScope(req);
    const where = {};
    if (scoped) where.company_id = scoped;
    if (req.query.url_id) where.url_id = req.query.url_id;
    if (req.query.profile_id) where.profile_id = req.query.profile_id;
    if (req.query.since) where.captured_at = { gte: new Date(req.query.since) };
    const list = await prisma.lead.findMany({
      where,
      orderBy: { captured_at: 'desc' },
      include: {
        url: { select: { id: true, short_code: true, company_id: true, active_profile: { select: { full_name: true } } } },
      },
    });
    res.json(list);
  } catch (err) { next(err); }
});

// Update status / notes of a lead.
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    const scoped = resolveCompanyScope({ ...req, query: {}, body: { company_id: lead.company_id } });
    if (scoped && scoped !== lead.company_id) return res.status(403).json({ error: 'Forbidden' });
    const { status, notes } = req.body || {};
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
