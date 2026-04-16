import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
const publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

await fs.mkdir(uploadsDir, { recursive: true });

export async function saveBuffer(buffer, { ext = 'bin', prefix = 'file' } = {}) {
  const name = `${prefix}-${nanoid(10)}.${ext}`;
  const full = path.join(uploadsDir, name);
  await fs.writeFile(full, buffer);
  return { file_url: `${publicBase}/uploads/${name}`, path: full, name };
}
