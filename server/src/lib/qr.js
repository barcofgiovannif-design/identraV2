import QRCode from 'qrcode';
import { saveBuffer } from './storage.js';

export async function generateQrPng(url, { color = '#000000' } = {}) {
  const buffer = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
  });
  return saveBuffer(buffer, { ext: 'png', prefix: 'qr' });
}
