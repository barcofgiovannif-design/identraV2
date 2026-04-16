import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'Identra <noreply@example.com>';

export const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — logging instead');
    console.log(`[email] TO=${to} SUBJECT=${subject}`);
    return { id: 'noop' };
  }
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message || 'Email send failed');
  return data;
}
