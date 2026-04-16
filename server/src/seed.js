import 'dotenv/config';
import { prisma } from './db.js';

// Two-tier seed:
//   - giovannibarcof@gmail.com → platform superadmin (no company)
//   - marketingtruegrade@gmail.com → corporate admin of "True Grade"
const PLATFORM_ADMIN = 'giovannibarcof@gmail.com';
const CORPORATE_ADMIN = 'marketingtruegrade@gmail.com';

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

  // Platform superadmin — no company, sees super-admin dashboard.
  await prisma.user.upsert({
    where: { email: PLATFORM_ADMIN },
    update: { role: 'superadmin', company_id: null },
    create: { email: PLATFORM_ADMIN, full_name: 'Giovanni (Platform)', role: 'superadmin' },
  });
  console.log(`Platform superadmin: ${PLATFORM_ADMIN}`);

  // Corporate customer: one Company, admin user tied to it.
  const trueGrade = await prisma.company.upsert({
    where: { email: CORPORATE_ADMIN },
    update: { purchased_urls: 10 },
    create: {
      company_name: 'True Grade',
      email: CORPORATE_ADMIN,
      brand_color: '#111827',
      purchased_urls: 10,
      used_urls: 0,
      status: 'active',
    },
  });
  await prisma.user.upsert({
    where: { email: CORPORATE_ADMIN },
    update: { role: 'user', company_id: trueGrade.id },
    create: { email: CORPORATE_ADMIN, full_name: 'Giovanni (TrueGrade)', role: 'user', company_id: trueGrade.id },
  });
  console.log(`Corporate admin: ${CORPORATE_ADMIN} → ${trueGrade.company_name}`);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
