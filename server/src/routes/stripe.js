import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db.js';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

router.post('/checkout', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const { plan_id, customer_email, customer_name, appUrl } = req.body || {};
  const plan = await prisma.pricingPlan.findUnique({ where: { id: plan_id } });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const redirectUrl = appUrl || APP_URL;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${plan.name} Package - ${plan.url_count} Digital Cards`,
          description: 'Permanent digital business cards for your team',
        },
        unit_amount: Math.round(plan.price * 100),
      },
      quantity: 1,
    }],
    metadata: {
      plan_id: plan.id,
      plan_name: plan.name,
      url_count: String(plan.url_count),
      customer_email,
      customer_name: customer_name || '',
    },
    success_url: `${redirectUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${redirectUrl}/`,
  });

  res.json({ sessionId: session.id, clientSecret: session.client_secret, url: session.url });
});

export default router;
