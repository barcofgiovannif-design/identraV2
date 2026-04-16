import { Router } from 'express';
import { prisma } from '../db.js';
import { enrichFromRequest } from '../lib/enrich.js';

export const redirectRouter = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// /r/:short_code — the actual URL printed on QR codes / encoded in NFC.
// Logs an Interaction, then 302-redirects to the frontend public card page.
redirectRouter.get('/r/:short_code', async (req, res) => {
  const { short_code } = req.params;
  const url = await prisma.url.findUnique({ where: { short_code } });

  if (url) {
    prisma.interaction.create({
      data: { url_id: url.id, event: 'view', ...enrichFromRequest(req) },
    }).catch((err) => console.error('[interaction log]', err.message));
  }

  res.redirect(302, `${APP_URL}/Card/${short_code}`);
});
