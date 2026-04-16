import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../db.js';
import { sendEmail } from '../lib/email.js';

export const stripeWebhookRouter = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Stripe requires the raw body for signature validation.
stripeWebhookRouter.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !WEBHOOK_SECRET) return res.status(500).send('Stripe not configured');
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] bad signature', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { customer_email, plan_name, url_count, customer_name } = session.metadata;

    let company = await prisma.company.findUnique({ where: { email: customer_email } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          company_name: customer_email.split('@')[0],
          email: customer_email,
          purchased_urls: parseInt(url_count, 10),
          used_urls: 0,
          status: 'active',
          stripe_customer_id: session.customer,
        },
      });
    } else {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          purchased_urls: company.purchased_urls + parseInt(url_count, 10),
          stripe_customer_id: session.customer,
        },
      });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    await prisma.purchase.create({
      data: {
        company_id: company.id,
        plan_name,
        customer_name: customer_name || customer_email.split('@')[0],
        customer_email,
        invoice_number: invoiceNumber,
        amount: session.amount_total / 100,
        url_count: parseInt(url_count, 10),
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        purchase_type: 'initial',
      },
    });

    try {
      await sendEmail({
        to: customer_email,
        subject: `Invoice ${invoiceNumber} - Identra`,
        html: `<p>Hi ${customer_name || ''},</p><p>Thanks for your purchase of <b>${plan_name}</b> (${url_count} cards) for $${session.amount_total / 100}. Invoice: ${invoiceNumber}.</p>`,
      });
      if (ADMIN_EMAIL) {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `New purchase: ${customer_email}`,
          html: `<p>${customer_email} purchased ${plan_name} ($${session.amount_total / 100}).</p>`,
        });
      }
    } catch (e) {
      console.error('[webhook] email failed', e.message);
    }
  }

  res.json({ received: true });
});
