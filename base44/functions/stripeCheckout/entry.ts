import Stripe from 'npm:stripe@16.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const APP_ID = Deno.env.get('BASE44_APP_ID');

Deno.serve(async (req) => {
  try {
    // Parse body first
    const body = await req.json();
    const { plan_id, customer_email, customer_name, appUrl } = body;

    // Initialize Base44 SDK with the original request
    const base44 = createClientFromRequest(req);

    // Fetch plan details using service role (no auth required for public data)
    const plan = await base44.asServiceRole.entities.PricingPlan.get(plan_id);
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Use appUrl from frontend (where the user's app is hosted)
    const redirectUrl = appUrl || new URL(req.url).origin;

    // Create Stripe checkout session (card only - no bank transfers)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer_email,
      allowed_payment_methods: {
        types: ['card'],
      },
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
      success_url: `${redirectUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}/`,
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