import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';

const app = createApp();

describe('POST /api/day-sets', () => {
  it('tạo bộ với tên mặc định là hôm nay (UTC)', async () => {
    const res = await request(app).post('/api/day-sets').send({});
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(new Date().toISOString().slice(0, 10));
  });

  it('trùng tên → tự thêm hậu tố (2), (3)', async () => {
    await request(app).post('/api/day-sets').send({ name: '2026-08-25' });
    const r2 = await request(app).post('/api/day-sets').send({ name: '2026-08-25' });
    const r3 = await request(app).post('/api/day-sets').send({ name: '2026-08-25' });
    expect(r2.body.name).toBe('2026-08-25 (2)');
    expect(r3.body.name).toBe('2026-08-25 (3)');
  });

  it('name chỉ toàn khoảng trắng → 400', async () => {
    const res = await request(app).post('/api/day-sets').send({ name: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/day-sets', () => {
  it('trả về kèm wordCount và điểm lần test gần nhất', async () => {
    const set = await prisma.daySet.create({
      data: {
        name: '2026-08-25',
        words: {
          create: [
            { english: 'happy', meaning: 'vui', synonyms: { create: [{ text: 'glad' }] } },
            { english: 'run', meaning: 'chạy' },
          ],
        },
        testResults: { create: [{ scorePercent: 50 }, { scorePercent: 90 }] },
      },
    });
    const res = await request(app).get('/api/day-sets');
    expect(res.status).toBe(200);
    const item = res.body.find((s: { id: number }) => s.id === set.id);
    expect(item).toMatchObject({ name: '2026-08-25', wordCount: 2, latestScorePercent: 90 });
    expect(typeof item.createdAt).toBe('string');
  });

  it('bộ chưa test lần nào → latestScorePercent null', async () => {
    const set = await prisma.daySet.create({ data: { name: 'no-test' } });
    const res = await request(app).get('/api/day-sets');
    const item = res.body.find((s: { id: number }) => s.id === set.id);
    expect(item.latestScorePercent).toBeNull();
  });
});

describe('PATCH /api/day-sets/:id', () => {
  it('đổi tên thành công', async () => {
    const set = await prisma.daySet.create({ data: { name: 'old' } });
    const res = await request(app).patch(`/api/day-sets/${set.id}`).send({ name: 'new-name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('new-name');
  });

  it('đổi sang tên bị bộ khác dùng → 409', async () => {
    await prisma.daySet.create({ data: { name: 'a' } });
    const other = await prisma.daySet.create({ data: { name: 'b' } });
    const res = await request(app).patch(`/api/day-sets/${other.id}`).send({ name: 'a' });
    expect(res.status).toBe(409);
  });

  it('id không tồn tại → 404', async () => {
    const res = await request(app).patch('/api/day-sets/999').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/day-sets/:id', () => {
  it('xoá thành công → 204, cascade hết words', async () => {
    const set = await prisma.daySet.create({
      data: { name: 'del', words: { create: { english: 'x', meaning: 'y' } } },
    });
    const res = await request(app).delete(`/api/day-sets/${set.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.word.count()).toBe(0);
  });

  it('id không tồn tại → 404', async () => {
    expect((await request(app).delete('/api/day-sets/999')).status).toBe(404);
  });
});
