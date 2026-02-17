import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { card_id } = await req.json();

    if (!card_id) {
      return Response.json({ error: 'card_id is required' }, { status: 400 });
    }

    // Get digital card data
    const cards = await base44.asServiceRole.entities.DigitalCard.filter({ id: card_id });
    
    if (!cards || cards.length === 0) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    const card = cards[0];

    // Get company data for logo
    const companies = await base44.asServiceRole.entities.Company.filter({ id: card.company_id });
    const company = companies[0];

    // Build vCard format (version 3.0)
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${card.full_name}\n`;
    vcard += `N:${card.full_name.split(' ').reverse().join(';')};;;\n`;
    vcard += `TITLE:${card.title}\n`;
    vcard += `ORG:${card.company_name}\n`;
    
    if (card.email) {
      vcard += `EMAIL;TYPE=WORK:${card.email}\n`;
    }
    
    if (card.phone) {
      vcard += `TEL;TYPE=WORK,VOICE:${card.phone}\n`;
    }
    
    if (card.overview) {
      vcard += `NOTE:${card.overview}\n`;
    }

    // Add social links
    if (card.social_links?.linkedin) {
      vcard += `URL;TYPE=LinkedIn:${card.social_links.linkedin}\n`;
    }
    if (card.social_links?.twitter) {
      vcard += `URL;TYPE=Twitter:${card.social_links.twitter}\n`;
    }
    if (card.social_links?.website) {
      vcard += `URL;TYPE=Website:${card.social_links.website}\n`;
    }

    // Add card URL
    const cardUrl = `${new URL(req.url).origin}/Card/${card.permanent_slug}`;
    vcard += `URL;TYPE=DigitalCard:${cardUrl}\n`;

    vcard += 'END:VCARD';

    return new Response(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${card.full_name.replace(/\s+/g, '-')}.vcf"`
      }
    });

  } catch (error) {
    console.error('Error generating vCard:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});