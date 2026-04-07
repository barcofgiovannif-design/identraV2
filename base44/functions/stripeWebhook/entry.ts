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

      // Send professional invoice email
      try {
        const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const invoiceNumber = `INV-${Date.now()}`;
        const amountFormatted = (session.amount_total / 100).toFixed(2);
        const customerName = session.metadata.customer_name || customer_email.split('@')[0];

        const emailHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; line-height: 1.6; color: #111827; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 40px; text-align: center; color: white; }
              .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 600; }
              .header p { margin: 0; font-size: 14px; opacity: 0.9; }
              .content { padding: 40px; }
              .receipt-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .receipt-section h2 { margin: 0 0 15px 0; font-size: 18px; color: #111827; font-weight: 600; }
              .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #111827; }
              .receipt-row.total { border-top: 2px solid #f59e0b; padding-top: 15px; margin-top: 15px; font-weight: 600; font-size: 16px; }
              .invoice-section { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
              .invoice-col h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
              .invoice-col p { margin: 0; font-size: 14px; color: #111827; }
              .details-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
              .details-table th { background: #e5e7eb; padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #111827; }
              .details-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; }
              .details-table td.right { text-align: right; }
              .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
              .footer { background: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Payment Received</h1>
                <p>Order Confirmation & Receipt</p>
              </div>
              <div class="content">
                <div class="success-badge">Payment Confirmed</div>
                <p>Dear ${customerName},</p>
                <p>Thank you for your purchase! Your payment has been successfully processed. Your order details and receipt are below.</p>
                
                <div class="receipt-section">
                  <h2>Receipt Details</h2>
                  <div class="receipt-row">
                    <span>Invoice Number:</span>
                    <span style="font-weight: 600;">${invoiceNumber}</span>
                  </div>
                  <div class="receipt-row">
                    <span>Date:</span>
                    <span>${invoiceDate}</span>
                  </div>
                  <div class="receipt-row">
                    <span>Payment Method:</span>
                    <span>Credit Card</span>
                  </div>
                  <div class="receipt-row">
                    <span>Status:</span>
                    <span style="color: #10b981; font-weight: 600;">✓ Completed</span>
                  </div>
                  <div class="receipt-row total">
                    <span>Amount Paid:</span>
                    <span>$${amountFormatted} USD</span>
                  </div>
                </div>

                <div class="invoice-section">
                  <h3 style="margin: 0 0 20px 0; font-size: 16px; color: #111827; font-weight: 600;">Order Summary</h3>
                  <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Billing To</h4>
                    <p style="margin: 0; font-size: 14px; color: #111827;">${customerName}</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">${customer_email}</p>
                  </div>
                  <table class="details-table">
                    <thead><tr><th style="width: 60%;">Description</th><th style="text-align: right;">Quantity</th><th style="text-align: right;">Price</th></tr></thead>
                    <tbody>
                      <tr><td><strong>${plan_name} Package</strong></td><td style="text-align: right;">1</td><td class="right"><strong>$${amountFormatted}</strong></td></tr>
                      <tr><td style="font-size: 13px; color: #6b7280;">Includes ${url_count} permanent digital card slots</td><td style="text-align: right;">-</td><td class="right">-</td></tr>
                    </tbody>
                  </table>
                </div>

                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #10b981;">
                  <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Next Steps:</strong> Log in to your Identra dashboard to start creating and managing your digital business cards. You now have <strong>${url_count} permanent card slots</strong> available immediately.</p>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0 0 15px 0;"><strong>Identra</strong><br>Permanent Digital Business Cards Platform</p>
                <p style="margin: 0 0 15px 0; font-size: 12px;">© 2026 Identra. All rights reserved.</p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Reference: ${session.id}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send to customer
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customer_email,
          subject: `Payment Confirmed - Invoice ${invoiceNumber}`,
          body: emailHTML,
          from_name: 'Identra'
        });
        console.log('[Webhook] Customer receipt sent to:', customer_email);

        // Send to admin
        const adminEmail = Deno.env.get('ADMIN_EMAIL');
        if (adminEmail && adminEmail !== customer_email) {
          const adminEmailHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; line-height: 1.6; color: #111827; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px 40px; color: white; }
                .header h1 { margin: 0 0 5px 0; font-size: 22px; font-weight: 600; }
                .header p { margin: 0; font-size: 14px; opacity: 0.9; }
                .badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 15px; }
                .content { padding: 30px 40px; }
                .info-section { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 15px 0; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                .table { width: 100%; margin: 20px 0; border-collapse: collapse; }
                .table th { background: #e5e7eb; padding: 10px; text-align: left; font-size: 13px; font-weight: 600; color: #111827; }
                .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                .table td.right { text-align: right; }
                .total-row { background: #f9fafb; font-weight: 600; padding: 12px 10px; }
                .footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 New Payment Received</h1>
                  <p>Admin Notification - Invoice ${invoiceNumber}</p>
                </div>
                <div class="content">
                  <div class="badge">Payment Completed</div>
                  
                  <p><strong>A new order has been successfully processed.</strong></p>
                  
                  <div class="info-section">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #111827; font-weight: 600;">Customer Information</h3>
                    <div class="info-row">
                      <span>Name:</span>
                      <span style="font-weight: 500;">${customerName}</span>
                    </div>
                    <div class="info-row">
                      <span>Email:</span>
                      <span>${customer_email}</span>
                    </div>
                    <div class="info-row">
                      <span>Date:</span>
                      <span>${invoiceDate}</span>
                    </div>
                  </div>

                  <div class="info-section">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #111827; font-weight: 600;">Order Details</h3>
                    <table class="table">
                      <thead><tr><th>Item</th><th style="text-align: right;">Qty</th><th style="text-align: right;">Amount</th></tr></thead>
                      <tbody>
                        <tr><td>${plan_name} Package</td><td style="text-align: right;">1</td><td class="right">$${amountFormatted}</td></tr>
                        <tr><td style="font-size: 12px; color: #6b7280;">${url_count} digital card slots</td><td style="text-align: right;">-</td><td class="right">-</td></tr>
                        <tr class="total-row"><td colspan="2" style="text-align: right;">Total:</td><td class="right">$${amountFormatted} USD</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="info-section">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #111827; font-weight: 600;">Transaction Details</h3>
                    <div class="info-row">
                      <span>Invoice Number:</span>
                      <span>${invoiceNumber}</span>
                    </div>
                    <div class="info-row">
                      <span>Session ID:</span>
                      <span style="font-family: monospace; font-size: 12px;">${session.id}</span>
                    </div>
                    <div class="info-row">
                      <span>Payment Status:</span>
                      <span style="color: #10b981; font-weight: 600;">✓ Completed</span>
                    </div>
                  </div>
                </div>
                <div class="footer">
                  <p style="margin: 0;">Identra Admin Dashboard Notification</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `[NEW ORDER] ${invoiceNumber} - $${amountFormatted} from ${customerName}`,
            body: adminEmailHTML,
            from_name: 'Identra Notifications'
          });
          console.log('[Webhook] Admin notification sent to:', adminEmail);
        }
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