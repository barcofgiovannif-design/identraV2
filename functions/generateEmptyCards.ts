import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';
import { nanoid } from 'npm:nanoid@5.0.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { company_id, quantity } = payload;

    if (!company_id || !quantity || quantity <= 0) {
      return Response.json({ error: 'company_id and quantity (>0) are required' }, { status: 400 });
    }

    // Get company data
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    if (!companies || companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companies[0];
    const availableSlots = company.purchased_urls - company.used_urls;

    if (quantity > availableSlots) {
      return Response.json({ 
        error: `Only ${availableSlots} URL slots available. Company has ${company.purchased_urls} purchased and ${company.used_urls} used.` 
      }, { status: 400 });
    }

    const cards = [];
    const origin = new URL(req.url).origin;

    // Generate empty cards with unique slugs and QR codes
    for (let i = 0; i < quantity; i++) {
      const slug = nanoid(10);
      const cardUrl = `${origin}/card/${slug}`;

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(cardUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: company.brand_color || '#000000',
          light: '#FFFFFF'
        }
      });

      // Upload QR to storage
      const qrBase64 = qrCodeDataUrl.split(',')[1];
      const qrBlob = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
      const qrFile = new File([qrBlob], `qr-${slug}.png`, { type: 'image/png' });
      
      const { file_url: qr_code_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: qrFile });

      // Create empty digital card
      const card = await base44.asServiceRole.entities.DigitalCard.create({
        company_id,
        permanent_slug: slug,
        full_name: `Unassigned Card ${i + 1}`,
        title: 'Not Assigned',
        company_name: company.company_name,
        phone: '',
        email: '',
        overview: '',
        qr_code_url,
        status: 'inactive'
      });

      cards.push({
        id: card.id,
        slug,
        url: cardUrl,
        qr_code_url
      });
    }

    // Update company used_urls count
    await base44.asServiceRole.entities.Company.update(company_id, {
      used_urls: company.used_urls + quantity
    });

    return Response.json({ 
      success: true,
      generated: quantity,
      cards
    });

  } catch (error) {
    console.error('Error generating empty cards:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});