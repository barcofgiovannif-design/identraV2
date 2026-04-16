import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '30', 10);

export function signSessionToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: `${SESSION_TTL_DAYS}d` });
}

export function setSessionCookie(res, token) {
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie('session', { path: '/' });
}

async function loadUserFromReq(req) {
  const token = req.cookies?.session;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, SECRET);
    return await prisma.user.findUnique({ where: { id: sub } });
  } catch {
    return null;
  }
}

export async function attachUser(req, _res, next) {
  req.user = await loadUserFromReq(req);
  next();
}

export async function requireAuth(req, res, next) {
  req.user = await loadUserFromReq(req);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Platform staff (support or superadmin) — can access super-admin dashboard.
export async function requireAdmin(req, res, next) {
  req.user = await loadUserFromReq(req);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'support' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Full platform owner (for destructive / billing actions).
export async function requireSuperAdmin(req, res, next) {
  req.user = await loadUserFromReq(req);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Returns the company_id the caller is allowed to act on. Platform staff can
// pass any `company_id` in the query/body; corporate admins are pinned to
// their own. Throws 403 if they try to cross-tenant.
export function resolveCompanyScope(req) {
  const requested = req.query.company_id || req.body?.company_id || null;
  const isPlatform = req.user && (req.user.role === 'support' || req.user.role === 'superadmin');
  if (isPlatform) return requested; // may be null → cross-company list
  if (!req.user?.company_id) {
    const err = new Error('No company assigned to this user');
    err.status = 403;
    throw err;
  }
  if (requested && requested !== req.user.company_id) {
    const err = new Error('Forbidden: cross-tenant access');
    err.status = 403;
    throw err;
  }
  return req.user.company_id;
}
