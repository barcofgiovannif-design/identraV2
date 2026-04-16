import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAudit } from '../lib/audit.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.company_id) where.company_id = req.query.company_id;
  const list = await prisma.webhook.findMany({ where, orderBy: { created_at: 'desc' } });
  res.json(list);
});

router.get('/:id/deliveries', requireAuth, async (req, res) => {
  const list = await prisma.webhookDelivery.findMany({
    where: { webhook_id: req.params.id },
    orderBy: { delivered_at: 'desc' },
    take: 100,
  });
  res.json(list);
});

router.post('/', requireAuth, async (req, res) => {
  const { company_id, name, url, events, secret, is_active = true } = req.body || {};
  if (!company_id || !name || !url) return res.status(400).json({ error: 'company_id, name and url required' });
  const hook = await prisma.webhook.create({
    data: {
      company_id, name, url,
      events: Array.isArray(events) && events.length ? events : ['lead.captured'],
      secret: secret || crypto.randomBytes(24).toString('hex'),
      is_active,
    },
  });
  await recordAudit(req, { company_id, action: 'webhook.created', entity_type: 'webhook', entity_id: hook.id, metadata: { url } });
  res.json(hook);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const hook = await prisma.webhook.update({ where: { id: req.params.id }, data: req.body });
  await recordAudit(req, { company_id: hook.company_id, action: 'webhook.updated', entity_type: 'webhook', entity_id: hook.id });
  res.json(hook);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const hook = await prisma.webhook.delete({ where: { id: req.params.id } });
  await recordAudit(req, { company_id: hook.company_id, action: 'webhook.deleted', entity_type: 'webhook', entity_id: hook.id });
  res.json({ success: true });
});

// Send a test payload to verify the endpoint.
router.post('/:id/test', requireAuth, async (req, res) => {
  const hook = await prisma.webhook.findUnique({ where: { id: req.params.id } });
  if (!hook) return res.status(404).json({ error: 'Not found' });
  const body = JSON.stringify({ event: 'test.ping', data: { message: 'hello from Identra' }, delivered_at: new Date().toISOString() });
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Identra-Webhook/1.0' };
  if (hook.secret) {
    const sig = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
    headers['X-Identra-Signature'] = `sha256=${sig}`;
  }
  let status = null;
  let responseText = null;
  let errorText = null;
  try {
    const r = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
    status = r.status;
    responseText = (await r.text()).slice(0, 2000);
  } catch (err) {
    errorText = err.message;
  }
  await prisma.webhookDelivery.create({
    data: { webhook_id: hook.id, event: 'test.ping', payload: JSON.parse(body).data, status_code: status, response: responseText, error: errorText },
  });
  res.json({ status, response: responseText, error: errorText });
});

export default router;
