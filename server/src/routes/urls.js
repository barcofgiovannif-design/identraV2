import { Router } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateQrPng } from '../lib/qr.js';
import { recordAudit } from '../lib/audit.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

// The tap URL that gets encoded into the QR. Never changes for a given short_code.
const tapUrlFor = (code) => `${PUBLIC_BASE}/r/${code}`;

async function mergedUrlView(url) {
  const profile = url.active_profile
    ?? (url.active_profile_id
      ? await prisma.profile.findUnique({
          where: { id: url.active_profile_id },
          include: { template_ref: true },
        })
      : null);
  const tpl = profile?.template_ref || null;
  const tplDesign = tpl?.design_settings || {};
  // common_links (from template) override profile's own social_links so master
  // changes propagate instantly to every profile using the template.
  const mergedSocial = {
    ...(profile?.social_links || {}),
    ...(tpl?.common_links || {}),
  };
  return {
    id: url.id,
    company_id: url.company_id,
    short_code: url.short_code,
    permanent_slug: url.short_code, // alias for frontend back-compat
    qr_code_url: url.qr_code_url,
    tap_url: tapUrlFor(url.short_code),
    is_active: url.is_active,
    status: url.is_active ? (profile ? 'active' : 'unassigned') : 'inactive',
    active_profile_id: url.active_profile_id,
    template_id: profile?.template_id ?? null,
    template_ref: tpl,
    locked_fields: tpl?.locked_fields || [],
    created_at: url.created_at,
    updated_at: url.updated_at,
    // Flattened profile fields for existing UI code
    full_name: profile?.full_name ?? null,
    title: profile?.title ?? null,
    company_name: profile?.company_name ?? null,
    phone: profile?.phone ?? null,
    email: profile?.email ?? null,
    overview: profile?.bio ?? null,
    bio: profile?.bio ?? null,
    photo_url: profile?.photo_url ?? null,
    social_links: mergedSocial,
    messaging_links: profile?.messaging_links ?? null,
    template: tplDesign.template ?? profile?.template ?? 'modern',
    font_style: tplDesign.font_style ?? profile?.font_style ?? 'sans',
    custom_color: tplDesign.custom_color ?? profile?.custom_color ?? '#000000',
    lead_capture_enabled: profile?.lead_capture_enabled ?? false,
  };
}

// List URLs (optionally filtered by company / short_code / active_profile presence).
router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  if (req.query.short_code) where.short_code = req.query.short_code;
  if (req.query.permanent_slug) where.short_code = req.query.permanent_slug;
  const list = await prisma.url.findMany({
    where,
    include: { active_profile: true, _count: { select: { interactions: true } } },
    orderBy: { created_at: 'desc' },
  });
  const views = await Promise.all(list.map(async (u) => ({
    ...(await mergedUrlView(u)),
    tap_count: u._count.interactions,
  })));
  res.json(views);
});

router.get('/:id', requireAuth, async (req, res) => {
  const url = await prisma.url.findUnique({
    where: { id: req.params.id },
    include: { active_profile: true },
  });
  if (!url) return res.status(404).json({ error: 'Not found' });
  res.json(await mergedUrlView(url));
});

// Mint a new URL + QR. Optionally assign a profile in the same call.
// Accepts either { company_id, profile: {...} } or a flat body with profile fields.
router.post('/', requireAuth, async (req, res) => {
  const body = req.body || {};
  const { company_id } = body;
  const profile = body.profile
    ?? (Object.keys(body).some((k) => !['company_id', 'profile'].includes(k)) ? body : null);
  if (!company_id) return res.status(400).json({ error: 'company_id required' });

  const company = await prisma.company.findUnique({ where: { id: company_id } });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  if (company.used_urls >= company.purchased_urls) {
    return res.status(400).json({ error: 'No available URL slots. Upgrade your plan.' });
  }

  const short_code = nanoid(10);
  const { file_url: qr_code_url } = await generateQrPng(tapUrlFor(short_code), {
    color: company.brand_color || '#000000',
  });

  const created = await prisma.$transaction(async (tx) => {
    const url = await tx.url.create({
      data: { company_id, short_code, qr_code_url, is_active: true },
    });

    let activeProfile = null;
    if (profile && Object.keys(profile).length > 0) {
      activeProfile = await tx.profile.create({
        data: { ...normalizeProfileData(profile), company_id },
      });
      await tx.url.update({ where: { id: url.id }, data: { active_profile_id: activeProfile.id } });
      await tx.urlAssignment.create({
        data: {
          url_id: url.id,
          profile_snapshot: activeProfile,
          assigned_at: new Date(),
        },
      });
    }

    await tx.company.update({
      where: { id: company_id },
      data: { used_urls: company.used_urls + 1 },
    });

    return tx.url.findUnique({ where: { id: url.id }, include: { active_profile: true } });
  });

  recordAudit(req, {
    company_id,
    action: 'url.created',
    entity_type: 'url',
    entity_id: created.id,
    metadata: { short_code: created.short_code, has_profile: !!created.active_profile_id },
  });
  res.json({ success: true, url: await mergedUrlView(created), tap_url: tapUrlFor(short_code) });
});

