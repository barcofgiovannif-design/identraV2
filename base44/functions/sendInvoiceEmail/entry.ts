import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { customer_email, customer_name, plan_name, amount, url_count, session_id, admin_email } = await req.json();

    if (!customer_email || !plan_name || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const invoiceDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const invoiceNumber = `INV-${Date.now()}`;

    // Professional HTML email template
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f9fafb;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #111827;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            padding: 40px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #111827;
          }
          .invoice-section {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
          }
          .invoice-col {
            flex: 1;
          }
          .invoice-col h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .invoice-col p {
            margin: 0;
            font-size: 14px;
            color: #111827;
          }
          .invoice-col p.value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          .details-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
          }
          .details-table th {
            background: #e5e7eb;
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            border: none;
          }
          .details-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #111827;
          }
          .details-table td.right {
            text-align: right;
          }
          .summary {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .summary-row.total {
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 12px;
            font-weight: 600;
            font-size: 16px;
            color: #111827;
          }
          .cta-button {
            display: inline-block;
            background: #111827;
            color: white;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            font-size: 14px;
          }
          .cta-button:hover {
            background: #1f2937;
          }
          .footer {
            background: #f9fafb;
            padding: 30px 40px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
          }
          .footer a {
            color: #111827;
            text-decoration: none;
            font-weight: 500;
          }
          .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>✓ Payment Received</h1>
            <p>Invoice ${invoiceNumber}</p>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="success-badge">Order Confirmed</div>
            
            <div class="greeting">
              <p>Dear ${customer_name || 'Valued Customer'},</p>
              <p>Thank you for your purchase! Your payment has been successfully processed. Below is your invoice details.</p>
            </div>

            <!-- Invoice Details -->
            <div class="invoice-section">
              <div class="invoice-header">
                <div class="invoice-col">
                  <h3>Invoice Number</h3>
                  <p>${invoiceNumber}</p>
                </div>
                <div class="invoice-col">
                  <h3>Invoice Date</h3>
                  <p>${invoiceDate}</p>
                </div>
                <div class="invoice-col">
                  <h3>Payment Status</h3>
                  <p style="color: #10b981; font-weight: 600;">Completed</p>
                </div>
              </div>

              <!-- Bill To -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Bill To</h3>
                <p style="margin: 0; font-size: 14px; color: #111827;">${customer_name || 'Customer'}</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">${customer_email}</p>
              </div>
            </div>

            <!-- Items Table -->
            <table class="details-table">
              <thead>
                <tr>
                  <th style="width: 60%;">Description</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${plan_name} Package</td>
                  <td style="text-align: right;">1</td>
                  <td class="right">$${(amount / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">${url_count} permanent digital card slots</td>
                  <td style="text-align: right;">-</td>
                  <td class="right">Included</td>
                </tr>
              </tbody>
            </table>

            <!-- Summary -->
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>$${(amount / 100).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>$${(amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">Start creating your digital business cards</p>
              <a href="${new URL(req.url).origin.replace('api.base44.', '')}" class="cta-button">Access Your Dashboard</a>
            </div>

            <!-- Info -->
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 14px; color: #111827;">
                <strong>What's next?</strong> Log in to your dashboard to start creating and managing your digital business cards. You now have <strong>${url_count} permanent card slots</strong> ready to use.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 15px 0;">
              <strong>Identra</strong><br>
              Permanent Digital Business Cards
            </p>
            <p style="margin: 0 0 15px 0; font-size: 12px;">
              © 2026 Identra. All rights reserved.
            </p>
            <p style="margin: 0;">
              Session ID: ${session_id}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to customer
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customer_email,
      subject: `Invoice ${invoiceNumber} - Payment Confirmed`,
      body: emailHTML,
    });

    console.log('[SendInvoice] Email sent to customer:', customer_email);

    // Send to admin if email provided
    if (admin_email && admin_email !== customer_email) {
      const adminHTML = emailHTML.replace(
        'Dear ${customer_name || \'Valued Customer\'},',
        `Dear Admin,\n\nA new payment has been received. Details below:\n\n<strong>Customer: ${customer_name}</strong><br><strong>Email: ${customer_email}</strong><br><br>`
      );

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin_email,
        subject: `[ADMIN] Invoice ${invoiceNumber} - New Payment Received`,
        body: adminHTML,
      });

      console.log('[SendInvoice] Admin notification sent to:', admin_email);
    }

    return Response.json({ 
      success: true, 
      message: 'Invoice emails sent successfully',
      invoiceNumber 
    });

  } catch (error) {
    console.error('[SendInvoice] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});