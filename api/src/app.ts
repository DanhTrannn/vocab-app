import express, { type Express } from 'express';
import { errorHandler } from './lib/errors.js';

export function createApp(register?: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  register?.(app);
  app.use(errorHandler);
  return app;
}
