import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// getPublicCard — fetch an active card by slug, no auth.
router.get('/cards/:slug', async (req, res) => {
  const card = await prisma.digitalCard.findFirst({
    where: { permanent_slug: req.params.slug, status: 'active' },
  });
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const company = card.company_id
    ? await prisma.company.findUnique({ where: { id: card.company_id } })
    : null;
  res.json({
    card,
    company: company ? { logo_url: company.logo_url, brand_color: company.brand_color } : null,
  });
});

// generateVCard — return .vcf for any card id.
router.get('/cards/:id/vcard', async (req, res) => {
  const card = await prisma.digitalCard.findUnique({ where: { id: req.params.id } });
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  const cardUrl = `${APP_URL}/Card/${card.permanent_slug}`;

  let v = 'BEGIN:VCARD\n';
  v += 'VERSION:3.0\n';
  v += `FN:${card.full_name}\n`;
  v += `N:${card.full_name.split(' ').reverse().join(';')};;;\n`;
  if (card.title) v += `TITLE:${card.title}\n`;
  if (card.company_name) v += `ORG:${card.company_name}\n`;
  if (card.email) v += `EMAIL;TYPE=WORK:${card.email}\n`;
  if (card.phone) v += `TEL;TYPE=WORK,VOICE:${card.phone}\n`;
  if (card.overview) v += `NOTE:${card.overview}\n`;
  if (card.social_links?.linkedin) v += `URL;TYPE=LinkedIn:${card.social_links.linkedin}\n`;
  if (card.social_links?.twitter) v += `URL;TYPE=Twitter:${card.social_links.twitter}\n`;
  if (card.social_links?.website) v += `URL;TYPE=Website:${card.social_links.website}\n`;
  v += `URL;TYPE=DigitalCard:${cardUrl}\n`;
  v += 'END:VCARD';

  res.setHeader('Content-Type', 'text/vcard');
  res.setHeader('Content-Disposition', `attachment; filename="${card.full_name.replace(/\s+/g, '-')}.vcf"`);
  res.send(v);
});

export default router;
