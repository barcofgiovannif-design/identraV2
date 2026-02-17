import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';

function generateSlug(fullName) {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { company_id, full_name, title, company_name, phone, email, overview, social_links, messaging_links } = payload;

    // Get company to check available slots
    const company = await base44.entities.Company.get(company_id);
    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.used_urls >= company.purchased_urls) {
      return Response.json({ error: 'No available URL slots' }, { status: 400 });
    }

    // Generate permanent slug
    const permanentSlug = generateSlug(full_name);

    // Generate QR code
    const cardUrl = `${req.headers.get('origin')}/card/${permanentSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(cardUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: company.brand_color || '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to blob and upload
    const base64Data = qrCodeDataUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const qrBlob = new Blob([binaryData], { type: 'image/png' });
    const qrFile = new File([qrBlob], `qr-${permanentSlug}.png`, { type: 'image/png' });

    const { file_url: qr_code_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: qrFile });

    // Create digital card
    const card = await base44.asServiceRole.entities.DigitalCard.create({
      company_id,
      permanent_slug: permanentSlug,
      full_name,
      title,
      company_name,
      phone,
      email,
      overview,
      social_links: social_links || {},
      messaging_links: messaging_links || {},
      qr_code_url,
      status: 'active'
    });

    // Update company's used_urls count
    await base44.asServiceRole.entities.Company.update(company_id, {
      used_urls: company.used_urls + 1
    });

    return Response.json({ 
      success: true, 
      card,
      card_url: cardUrl 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});