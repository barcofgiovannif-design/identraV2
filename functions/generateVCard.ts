import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function escapeVCardValue(value) {
  if (!value) return '';
  return value.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { card_id } = await req.json();

    if (!card_id) {
      return Response.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Get card details
    const card = await base44.asServiceRole.entities.DigitalCard.get(card_id);
    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get company for logo
    const company = await base44.asServiceRole.entities.Company.get(card.company_id);

    // Build vCard 3.0 format
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(card.full_name)}`,
      `N:${escapeVCardValue(card.full_name.split(' ').pop())};${escapeVCardValue(card.full_name.split(' ')[0])};;;`,
      `ORG:${escapeVCardValue(card.company_name)}`,
      `TITLE:${escapeVCardValue(card.title)}`
    ];

    if (card.email) {
      vCardLines.push(`EMAIL;TYPE=WORK:${escapeVCardValue(card.email)}`);
    }

    if (card.phone) {
      vCardLines.push(`TEL;TYPE=WORK:${escapeVCardValue(card.phone)}`);
    }

    if (card.overview) {
      vCardLines.push(`NOTE:${escapeVCardValue(card.overview)}`);
    }

    // Add social links as URLs
    if (card.social_links?.linkedin) {
      vCardLines.push(`URL;TYPE=LinkedIn:${escapeVCardValue(card.social_links.linkedin)}`);
    }
    if (card.social_links?.twitter) {
      vCardLines.push(`URL;TYPE=Twitter:${escapeVCardValue(card.social_links.twitter)}`);
    }
    if (card.social_links?.website) {
      vCardLines.push(`URL;TYPE=WORK:${escapeVCardValue(card.social_links.website)}`);
    }

    // Add card URL
    const cardUrl = `${req.headers.get('origin')}/card/${card.permanent_slug}`;
    vCardLines.push(`URL;TYPE=DigitalCard:${cardUrl}`);

    vCardLines.push('END:VCARD');

    const vCardContent = vCardLines.join('\r\n');

    return new Response(vCardContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${card.full_name.replace(/\s+/g, '-')}.vcf"`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});