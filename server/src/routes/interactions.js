import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Aggregated interaction stats for a company (dashboard KPIs).
router.get('/stats', requireAuth, async (req, res) => {
  const { company_id, url_id, since } = req.query;
  if (!company_id && !url_id) return res.status(400).json({ error: 'company_id or url_id required' });

  const urlFilter = url_id
    ? { id: url_id }
    : { company_id };

  const urls = await prisma.url.findMany({ where: urlFilter, select: { id: true } });
  const urlIds = urls.map((u) => u.id);
  if (urlIds.length === 0) {
    return res.json({ total_taps: 0, unique_urls: 0, by_device: {}, by_day: [] });
  }

  const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, byDevice, recent] = await Promise.all([
    prisma.interaction.count({ where: { url_id: { in: urlIds }, timestamp: { gte: sinceDate } } }),
    prisma.interaction.groupBy({
      by: ['device_type'],
      where: { url_id: { in: urlIds }, timestamp: { gte: sinceDate } },
      _count: true,
    }),
    prisma.interaction.findMany({
      where: { url_id: { in: urlIds }, timestamp: { gte: sinceDate } },
      select: { timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 5000,
    }),
  ]);

  const byDay = {};
  for (const r of recent) {
    const k = r.timestamp.toISOString().slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  }
  res.json({
    total_taps: total,
    unique_urls: urlIds.length,
    by_device: Object.fromEntries(byDevice.map((d) => [d.device_type || 'unknown', d._count])),
    by_day: Object.entries(byDay).sort().map(([date, taps]) => ({ date, taps })),
  });
});

// List raw interactions (paginated, admin-style).
router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.url_id) where.url_id = req.query.url_id;
  if (req.query.company_id) {
    const urls = await prisma.url.findMany({ where: { company_id: req.query.company_id }, select: { id: true } });
    where.url_id = { in: urls.map((u) => u.id) };
  }
  const list = await prisma.interaction.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: Math.min(parseInt(req.query.limit || '200', 10), 1000),
  });
  res.json(list);
});

export default router;
