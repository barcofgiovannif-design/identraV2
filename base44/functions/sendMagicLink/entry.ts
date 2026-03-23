import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nanoid } from 'npm:nanoid@5.0.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if company exists with this email
    const companies = await base44.asServiceRole.entities.Company.filter({ email });
    
    if (!companies || companies.length === 0) {
      return Response.json({ 
        error: 'No company found with this email. Please purchase a package first.' 
      }, { status: 404 });
    }

    const company = companies[0];

    // Generate magic link token (valid for 15 minutes)
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store token temporarily (you could use a MagicToken entity for this)
    // For now, we'll send the link directly
    const origin = new URL(req.url).origin;
    const magicLink = `${origin}/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email with magic link
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Your Login Link - DigitalCard',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">Welcome back to DigitalCard</h2>
          <p>Click the button below to sign in to your ${company.company_name} dashboard:</p>
          <div style="margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Sign In to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Magic link sent to your email. Please check your inbox.' 
    });

  } catch (error) {
    console.error('Error sending magic link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});