import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature (MUST use async version for Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata;

      // Create or update company
      const existingCompanies = await base44.asServiceRole.entities.Company.filter({ 
        email: metadata.customer_email 
      });

      let company;
      
      if (existingCompanies.length > 0) {
        // Update existing company (upgrade)
        company = existingCompanies[0];
        await base44.asServiceRole.entities.Company.update(company.id, {
          purchased_urls: company.purchased_urls + parseInt(metadata.url_count),
          stripe_customer_id: session.customer || company.stripe_customer_id
        });
      } else {
        // Create new company (first purchase)
        company = await base44.asServiceRole.entities.Company.create({
          company_name: metadata.customer_name,
          email: metadata.customer_email,
          purchased_urls: parseInt(metadata.url_count),
          used_urls: 0,
          status: 'active',
          stripe_customer_id: session.customer,
          brand_color: '#000000'
        });
      }

      // Create purchase record
      await base44.asServiceRole.entities.Purchase.create({
        company_id: company.id,
        plan_id: metadata.plan_id,
        amount: session.amount_total / 100, // Convert from cents
        url_count: parseInt(metadata.url_count),
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        purchase_type: existingCompanies.length > 0 ? 'upgrade' : 'initial'
      });

      // Send welcome email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: metadata.customer_email,
        subject: 'Welcome to DigitalCard - Your Purchase is Complete',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #111827;">Welcome to DigitalCard!</h2>
            <p>Thank you for your purchase. Your account is now active with ${metadata.url_count} permanent digital business card URLs.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Package Details:</h3>
              <p><strong>Plan:</strong> ${metadata.plan_name}</p>
              <p><strong>URLs Included:</strong> ${metadata.url_count}</p>
              <p><strong>Company:</strong> ${metadata.customer_name}</p>
            </div>
            <p>Sign in to your dashboard to start creating digital business cards for your team.</p>
            <div style="margin: 30px 0;">
              <a href="${new URL(req.url).origin}/login" 
                 style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Need help? Contact our support team anytime.</p>
          </div>
        `
      });
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});