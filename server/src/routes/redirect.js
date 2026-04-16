import { Router } from 'express';
import { prisma } from '../db.js';

export const redirectRouter = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// /r/:short_code — the actual URL printed on QR codes / encoded in NFC.
// Logs an Interaction, then 302-redirects to the frontend public card page.
redirectRouter.get('/r/:short_code', async (req, res) => {
  const { short_code } = req.params;
  const url = await prisma.url.findUnique({ where: { short_code } });

  // Fire-and-forget interaction log (don't block the redirect on DB writes).
  if (url) {
    const ua = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '').trim();
    prisma.interaction.create({
      data: {
        url_id: url.id,
        ip_address: ip || null,
        user_agent: ua || null,
        device_type: deviceType(ua),
        referrer: req.headers.referer || null,
      },
    }).catch((err) => console.error('[interaction log]', err.message));
  }

  // Always redirect to the frontend card page even if unknown — frontend shows a 404 state.
  res.redirect(302, `${APP_URL}/Card/${short_code}`);
});

function deviceType(ua = '') {
  const s = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(s)) return 'ios';
  if (/android/.test(s)) return 'android';
  if (/windows|macintosh|linux/.test(s)) return 'desktop';
  return 'other';
}
