import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { plan_id, company_email, company_name, company_phone } = await req.json();

    if (!plan_id || !company_email || !company_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get pricing plan
    const plan = await base44.asServiceRole.entities.PricingPlan.get(plan_id);
    if (!plan || !plan.is_active) {
      return Response.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Package`,
              description: `${plan.url_count} permanent digital business card URLs`
            },
            unit_amount: Math.round(plan.price * 100)
          },
          quantity: 1
        }
      ],
      customer_email: company_email,
      metadata: {
        plan_id,
        company_email,
        company_name,
        company_phone: company_phone || '',
        url_count: plan.url_count.toString()
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout?plan=${plan.name.toLowerCase()}`
    });

    return Response.json({ 
      session_id: session.id,
      url: session.url 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});