import { Router } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../db.js';
import { sendEmail } from '../lib/email.js';
import {
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from '../middleware/auth.js';

const router = Router();
const TTL = parseInt(process.env.MAGIC_LINK_TTL_MINUTES || '15', 10);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

router.post('/send-magic-link', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const company = await prisma.company.findUnique({ where: { email } });
  if (!company) {
    return res.status(404).json({ error: 'No company found with this email. Please purchase a package first.' });
  }

  const token = nanoid(32);
  await prisma.magicToken.create({
    data: { token, email, expires_at: new Date(Date.now() + TTL * 60 * 1000) },
  });

  const link = `${APP_URL}/Verify?token=${token}&email=${encodeURIComponent(email)}`;
  console.log(`[auth] magic link for ${email}: ${link}`);

  let emailSent = true;
  let emailError = null;
  try {
    await sendEmail({
      to: email,
      subject: 'Your Login Link - Identra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">Welcome back to Identra</h2>
          <p>Click the button below to sign in to your ${company.company_name} dashboard:</p>
          <div style="margin: 30px 0;">
            <a href="${link}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Sign In</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in ${TTL} minutes.</p>
        </div>
      `,
    });
  } catch (err) {
    emailSent = false;
    emailError = err.message;
    console.error('[auth] email send failed:', err.message);
  }

  res.json({
    success: true,
    emailSent,
    emailError,
    message: emailSent
      ? 'Magic link sent to your email.'
      : 'Magic link generated but email failed — check server console for the link.',
    // Dev convenience: expose the link when the email provider rejected the recipient.
    devLink: process.env.NODE_ENV === 'production' ? undefined : link,
  });
});

router.post('/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token required' });

  const record = await prisma.magicToken.findUnique({ where: { token } });
  if (!record || record.used_at || record.expires_at < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.upsert({
    where: { email: record.email },
    update: {},
    create: { email: record.email },
  });

  await prisma.magicToken.update({ where: { token }, data: { used_at: new Date() } });
  await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });

  const jwt = signSessionToken(user.id);
  setSessionCookie(res, jwt);
  res.json({ user });
});

router.get('/me', requireAuth, (req, res) => {
  // Include impersonator info so the UI can surface a banner + "stop" button.
  res.json({
    ...req.user,
    impersonating: Boolean(req.user.impersonated_by),
    impersonated_by: req.user.impersonated_by || null,
  });
});

router.patch('/me', requireAuth, async (req, res) => {
  const { full_name } = req.body || {};
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { full_name },
  });
  res.json(user);
});

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

export default router;
