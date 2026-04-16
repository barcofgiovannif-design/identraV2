import crypto from 'node:crypto';
import { prisma } from '../db.js';

// Fire-and-forget: dispatch an event to every matching active webhook for a company.
export async function dispatchEvent({ company_id, event, payload }) {
  const hooks = await prisma.webhook.findMany({ where: { company_id, is_active: true } });
  const matching = hooks.filter((h) => {
    const events = Array.isArray(h.events) ? h.events : [];
    return events.includes(event) || events.includes('*');
  });

  for (const h of matching) {
    deliver(h, event, payload).catch((e) => console.error('[webhook] deliver error:', e.message));
  }
}

async function deliver(hook, event, payload) {
  const body = JSON.stringify({ event, data: payload, delivered_at: new Date().toISOString() });
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Identra-Webhook/1.0' };
  if (hook.secret) {
    const sig = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
    headers['X-Identra-Signature'] = `sha256=${sig}`;
  }
  let status = null;
  let responseText = null;
  let errorText = null;
  try {
    const res = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
    status = res.status;
    responseText = (await res.text()).slice(0, 2000);
  } catch (err) {
    errorText = err.message;
  }
  await prisma.webhookDelivery.create({
    data: { webhook_id: hook.id, event, payload, status_code: status, response: responseText, error: errorText },
  });
  await prisma.webhook.update({ where: { id: hook.id }, data: { last_fired_at: new Date() } });
}
