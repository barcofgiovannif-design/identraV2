import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Platform-wide aggregate stats for the super-admin dashboard.
router.get('/stats', requireAdmin, async (req, res) => {
  const windowDays = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)));
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [
    companies,
    profilesTotal,
    activeProfiles,
    urlsTotal,
    urlsActive,
    hardwareTotal,
    leadsWindow,
    leadsTotal,
    tapsWindow,
    purchasesCompleted,
    purchasesWindow,
    tapsByDayRaw,
  ] = await Promise.all([
    prisma.company.findMany({ select: { id: true, company_name: true, status: true, purchased_urls: true, used_urls: true, created_at: true } }),
    prisma.profile.count(),
    prisma.profile.count({ where: { active_url: { is: {} } } }).catch(() => 0),
    prisma.url.count(),
    prisma.url.count({ where: { is_active: true } }),
    prisma.hardwareCard.count(),
    prisma.lead.count({ where: { captured_at: { gte: since } } }),
    prisma.lead.count(),
    prisma.interaction.count({ where: { timestamp: { gte: since } } }),
    prisma.purchase.findMany({
      where: { status: 'completed' },
      select: { amount: true, url_count: true, created_at: true, company_id: true },
    }),
    prisma.purchase.findMany({
      where: { status: 'completed', created_at: { gte: since } },
      select: { amount: true },
    }),
    prisma.interaction.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
      take: 20000,
    }),
  ]);

  const totalRevenue = purchasesCompleted.reduce((s, p) => s + (p.amount || 0), 0);
  const revenueWindow = purchasesWindow.reduce((s, p) => s + (p.amount || 0), 0);

  // Taps per day (for growth chart)
  const byDay = {};
  for (const r of tapsByDayRaw) {
    const k = r.timestamp.toISOString().slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  }
  const tapsByDay = Object.entries(byDay).sort().map(([date, taps]) => ({ date, taps }));

  // Top companies by 3 axes.
  const companyAgg = new Map();
  for (const c of companies) {
    companyAgg.set(c.id, {
      id: c.id, name: c.company_name, status: c.status,
      purchased_urls: c.purchased_urls, used_urls: c.used_urls,
      taps: 0, leads: 0, revenue: 0,
    });
  }

  const [tapsPerCompany, leadsPerCompany] = await Promise.all([
    prisma.interaction.groupBy({
      by: ['url_id'],
      where: { timestamp: { gte: since } },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['company_id'],
      _count: true,
    }),
  ]);
  const urlToCompany = Object.fromEntries(
    (await prisma.url.findMany({ select: { id: true, company_id: true } })).map((u) => [u.id, u.company_id])
  );
  for (const r of tapsPerCompany) {
    const cid = urlToCompany[r.url_id];
    if (!cid || !companyAgg.has(cid)) continue;
    companyAgg.get(cid).taps += r._count;
  }
  for (const r of leadsPerCompany) {
    if (!companyAgg.has(r.company_id)) continue;
    companyAgg.get(r.company_id).leads = r._count;
  }
  for (const p of purchasesCompleted) {
    if (p.company_id && companyAgg.has(p.company_id)) {
      companyAgg.get(p.company_id).revenue += p.amount || 0;
    }
  }

  const ranked = Array.from(companyAgg.values());
  const topBy = (key) => [...ranked].sort((a, b) => b[key] - a[key]).slice(0, 5);

  res.json({
    window_days: windowDays,
    companies: {
      total: companies.length,
      active: companies.filter((c) => c.status === 'active').length,
      suspended: companies.filter((c) => c.status === 'suspended').length,
    },
    profiles: { total: profilesTotal, active: activeProfiles },
    urls: { total: urlsTotal, active: urlsActive, purchased_slots: companies.reduce((s, c) => s + c.purchased_urls, 0), used_slots: companies.reduce((s, c) => s + c.used_urls, 0) },
    hardware: { total: hardwareTotal },
    taps: { window: tapsWindow, by_day: tapsByDay },
    leads: { window: leadsWindow, total: leadsTotal },
    revenue: { total: totalRevenue, window: revenueWindow },
    top_by_taps: topBy('taps'),
    top_by_leads: topBy('leads'),
    top_by_revenue: topBy('revenue'),
  });
});

export default router;
