import { Router } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateQrPng } from '../lib/qr.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  if (req.query.permanent_slug) where.permanent_slug = req.query.permanent_slug;
  const list = await prisma.digitalCard.findMany({ where, orderBy: { created_at: 'desc' } });
  res.json(list);
});

// createDigitalCard — creates a card + QR and decrements the company slot.
router.post('/', requireAuth, async (req, res) => {
  const { company_id, full_name, title, company_name, phone, email, overview,
          social_links, messaging_links, template, font_style, custom_color } = req.body || {};

  const company = await prisma.company.findUnique({ where: { id: company_id } });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  if (company.used_urls >= company.purchased_urls) {
    return res.status(400).json({ error: 'No available URL slots. Upgrade your plan.' });
  }

  const slug = nanoid(10);
  const cardUrl = `${APP_URL}/Card/${slug}`;
  const { file_url: qr_code_url } = await generateQrPng(cardUrl, { color: company.brand_color || '#000000' });

  const card = await prisma.$transaction(async (tx) => {
    const c = await tx.digitalCard.create({
      data: {
        company_id, permanent_slug: slug,
        full_name, title, company_name, phone, email, overview,
        social_links, messaging_links, qr_code_url,
        status: 'active',
        template: template || 'modern',
        font_style: font_style || 'sans',
        custom_color: custom_color || '#000000',
      },
    });
    await tx.company.update({
      where: { id: company_id },
      data: { used_urls: company.used_urls + 1 },
    });
    return c;
  });

  res.json({ success: true, card, card_url: cardUrl });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const updated = await prisma.digitalCard.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.digitalCard.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// generateEmptyCards (admin bulk).
router.post('/bulk', requireAdmin, async (req, res) => {
  const { company_id, quantity } = req.body || {};
  if (!company_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'company_id and quantity (>0) required' });
  }
  const company = await prisma.company.findUnique({ where: { id: company_id } });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  const available = company.purchased_urls - company.used_urls;
  if (quantity > available) {
    return res.status(400).json({ error: `Only ${available} URL slots available.` });
  }

  const cards = [];
  for (let i = 0; i < quantity; i++) {
    const slug = nanoid(10);
    const cardUrl = `${APP_URL}/Card/${slug}`;
    const { file_url: qr_code_url } = await generateQrPng(cardUrl, { color: company.brand_color || '#000000' });
    const card = await prisma.digitalCard.create({
      data: {
        company_id, permanent_slug: slug,
        full_name: `Unassigned Card ${i + 1}`, title: 'Not Assigned',
        company_name: company.company_name,
        phone: '', email: '', overview: '',
        qr_code_url, status: 'inactive',
      },
    });
    cards.push({ id: card.id, slug, url: cardUrl, qr_code_url });
  }
  res.json({ success: true, cards });
});

export default router;
