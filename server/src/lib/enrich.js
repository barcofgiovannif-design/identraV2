import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

// Extract the best-guess client IP from the request.
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const raw = (typeof fwd === 'string' ? fwd.split(',')[0] : '') || req.socket?.remoteAddress || '';
  const cleaned = String(raw).trim().replace(/^::ffff:/, '');
  return cleaned || null;
}

// Given a request, return an interaction-ready enrichment blob.
export function enrichFromRequest(req) {
  const ua = req.headers['user-agent'] || '';
  const parsed = new UAParser(ua).getResult();
  const ip = clientIp(req);
  const geo = ip && ip !== '127.0.0.1' && ip !== '::1' ? geoip.lookup(ip) : null;
  return {
    ip_address: ip,
    user_agent: ua || null,
    device_type: deviceType(parsed),
    browser: parsed.browser?.name ? `${parsed.browser.name}${parsed.browser.version ? ' ' + parsed.browser.version.split('.')[0] : ''}` : null,
    os: parsed.os?.name ? `${parsed.os.name}${parsed.os.version ? ' ' + parsed.os.version : ''}` : null,
    geo_country: geo?.country || null,
    geo_region: geo?.region || null,
    geo_city: geo?.city || null,
    referrer: req.headers.referer || null,
  };
}

function deviceType(parsed) {
  const os = (parsed.os?.name || '').toLowerCase();
  if (os.includes('ios') || os.includes('ipad')) return 'ios';
  if (os.includes('android')) return 'android';
  if (parsed.device?.type === 'mobile') return 'mobile';
  if (parsed.device?.type === 'tablet') return 'tablet';
  if (os) return 'desktop';
  return 'other';
}
