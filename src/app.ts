import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { prisma } from './db/prisma';
import { requestId } from './middleware/requestId';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import accountRoutes from './modules/accounts/account.routes';
import transactionRoutes from './modules/transactions/transaction.routes';

export const app = express();

app.disable('x-powered-by');
app.use(requestId);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false }));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/v1/accounts', accountRoutes);        // POST /, GET /:id
app.use('/api/v1/accounts', transactionRoutes);    // POST /:id/transactions

app.use(notFound);        // after all routes
app.use(errorHandler);    // always last