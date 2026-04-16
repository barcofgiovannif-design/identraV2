// One-off: provisions a sample corporate customer with sample cards + a fresh
// magic-link so you can log in without hitting Resend.
import 'dotenv/config';
import { nanoid } from 'nanoid';
import { prisma } from '../db.js';
import { generateQrPng } from '../lib/qr.js';

const EMAIL = 'demo@identra-test.com';
const COMPANY_NAME = 'Demo Corp';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

const SAMPLE_PROFILES = [
  { full_name: 'María García', title: 'Chief Revenue Officer', email: 'maria@democorp.com', phone: '+1 415 555 0101',
    social_links: { linkedin: 'https://linkedin.com/in/mariagarcia', twitter: 'https://twitter.com/mariagarcia' },
    lead_capture_enabled: true },
  { full_name: 'James Chen', title: 'VP of Sales', email: 'james@democorp.com', phone: '+1 415 555 0102',
    social_links: { linkedin: 'https://linkedin.com/in/jameschen' } },
  { full_name: 'Priya Patel', title: 'Account Executive', email: 'priya@democorp.com', phone: '+1 415 555 0103',
    social_links: { linkedin: 'https://linkedin.com/in/priyapatel' },
    lead_capture_enabled: true },
  { full_name: 'Diego Ramírez', title: 'Sales Engineer', email: 'diego@democorp.com', phone: '+1 415 555 0104' },
];

async function main() {
  // Company
  const company = await prisma.company.upsert({
    where: { email: EMAIL },
    update: { purchased_urls: 10, status: 'active' },
    create: {
      company_name: COMPANY_NAME,
      email: EMAIL,
      brand_color: '#0E7490',
      purchased_urls: 10,
      used_urls: 0,
      status: 'active',
    },
  });

  // User tied as admin of that company
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { role: 'user', company_id: company.id },
    create: { email: EMAIL, full_name: 'Demo Admin', role: 'user', company_id: company.id },
  });

  // Ensure we have some cards (only create if company has no urls yet)
  const existingUrls = await prisma.url.count({ where: { company_id: company.id } });
  if (existingUrls === 0) {
    for (const p of SAMPLE_PROFILES) {
      const short_code = nanoid(10);
      const { file_url: qr_code_url } = await generateQrPng(`${PUBLIC_BASE}/r/${short_code}`, {
        color: company.brand_color || '#000000',
      });
      await prisma.$transaction(async (tx) => {
        const url = await tx.url.create({
          data: { company_id: company.id, short_code, qr_code_url, is_active: true },
        });
        const profile = await tx.profile.create({
          data: { ...p, company_id: company.id },
        });
        await tx.url.update({ where: { id: url.id }, data: { active_profile_id: profile.id } });
        await tx.urlAssignment.create({
          data: { url_id: url.id, profile_snapshot: profile, assigned_at: new Date() },
        });
      });
    }
    await prisma.company.update({ where: { id: company.id }, data: { used_urls: SAMPLE_PROFILES.length } });
  }

  // Seed a couple of captured leads on the first two cards (for the Leads tab)
  const urls = await prisma.url.findMany({ where: { company_id: company.id }, take: 2 });
  if (urls.length && (await prisma.lead.count({ where: { company_id: company.id } })) === 0) {
    const prospects = [
      { name: 'Oliver Brown', email: 'oliver@prospect.com', phone: '+1 646 555 1010', company: 'Brown Associates' },
      { name: 'Sophie Müller', email: 'sophie@acme.io', phone: '+49 30 555 2020', company: 'Acme GmbH' },
      { name: 'Raj Shah', email: 'raj@bolt.com', phone: '+1 212 555 3030', company: 'Bolt Inc.' },
    ];
    for (const p of prospects) {
      await prisma.lead.create({
        data: {
          url_id: urls[0].id,
          profile_id: urls[0].active_profile_id,
          company_id: company.id,
          ...p,
        },
      });
    }
    await prisma.lead.create({
      data: {
        url_id: urls[1].id,
        profile_id: urls[1].active_profile_id,
        company_id: company.id,
        name: 'Hiroshi Tanaka', email: 'hiroshi@enterprise.jp', phone: '+81 3 555 4040', company: 'Tanaka Enterprise',
      },
    });
  }

  // Fresh magic-link token valid 60 minutes
  const token = nanoid(32);
  await prisma.magicToken.create({
    data: {
      token,
      email: EMAIL,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const loginUrl = `${APP_URL}/Verify?token=${token}&email=${encodeURIComponent(EMAIL)}`;

  console.log('\n========================================');
  console.log('  DEMO CORPORATE CUSTOMER READY');
  console.log('========================================');
  console.log(`  Company:   ${company.company_name}`);
  console.log(`  Email:     ${EMAIL}`);
  console.log(`  Role:      user (corporate admin)`);
  console.log(`  Cards:     ${SAMPLE_PROFILES.length}`);
  console.log('');
  console.log('  Log in with:');
  console.log(`    1) Go to ${APP_URL}/Login`);
  console.log(`       and enter:  ${EMAIL}`);
  console.log(`       (the magic link goes to the server console)`);
  console.log('');
  console.log('    OR skip email and open this URL directly:');
  console.log(`    ${loginUrl}`);
  console.log('========================================\n');

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
