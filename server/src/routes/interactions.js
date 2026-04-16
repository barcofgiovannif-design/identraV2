import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, resolveCompanyScope } from '../middleware/auth.js';

const router = Router();

function windowSince(req) {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Prior equal-length window, for delta comparison.
  const priorSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
  const priorUntil = since;
  return { since, days, priorSince, priorUntil };
}

function pctChange(current, prior) {
  if (prior === 0) return current > 0 ? 1 : 0;
  return (current - prior) / prior;
}

async function getScopedUrls(req) {
  const scoped = resolveCompanyScope(req);
  const where = scoped ? { company_id: scoped } : {};
  return prisma.url.findMany({
    where,
    select: { id: true, short_code: true, company_id: true, active_profile: { select: { id: true, full_name: true } } },
  });
}

// Aggregate stats by URL/member, with prior-period delta per member.
router.get('/by-member', requireAuth, async (req, res, next) => {
  try {
    const { since, days, priorSince, priorUntil } = windowSince(req);
    const urls = await getScopedUrls(req);
    if (urls.length === 0) return res.json({ days, members: [] });
    const urlIds = urls.map((u) => u.id);

    const [curAgg, priorAgg, leadsCur, leadsPrior, lastTap] = await Promise.all([
      prisma.interaction.groupBy({
        by: ['url_id', 'event'],
        where: { url_id: { in: urlIds }, timestamp: { gte: since } },
        _count: true,
      }),
      prisma.interaction.groupBy({
        by: ['url_id', 'event'],
        where: { url_id: { in: urlIds }, timestamp: { gte: priorSince, lt: priorUntil } },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['url_id'],
        where: { url_id: { in: urlIds }, captured_at: { gte: since } },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['url_id'],
        where: { url_id: { in: urlIds }, captured_at: { gte: priorSince, lt: priorUntil } },
        _count: true,
      }),
      prisma.interaction.groupBy({
        by: ['url_id'],
        where: { url_id: { in: urlIds } },
        _max: { timestamp: true },
      }),
    ]);

    const blank = () => ({ views: 0, vcard_downloads: 0, link_clicks: 0, leads: 0 });
    const curCounts = {}; const priCounts = {};
    for (const u of urls) { curCounts[u.id] = { ...blank(), last_tap: null }; priCounts[u.id] = blank(); }
    const applyAgg = (rows, target) => {
      for (const r of rows) {
        const t = target[r.url_id]; if (!t) continue;
        if (r.event === 'view') t.views = r._count;
        else if (r.event === 'vcard_download') t.vcard_downloads = r._count;
        else if (r.event === 'link_click') t.link_clicks = r._count;
      }
    };
    applyAgg(curAgg, curCounts);
    applyAgg(priorAgg, priCounts);
    for (const r of leadsCur) if (curCounts[r.url_id]) curCounts[r.url_id].leads = r._count;
    for (const r of leadsPrior) if (priCounts[r.url_id]) priCounts[r.url_id].leads = r._count;
    for (const r of lastTap) if (curCounts[r.url_id]) curCounts[r.url_id].last_tap = r._max.timestamp;

    const members = urls.map((u) => {
      const c = curCounts[u.id];
      const p = priCounts[u.id];
      const conversion = c.views > 0 ? c.leads / c.views : 0;
      return {
        url_id: u.id,
        short_code: u.short_code,
        name: u.active_profile?.full_name || '(unassigned)',
        profile_id: u.active_profile?.id || null,
        views: c.views,
        vcard_downloads: c.vcard_downloads,
        link_clicks: c.link_clicks,
        leads: c.leads,
        conversion_rate: conversion,
        last_tap: c.last_tap,
        prior: { views: p.views, leads: p.leads },
        deltas: {
          views: pctChange(c.views, p.views),
          leads: pctChange(c.leads, p.leads),
        },
      };
    }).sort((a, b) => b.views - a.views);

    res.json({ days, members });
  } catch (err) { next(err); }
});

// Chronological events for a single URL (drill-down).
router.get('/timeline', requireAuth, async (req, res, next) => {
  try {
    if (!req.query.url_id) return res.status(400).json({ error: 'url_id required' });
    const url = await prisma.url.findUnique({ where: { id: req.query.url_id } });
    if (!url) return res.status(404).json({ error: 'URL not found' });
    // Scoping check: non-platform users must own this URL's company.
    const scoped = resolveCompanyScope({ ...req, query: { ...req.query, company_id: url.company_id }, body: {} });
    if (scoped && scoped !== url.company_id) return res.status(403).json({ error: 'Forbidden' });

    const [events, leads] = await Promise.all([
      prisma.interaction.findMany({
        where: { url_id: url.id },
        orderBy: { timestamp: 'desc' },
        take: Math.min(parseInt(req.query.limit || '100', 10), 500),
      }),
      prisma.lead.findMany({
        where: { url_id: url.id },
        orderBy: { captured_at: 'desc' },
        take: 50,
      }),
    ]);

    const combined = [
      ...events.map((e) => ({ kind: 'event', at: e.timestamp, event: e.event, device: e.device_type, browser: e.browser, os: e.os, geo: [e.geo_city, e.geo_region, e.geo_country].filter(Boolean).join(', ') || null, meta: e.meta })),
      ...leads.map((l) => ({ kind: 'lead', at: l.captured_at, name: l.name, email: l.email, phone: l.phone, company: l.company })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at));

    res.json({ timeline: combined });
  } catch (err) { next(err); }
});