// Admin bulk: mint N empty URLs for a company.
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

  const urls = [];
  for (let i = 0; i < quantity; i++) {
    const short_code = nanoid(10);
    const { file_url: qr_code_url } = await generateQrPng(tapUrlFor(short_code), {
      color: company.brand_color || '#000000',
    });
    const url = await prisma.url.create({
      data: { company_id, short_code, qr_code_url, is_active: true },
    });
    urls.push({ id: url.id, short_code, tap_url: tapUrlFor(short_code), qr_code_url });
  }
  await prisma.company.update({
    where: { id: company_id },
    data: { used_urls: company.used_urls + quantity },
  });
  res.json({ success: true, urls });
});

// Reassign: replace the active profile (archive old one in UrlAssignment).
router.post('/:id/reassign', requireAuth, async (req, res) => {
  const url = await prisma.url.findUnique({
    where: { id: req.params.id },
    include: { active_profile: true },
  });
  if (!url) return res.status(404).json({ error: 'URL not found' });

  const newData = normalizeProfileData(req.body || {});

  const updated = await prisma.$transaction(async (tx) => {
    // Archive current assignment if any
    if (url.active_profile_id) {
      await tx.urlAssignment.updateMany({
        where: { url_id: url.id, unassigned_at: null },
        data: {
          unassigned_at: new Date(),
          profile_snapshot: url.active_profile ?? {},
        },
      });
      // Soft-detach old profile (we don't delete; it may still be referenced by leads/history)
      await tx.profile.update({
        where: { id: url.active_profile_id },
        data: {},
      });
    }

    // Create a fresh profile with the new team member's data
    const newProfile = await tx.profile.create({
      data: { ...newData, company_id: url.company_id },
    });
    await tx.url.update({
      where: { id: url.id },
      data: { active_profile_id: newProfile.id },
    });
    await tx.urlAssignment.create({
      data: { url_id: url.id, profile_snapshot: newProfile, assigned_at: new Date() },
    });
    return tx.url.findUnique({ where: { id: url.id }, include: { active_profile: true } });
  });

  res.json({ success: true, url: await mergedUrlView(updated) });
});

// Unassign (empty the card but keep the URL alive).
router.post('/:id/unassign', requireAuth, async (req, res) => {
  const url = await prisma.url.findUnique({ where: { id: req.params.id } });
  if (!url) return res.status(404).json({ error: 'URL not found' });
  if (!url.active_profile_id) return res.json({ success: true });

  await prisma.$transaction(async (tx) => {
    await tx.urlAssignment.updateMany({
      where: { url_id: url.id, unassigned_at: null },
      data: { unassigned_at: new Date() },
    });
    await tx.url.update({ where: { id: url.id }, data: { active_profile_id: null } });
  });
  res.json({ success: true });
});

// Smart update: detects whether this is a profile edit or a full reassignment.
// Rule: if `full_name` is provided and differs from the current active profile's
// full_name, treat it as a new team member — archive the old profile snapshot
// into UrlAssignment and create a fresh Profile. Otherwise, update in place.
router.patch('/:id', requireAuth, async (req, res) => {
  const url = await prisma.url.findUnique({
    where: { id: req.params.id },
    include: { active_profile: true },
  });
  if (!url) return res.status(404).json({ error: 'URL not found' });

  const body = req.body || {};

  // URL-level flags (is_active).
  const urlPatch = {};
  if (typeof body.is_active === 'boolean') urlPatch.is_active = body.is_active;

  // If the active profile has a template with locked_fields, strip those keys.
  let profilePatch = normalizeProfileData(body);
  profilePatch = await applyLockedFields(profilePatch, url.active_profile);
  const norm = (s) => (s || '').trim().toLowerCase();
  const nameProvided = typeof body.full_name === 'string' && body.full_name.trim().length > 0;
  const nameChanged = nameProvided
    && url.active_profile
    && norm(url.active_profile.full_name) !== norm(body.full_name);

  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(urlPatch).length) {
      await tx.url.update({ where: { id: url.id }, data: urlPatch });
    }

    if (!url.active_profile_id) {
      // URL had no profile yet — this is the first assignment.
      if (Object.keys(profilePatch).length) {
        const created = await tx.profile.create({
          data: { ...profilePatch, company_id: url.company_id },
        });
        await tx.url.update({ where: { id: url.id }, data: { active_profile_id: created.id } });
        await tx.urlAssignment.create({
          data: { url_id: url.id, profile_snapshot: created, assigned_at: new Date() },
        });
      }
    } else if (nameChanged) {
      // Name change → treat as reassignment. Archive the outgoing profile and
      // spawn a fresh one. The old Profile row is kept intact so historical
      // leads/interactions remain correctly attributed.
      await tx.urlAssignment.updateMany({
        where: { url_id: url.id, unassigned_at: null },
        data: {
          unassigned_at: new Date(),
          profile_snapshot: url.active_profile ?? {},
        },
      });
      const newProfile = await tx.profile.create({
        data: { ...profilePatch, company_id: url.company_id },
      });
      await tx.url.update({
        where: { id: url.id },
        data: { active_profile_id: newProfile.id },
      });
      await tx.urlAssignment.create({
        data: { url_id: url.id, profile_snapshot: newProfile, assigned_at: new Date() },
      });
    } else {
      // Same person — plain in-place update. No history entry.
      if (Object.keys(profilePatch).length) {
        await tx.profile.update({
          where: { id: url.active_profile_id },
          data: profilePatch,
        });
      }
    }

    return tx.url.findUnique({
      where: { id: url.id },
      include: { active_profile: true },
    });
  });

  const view = await mergedUrlView(result);
  recordAudit(req, {
    company_id: url.company_id,
    action: nameChanged ? 'url.reassigned' : 'url.updated',
    entity_type: 'url',
    entity_id: url.id,
    metadata: {
      short_code: url.short_code,
      from: url.active_profile?.full_name || null,
      to: body.full_name || null,
      fields_changed: Object.keys(profilePatch),
    },
  });
  res.json({ ...view, reassigned: Boolean(nameChanged) });
});

