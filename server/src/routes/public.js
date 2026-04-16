import { Router } from 'express';
import { prisma } from '../db.js';
import { enrichFromRequest } from '../lib/enrich.js';

const router = Router();

// Public: fetch a URL's active profile by short_code (= permanent_slug).
router.get('/cards/:slug', async (req, res) => {
  const url = await prisma.url.findUnique({
    where: { short_code: req.params.slug },
    include: { active_profile: true, company: true },
  });
  if (!url || !url.is_active) return res.status(404).json({ error: 'Card not found' });

  // Also log a "view" interaction so direct visits count too (not only /r/).
  prisma.interaction.create({
    data: { url_id: url.id, event: 'view', ...enrichFromRequest(req) },
  }).catch(() => {});

  const profile = url.active_profile;
  const card = profile ? {
    id: url.id,
    permanent_slug: url.short_code,
    full_name: profile.full_name,
    title: profile.title,
    company_name: profile.company_name,
    phone: profile.phone,
    email: profile.email,
    overview: profile.bio,
    photo_url: profile.photo_url,
    social_links: profile.social_links,
    messaging_links: profile.messaging_links,
    template: profile.template,
    font_style: profile.font_style,
    custom_color: profile.custom_color,
    lead_capture_enabled: profile.lead_capture_enabled,
    status: 'active',
  } : {
    id: url.id,
    permanent_slug: url.short_code,
    full_name: 'Unassigned',
    title: '',
    company_name: url.company?.company_name || '',
    status: 'unassigned',
  };

  res.json({
    card,
    company: url.company ? { logo_url: url.company.logo_url, brand_color: url.company.brand_color } : null,
  });
});

// vCard by URL id (kept backwards-compatible with existing frontend calls).
router.get('/cards/:id/vcard', async (req, res) => {
  // Accept either URL id or short_code for robustness.
  const url = await prisma.url.findFirst({
    where: { OR: [{ id: req.params.id }, { short_code: req.params.id }] },
    include: { active_profile: true },
  });
  if (!url || !url.active_profile) return res.status(404).json({ error: 'Card not found' });

  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  const cardUrl = `${APP_URL}/Card/${url.short_code}`;
  const p = url.active_profile;

  let v = 'BEGIN:VCARD\n';
  v += 'VERSION:3.0\n';
  v += `FN:${p.full_name || ''}\n`;
  if (p.full_name) v += `N:${p.full_name.split(' ').reverse().join(';')};;;\n`;
  if (p.title) v += `TITLE:${p.title}\n`;
  if (p.company_name) v += `ORG:${p.company_name}\n`;
  if (p.email) v += `EMAIL;TYPE=WORK:${p.email}\n`;
  if (p.phone) v += `TEL;TYPE=WORK,VOICE:${p.phone}\n`;
  if (p.bio) v += `NOTE:${p.bio}\n`;
  if (p.social_links?.linkedin) v += `URL;TYPE=LinkedIn:${p.social_links.linkedin}\n`;
  if (p.social_links?.twitter) v += `URL;TYPE=Twitter:${p.social_links.twitter}\n`;
  if (p.social_links?.website) v += `URL;TYPE=Website:${p.social_links.website}\n`;
  v += `URL;TYPE=DigitalCard:${cardUrl}\n`;
  v += 'END:VCARD';

  res.setHeader('Content-Type', 'text/vcard');
  res.setHeader('Content-Disposition', `attachment; filename="${(p.full_name || 'contact').replace(/\s+/g, '-')}.vcf"`);
  res.send(v);
});

// Public event logger used by the card page for vcard_download and link_click.
router.post('/events/:short_code', async (req, res) => {
  const url = await prisma.url.findUnique({ where: { short_code: req.params.short_code } });
  if (!url) return res.status(404).json({ error: 'URL not found' });
  const { event, meta } = req.body || {};
  if (!['vcard_download', 'link_click'].includes(event)) {
    return res.status(400).json({ error: 'Invalid event' });
  }
  await prisma.interaction.create({
    data: {
      url_id: url.id,
      event,
      ...enrichFromRequest(req),
      meta: meta ? meta : undefined,
    },
  });
  res.json({ success: true });
});

export default router;