// Geo + device breakdowns.
router.get('/breakdown', requireAuth, async (req, res, next) => {
  try {
    const { since, days } = windowSince(req);
    const urls = await getScopedUrls(req);
    if (urls.length === 0) return res.json({ days, by_country: [], by_city: [], by_device: [], by_browser: [], by_os: [], by_hour: [] });
    const urlIds = urls.map((u) => u.id);

    const [byCountry, byDevice, byBrowser, byOs] = await Promise.all([
      prisma.interaction.groupBy({ by: ['geo_country'], where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' }, _count: true }),
      prisma.interaction.groupBy({ by: ['device_type'], where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' }, _count: true }),
      prisma.interaction.groupBy({ by: ['browser'], where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' }, _count: true }),
      prisma.interaction.groupBy({ by: ['os'], where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' }, _count: true }),
    ]);

    // City and hour breakdowns need manual aggregation (composite / derived).
    const cityRows = await prisma.interaction.findMany({
      where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' },
      select: { geo_country: true, geo_city: true, timestamp: true },
      take: 20000,
    });
    const byCityMap = new Map();
    const byHour = Array(24).fill(0);
    for (const r of cityRows) {
      if (r.geo_city) {
        const key = `${r.geo_city}, ${r.geo_country || ''}`;
        byCityMap.set(key, (byCityMap.get(key) || 0) + 1);
      }
      byHour[new Date(r.timestamp).getHours()]++;
    }

    const sortByCount = (arr) => arr
      .map((r) => ({ key: r[Object.keys(r).find((k) => k !== '_count')] || 'Unknown', count: r._count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      days,
      by_country: sortByCount(byCountry),
      by_city: Array.from(byCityMap, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 20),
      by_device: sortByCount(byDevice),
      by_browser: sortByCount(byBrowser).slice(0, 10),
      by_os: sortByCount(byOs).slice(0, 10),
      by_hour: byHour.map((count, hour) => ({ hour, count })),
    });
  } catch (err) { next(err); }
});

// Conversion funnel: views → vcard downloads → leads (+ link clicks on the side).
// Includes prior-period counts for delta comparison.
router.get('/funnel', requireAuth, async (req, res, next) => {
  try {
    const { since, days, priorSince, priorUntil } = windowSince(req);
    const urls = await getScopedUrls(req);
    if (urls.length === 0) {
      return res.json({
        days, views: 0, vcard_downloads: 0, link_clicks: 0, leads: 0,
        rates: { download_rate: 0, lead_rate: 0 },
        prior: { views: 0, vcard_downloads: 0, link_clicks: 0, leads: 0 },
        deltas: { views: 0, vcard_downloads: 0, link_clicks: 0, leads: 0 },
      });
    }
    const urlIds = urls.map((u) => u.id);

    const [cur, prior, leadsCur, leadsPrior] = await Promise.all([
      prisma.interaction.groupBy({
        by: ['event'],
        where: { url_id: { in: urlIds }, timestamp: { gte: since } },
        _count: true,
      }),
      prisma.interaction.groupBy({
        by: ['event'],
        where: { url_id: { in: urlIds }, timestamp: { gte: priorSince, lt: priorUntil } },
        _count: true,
      }),
      prisma.lead.count({ where: { url_id: { in: urlIds }, captured_at: { gte: since } } }),
      prisma.lead.count({ where: { url_id: { in: urlIds }, captured_at: { gte: priorSince, lt: priorUntil } } }),
    ]);

    const toMap = (rows) => {
      const m = { view: 0, vcard_download: 0, link_click: 0 };
      for (const r of rows) m[r.event] = r._count;
      return m;
    };
    const c = toMap(cur);
    const p = toMap(prior);

    res.json({
      days,
      views: c.view,
      vcard_downloads: c.vcard_download,
      link_clicks: c.link_click,
      leads: leadsCur,
      rates: {
        download_rate: c.view > 0 ? c.vcard_download / c.view : 0,
        lead_rate: c.view > 0 ? leadsCur / c.view : 0,
      },
      prior: { views: p.view, vcard_downloads: p.vcard_download, link_clicks: p.link_click, leads: leadsPrior },
      deltas: {
        views: pctChange(c.view, p.view),
        vcard_downloads: pctChange(c.vcard_download, p.vcard_download),
        link_clicks: pctChange(c.link_click, p.link_click),
        leads: pctChange(leadsCur, leadsPrior),
      },
    });
  } catch (err) { next(err); }
});

// Legacy / lighter stats (kept for the top-of-page AnalyticsPanel).
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { since, days } = windowSince(req);
    const urls = await getScopedUrls(req);
    if (urls.length === 0) return res.json({ days, total_taps: 0, unique_urls: 0, by_device: {}, by_day: [] });
    const urlIds = urls.map((u) => u.id);

    const [total, byDevice, recent] = await Promise.all([
      prisma.interaction.count({ where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' } }),
      prisma.interaction.groupBy({
        by: ['device_type'],
        where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' },
        _count: true,
      }),
      prisma.interaction.findMany({
        where: { url_id: { in: urlIds }, timestamp: { gte: since }, event: 'view' },
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
      days,
    });
  } catch (err) { next(err); }
});

// Raw interactions (paginated) — for debugging / admin.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const scoped = resolveCompanyScope(req);
    const where = {};
    if (req.query.url_id) where.url_id = req.query.url_id;
    else if (scoped) {
      const urls = await prisma.url.findMany({ where: { company_id: scoped }, select: { id: true } });
      where.url_id = { in: urls.map((u) => u.id) };
    }
    const list = await prisma.interaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(req.query.limit || '200', 10), 1000),
    });
    res.json(list);
  } catch (err) { next(err); }
});

export default router;
