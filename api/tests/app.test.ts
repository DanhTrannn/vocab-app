import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { ApiError } from '../src/lib/errors.js';

describe('GET /api/health', () => {
  it('trả về status ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('error handling', () => {
  it('JSON body hỏng → 400 kèm { error }', async () => {
    const res = await request(createApp())
      .post('/api/day-sets')
      .set('Content-Type', 'application/json')
      .send('{broken');
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('ApiError được map đúng status', async () => {
    const app: Express = createApp((a) => {
      a.get('/api/_boom', (_req, _res, next) => next(new ApiError(418, 'teapot')));
    });
    const res = await request(app).get('/api/_boom');
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: 'teapot' });
  });
});
