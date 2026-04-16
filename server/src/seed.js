import 'dotenv/config';
import { prisma } from './db.js';

const TEST_EMAILS = ['marketingtruegrade@gmail.com', 'giovannibarcof@gmail.com'];

async function main() {
  const plans = [
    { id: 'starter',    name: 'Starter',    price: 99,  url_count: 10,  description: '10 digital business cards',  sort_order: 1 },
    { id: 'business',   name: 'Business',   price: 299, url_count: 50,  description: '50 digital business cards',  sort_order: 2 },
    { id: 'enterprise', name: 'Enterprise', price: 799, url_count: 200, description: '200 digital business cards', sort_order: 3 },
  ];
  for (const p of plans) {
    await prisma.pricingPlan.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log('Seeded plans');

  for (const email of TEST_EMAILS) {
    await prisma.user.upsert({
      where: { email },
      update: { role: 'superadmin' },
      create: { email, full_name: 'Giovanni Barco', role: 'superadmin' },
    });
    await prisma.company.upsert({
      where: { email },
      update: { purchased_urls: 10 },
      create: {
        company_name: 'True Grade',
        email,
        brand_color: '#111827',
        purchased_urls: 10,
        used_urls: 0,
        status: 'active',
      },
    });
    console.log(`Seeded test company + superadmin for ${email}`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
