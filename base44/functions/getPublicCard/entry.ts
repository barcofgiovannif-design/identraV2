import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const { slug } = await req.json();

        if (!slug) {
            return Response.json({ error: 'Slug is required' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);

        // Use service role to access data without authentication
        const cards = await base44.asServiceRole.entities.DigitalCard.filter({ 
            permanent_slug: slug,
            status: 'active'
        });

        if (cards.length === 0) {
            return Response.json({ error: 'Card not found' }, { status: 404 });
        }

        const card = cards[0];

        // Get company data
        const companies = await base44.asServiceRole.entities.Company.filter({ 
            id: card.company_id 
        });

        const company = companies.length > 0 ? companies[0] : null;

        return Response.json({ 
            card,
            company: company ? {
                logo_url: company.logo_url,
                brand_color: company.brand_color
            } : null
        });
    } catch (error) {
        console.error('Error fetching card:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});