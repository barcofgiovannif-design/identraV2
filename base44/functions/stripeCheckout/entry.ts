import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { plan_id, customer_email, customer_name } = await req.json();

    if (!plan_id || !customer_email || !customer_name) {
      return Response.json({ 
        error: 'Missing required fields: plan_id, customer_email, customer_name' 
      }, { status: 400 });
    }

    // Get pricing plan
    const plans = await base44.asServiceRole.entities.PricingPlan.filter({ id: plan_id });
    
    if (!plans || plans.length === 0) {
      return Response.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    const plan = plans[0];

    if (!plan.is_active) {
      return Response.json({ error: 'This plan is not available' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    // Create Stripe checkout session (first, then build URLs with the session ID)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Card only - no bank transfers
      mode: 'payment',
      customer_email: customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Package - ${plan.url_count} Digital Cards`,
              description: `Permanent digital business cards for your team`,
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

    console.log('[Checkout] Session created:', { sessionId: session.id, clientSecret: session.client_secret });

    return Response.json({ 
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});