import Stripe from 'npm:stripe@16.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const APP_ID = Deno.env.get('BASE44_APP_ID');

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Validate Stripe webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET
    );

    // Add required header for Base44 SDK
    const headers = new Headers(req.headers);
    headers.set('Base44-App-Id', APP_ID);
    headers.set('Content-Type', 'application/json');
    
    const newReq = new Request(req, { headers, body });
    const base44 = createClientFromRequest(newReq);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { customer_email, plan_name, url_count } = session.metadata;

      console.log('[Webhook] Processing session:', { sessionId: session.id, email: customer_email });

      // Check if company already exists
      let company = await base44.asServiceRole.entities.Company.filter({ email: customer_email });
      company = company[0];

      if (!company) {
        // Create new company
        company = await base44.asServiceRole.entities.Company.create({
          company_name: customer_email.split('@')[0],
          email: customer_email,
          purchased_urls: parseInt(url_count),
          used_urls: 0,
          status: 'active',
          stripe_customer_id: session.customer,
        });
        console.log('[Webhook] Company created:', company.id);
      } else {
        // Update existing company
        await base44.asServiceRole.entities.Company.update(company.id, {
          purchased_urls: company.purchased_urls + parseInt(url_count),
          stripe_customer_id: session.customer,
        });
        console.log('[Webhook] Company updated:', company.id);
      }

      // Create purchase record
      await base44.asServiceRole.entities.Purchase.create({
        company_id: company.id,
        amount: session.amount_total / 100,
        url_count: parseInt(url_count),
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        purchase_type: 'initial',
      });

      console.log('[Webhook] Purchase recorded for:', customer_email);

      // Send confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: customer_email,
          subject: 'Payment Confirmed - Welcome to Identra',
          body: `Thank you for your purchase! You now have ${url_count} digital card slots available.`,
        });
        console.log('[Webhook] Confirmation email sent to:', customer_email);
      } catch (emailError) {
        console.error('[Webhook] Email error:', emailError.message);
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});