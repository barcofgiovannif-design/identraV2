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

export async function requireAdmin(req, res, next) {
  req.user = await loadUserFromReq(req);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
