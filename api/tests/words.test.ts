import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';

const app = createApp();

async function seedSet() {
  return prisma.daySet.create({ data: { name: `set-${Math.random()}` } });
}

describe('GET /api/day-sets/:id', () => {
  it('trả chi tiết kèm words + synonyms', async () => {
    const set = await prisma.daySet.create({
      data: {
        name: 'd1',
        words: { create: { english: 'happy', meaning: 'vui', synonyms: { create: [{ text: 'glad' }, { text: 'cheerful' }] } } },
      },
    });
    const res = await request(app).get(`/api/day-sets/${set.id}`);
    expect(res.status).toBe(200);
    expect(res.body.words).toHaveLength(1);
    expect(res.body.words[0].english).toBe('happy');
    expect([...res.body.words[0].synonyms].sort()).toEqual(['cheerful', 'glad']);
  });

  it('404 khi bộ không tồn tại', async () => {
    expect((await request(app).get('/api/day-sets/999')).status).toBe(404);
  });
});

describe('POST /api/day-sets/:id/words', () => {
  it('tạo từ với synonyms đã dedupe, giữ nguyên hoa gốc', async () => {
    const set = await seedSet();
    const res = await request(app).post(`/api/day-sets/${set.id}/words`).send({
      english: 'happy', meaning: 'vui vẻ', synonyms: ['Glad', ' glad ', ''],
    });
    expect(res.status).toBe(201);
    expect(res.body.synonyms).toEqual(['Glad']);
  });

  it('trùng english trong cùng bộ (không phân biệt hoa/thường) → 409', async () => {
    const set = await seedSet();
    await request(app).post(`/api/day-sets/${set.id}/words`).send({ english: 'happy', meaning: 'vui' });
    const res = await request(app).post(`/api/day-sets/${set.id}/words`).send({ english: 'HAPPY ', meaning: 'vui' });
    expect(res.status).toBe(409);
  });

  it('trùng english nhưng ở bộ khác thì vẫn cho phép', async () => {
    const s1 = await seedSet();
    const s2 = await seedSet();
    await request(app).post(`/api/day-sets/${s1.id}/words`).send({ english: 'happy', meaning: 'vui' });
    const res = await request(app).post(`/api/day-sets/${s2.id}/words`).send({ english: 'happy', meaning: 'vui' });
    expect(res.status).toBe(201);
  });

  it('404 khi bộ không tồn tại', async () => {
    expect(
      (await request(app).post('/api/day-sets/999/words').send({ english: 'x', meaning: 'y' })).status,
    ).toBe(404);
  });
});

describe('PUT /api/words/:id', () => {
  it('sửa từ và thay toàn bộ synonyms', async () => {
    const set = await prisma.daySet.create({
      data: { name: 'd', words: { create: { english: 'happy', meaning: 'vui', synonyms: { create: [{ text: 'glad' }] } } } },
    });
    const word = await prisma.word.findFirstOrThrow({ where: { daySetId: set.id } });
    const res = await request(app).put(`/api/words/${word.id}`).send({ english: 'sad', meaning: 'buồn', synonyms: ['unhappy'] });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ english: 'sad', meaning: 'buồn', synonyms: ['unhappy'] });
  });

  it('404 khi từ không tồn tại', async () => {
    expect(
      (await request(app).put('/api/words/999').send({ english: 'a', meaning: 'b' })).status,
    ).toBe(404);
  });
});

describe('DELETE /api/words/:id', () => {
  it('xoá từ → 204', async () => {
    const set = await prisma.daySet.create({
      data: { name: 'd', words: { create: { english: 'x', meaning: 'y' } } },
    });
    const word = await prisma.word.findFirstOrThrow({ where: { daySetId: set.id } });
    expect((await request(app).delete(`/api/words/${word.id}`)).status).toBe(204);
    expect(await prisma.word.count()).toBe(0);
  });

  it('404 khi không tồn tại', async () => {
    expect((await request(app).delete('/api/words/999')).status).toBe(404);
  });
});
