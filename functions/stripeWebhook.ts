import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { plan_id, company_email, company_name, company_phone, url_count } = session.metadata;

      // Check if company already exists
      const existingCompanies = await base44.asServiceRole.entities.Company.filter({ 
        email: company_email 
      });

      let company;
      if (existingCompanies.length > 0) {
        // Existing company - upgrade
        company = existingCompanies[0];
        await base44.asServiceRole.entities.Company.update(company.id, {
          purchased_urls: company.purchased_urls + parseInt(url_count),
          stripe_customer_id: session.customer
        });
      } else {
        // New company - create account
        company = await base44.asServiceRole.entities.Company.create({
          company_name,
          email: company_email,
          phone: company_phone || '',
          purchased_urls: parseInt(url_count),
          used_urls: 0,
          status: 'active',
          stripe_customer_id: session.customer,
          brand_color: '#000000'
        });
      }

      // Record purchase
      await base44.asServiceRole.entities.Purchase.create({
        company_id: company.id,
        plan_id,
        amount: session.amount_total / 100,
        url_count: parseInt(url_count),
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        purchase_type: existingCompanies.length > 0 ? 'upgrade' : 'initial'
      });

      // Send welcome email for new companies
      if (existingCompanies.length === 0) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: company_email,
          from_name: 'DigitalCard',
          subject: 'Welcome to DigitalCard!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to DigitalCard, ${company_name}!</h2>
              <p>Your account has been successfully created. You now have <strong>${url_count} permanent URL slots</strong> for your team's digital business cards.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">What's next?</h3>
                <ul style="padding-left: 20px;">
                  <li>Log in to your dashboard</li>
                  <li>Set up your company branding (logo & colors)</li>
                  <li>Create digital cards for your team members</li>
                  <li>Download QR codes and start sharing!</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${req.headers.get('origin')}/login" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Access Dashboard
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Need help? Contact our support team anytime.
              </p>
            </div>
          `
        });
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});