// Bulk CSV import: create N (URL + Profile) in one shot.
// Body: { company_id, template_id?, rows: [{ full_name, title, email, phone, ... }] }
router.post('/import', requireAuth, async (req, res) => {
  const { company_id, template_id = null, rows = [] } = req.body || {};
  if (!company_id || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'company_id and rows[] required' });
  }

  const company = await prisma.company.findUnique({ where: { id: company_id } });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  const available = company.purchased_urls - company.used_urls;
  if (rows.length > available) {
    return res.status(400).json({ error: `Only ${available} URL slots available; ${rows.length} requested.` });
  }

  const created = [];
  const errors = [];
  for (const [i, row] of rows.entries()) {
    try {
      const profileData = normalizeProfileData(row);
      if (!profileData.full_name) throw new Error('full_name missing');
      const short_code = nanoid(10);
      const { file_url: qr_code_url } = await generateQrPng(tapUrlFor(short_code), {
        color: company.brand_color || '#000000',
      });
      const url = await prisma.$transaction(async (tx) => {
        const u = await tx.url.create({
          data: { company_id, short_code, qr_code_url, is_active: true },
        });
        const p = await tx.profile.create({
          data: { ...profileData, company_id, template_id },
        });
        await tx.url.update({ where: { id: u.id }, data: { active_profile_id: p.id } });
        await tx.urlAssignment.create({
          data: { url_id: u.id, profile_snapshot: p, assigned_at: new Date() },
        });
        return u;
      });
      created.push({ row: i, short_code: url.short_code, id: url.id });
    } catch (err) {
      errors.push({ row: i, error: err.message });
    }
  }

  if (created.length > 0) {
    await prisma.company.update({
      where: { id: company_id },
      data: { used_urls: { increment: created.length } },
    });
  }

  recordAudit(req, {
    company_id,
    action: 'csv.imported',
    metadata: { created: created.length, errors: errors.length, template_id },
  });
  res.json({ success: errors.length === 0, created: created.length, errors });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const url = await prisma.url.findUnique({ where: { id: req.params.id } });
  if (!url) return res.status(404).json({ error: 'Not found' });
  await prisma.$transaction(async (tx) => {
    await tx.url.delete({ where: { id: url.id } });
    await tx.company.update({
      where: { id: url.company_id },
      data: { used_urls: { decrement: 1 } },
    });
  });
  res.json({ success: true });
});

function normalizeProfileData(data) {
  const allowed = [
    'full_name', 'title', 'company_name', 'phone', 'email', 'bio', 'overview',
    'photo_url', 'social_links', 'messaging_links', 'template', 'font_style',
    'custom_color', 'lead_capture_enabled', 'template_id',
  ];
  const out = {};
  for (const k of allowed) {
    if (data[k] === undefined) continue;
    if (k === 'overview') out.bio = data.overview;
    else out[k] = data[k];
  }
  return out;
}

// Strip keys the template has marked as locked, so UI-forced edits are rejected.
async function applyLockedFields(patch, profile) {
  if (!profile?.template_id) return patch;
  const tpl = await prisma.template.findUnique({ where: { id: profile.template_id } });
  const locked = Array.isArray(tpl?.locked_fields) ? tpl.locked_fields : [];
  if (locked.length === 0) return patch;
  const filtered = { ...patch };
  for (const field of locked) delete filtered[field];
  return filtered;
}

export default router;
