import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';
import { nanoid } from 'npm:nanoid@5.0.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { company_id, full_name, title, company_name, phone, email, overview, social_links, messaging_links, template, font_style, custom_color } = payload;

    // Verify company ownership
    const company = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    if (!company || company.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyData = company[0];

    // Check if company has available URL slots
    if (companyData.used_urls >= companyData.purchased_urls) {
      return Response.json({ error: 'No available URL slots. Upgrade your plan.' }, { status: 400 });
    }

    // Generate permanent unique slug
    const slug = nanoid(10);
    const cardUrl = `${new URL(req.url).origin}/Card/${slug}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(cardUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: companyData.brand_color || '#000000',
        light: '#FFFFFF'
      }
    });

    // Upload QR to storage
    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const qrBlob = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
    const qrFile = new File([qrBlob], `qr-${slug}.png`, { type: 'image/png' });
    
    const { file_url: qr_code_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: qrFile });

    // Create digital card
    const card = await base44.asServiceRole.entities.DigitalCard.create({
      company_id,
      permanent_slug: slug,
      full_name,
      title,
      company_name,
      phone,
      email,
      overview,
      social_links,
      messaging_links,
      qr_code_url,
      status: 'active',
      template: template || 'modern',
      font_style: font_style || 'sans',
      custom_color: custom_color || '#000000'
    });

    // Update company used_urls count
    await base44.asServiceRole.entities.Company.update(company_id, {
      used_urls: companyData.used_urls + 1
    });

    return Response.json({ 
      success: true, 
      card,
      card_url: cardUrl
    });

  } catch (error) {
    console.error('Error creating digital card:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});