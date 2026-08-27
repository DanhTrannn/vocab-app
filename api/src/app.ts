import express, { type Express } from 'express';
import { errorHandler } from './lib/errors.js';
import daySetsRouter from './routes/daySets.js';
import wordsRouter from './routes/words.js';

export function createApp(register?: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', daySetsRouter);
  app.use('/api', wordsRouter);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  register?.(app);
  app.use(errorHandler);
  return app;
}
