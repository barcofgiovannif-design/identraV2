import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import fs from 'node:fs';
import { requireAuth } from '../middleware/auth.js';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
const publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `upload-${nanoid(10)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  const file_url = `${publicBase}/uploads/${req.file.filename}`;
  res.json({ file_url });
});

export default router;
