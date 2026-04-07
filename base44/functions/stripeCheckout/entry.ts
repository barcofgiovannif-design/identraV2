import Stripe from 'npm:stripe@16.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const APP_ID = Deno.env.get('BASE44_APP_ID');

Deno.serve(async (req) => {
  try {
    // Add required header for Base44 SDK
    const headers = new Headers(req.headers);
    headers.set('Base44-App-Id', APP_ID);
    
    const newReq = new Request(req, { headers });
    const base44 = createClientFromRequest(newReq);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan_id, customer_email, customer_name } = body;

    // Fetch plan details
    const plan = await base44.entities.PricingPlan.get(plan_id);
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const origin = new URL(req.url).origin;

    // Create Stripe checkout session (card only - no bank transfers)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Package - ${plan.url_count} Digital Cards`,
              description: 'Permanent digital business cards for your team',
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name,
        url_count: plan.url_count.toString(),
        customer_email,
        customer_name,
      },
      success_url: `${origin}/success`,
      cancel_url: `${origin}/`,
    });

    console.log('[Checkout] Session created:', { sessionId: session.id });

    return Response.json({
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url,
    });
  } catch (error) {
    console.error('[Checkout] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});