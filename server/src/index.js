import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { stripeWebhookRouter } from './routes/stripe-webhook.js';
import authRouter from './routes/auth.js';
import companiesRouter from './routes/companies.js';
import cardsRouter from './routes/cards.js';
import publicRouter from './routes/public.js';
import purchasesRouter from './routes/purchases.js';
import plansRouter from './routes/plans.js';
import uploadsRouter from './routes/uploads.js';
import stripeRouter from './routes/stripe.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Stripe webhook must receive the raw body — mount BEFORE json parser.
app.use('/api/stripe/webhook', stripeWebhookRouter);

app.use(cors({ origin: APP_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve local uploads
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/public', publicRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/plans', plansRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/stripe', stripeRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
