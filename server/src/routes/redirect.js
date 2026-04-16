import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { enrichFromRequest } from '../lib/enrich.js';

export const redirectRouter = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Throttle per-IP to stop someone inflating a customer's metrics with a script.
// 60 taps/minute/IP is generous for legitimate scanning at an event but blocks
// bot-level volume; the redirect still works even once throttled.
const tapLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // If over the limit we still redirect, but skip the interaction log.
  handler: (req, res) => {
    req.rateLimited = true;
    proceedRedirect(req, res);
  },
});

function proceedRedirect(req, res) {
  const { short_code } = req.params;
  res.redirect(302, `${APP_URL}/Card/${short_code}`);
}

// /r/:short_code — the actual URL printed on QR codes / encoded in NFC.
// Logs an Interaction, then 302-redirects to the frontend public card page.
redirectRouter.get('/r/:short_code', tapLimiter, async (req, res) => {
  const { short_code } = req.params;
  const url = await prisma.url.findUnique({ where: { short_code } });

  if (url && !req.rateLimited) {
    prisma.interaction.create({
      data: { url_id: url.id, event: 'view', ...enrichFromRequest(req) },
    }).catch((err) => console.error('[interaction log]', err.message));
  }

  res.redirect(302, `${APP_URL}/Card/${short_code}`);
});
