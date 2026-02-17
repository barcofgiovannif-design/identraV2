import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if company exists
    const companies = await base44.asServiceRole.entities.Company.filter({ email });
    
    if (companies.length === 0) {
      return Response.json({ error: 'No account found with this email' }, { status: 404 });
    }

    const company = companies[0];

    // Generate magic link token (valid for 15 minutes)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store token in company record
    await base44.asServiceRole.entities.Company.update(company.id, {
      magic_link_token: token,
      magic_link_expires: expiresAt
    });

    // Send magic link email
    const magicLink = `${req.headers.get('origin')}/verify?token=${token}`;
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'DigitalCard',
      subject: 'Your Login Link',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome back!</h2>
          <p>Click the button below to sign in to your DigitalCard dashboard:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Sign In
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Or copy and paste this link: ${magicLink}
          </p>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Magic link sent to your email' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});