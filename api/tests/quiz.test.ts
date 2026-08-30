import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';

const app = createApp();

async function seedSetWithWords() {
  return prisma.daySet.create({
    data: {
      name: 'quiz-set',
      words: {
        create: [
          { english: 'happy', meaning: 'vui vẻ', synonyms: { create: [{ text: 'glad' }, { text: 'cheerful' }] } },
          { english: 'run', meaning: 'chạy', synonyms: { create: [] } },
        ],
      },
    },
    include: { words: { include: { synonyms: true } } },
  });
}

describe('GET /api/day-sets/:id/quiz', () => {
  it('trả đủ câu hỏi không lộ đáp án + danh sách pronunciations', async () => {
    const set = await seedSetWithWords();
    const res = await request(app).get(`/api/day-sets/${set.id}/quiz`);
    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(2);
    for (const q of res.body.questions) {
      expect(Object.keys(q).sort()).toEqual(['meaning', 'wordId']);
    }
    expect(res.body.pronunciations).toHaveLength(2);
    for (const p of res.body.pronunciations) {
      expect(Object.keys(p).sort()).toEqual(['english', 'wordId']);
    }
  });

  it('400 nếu bộ rỗng', async () => {
    const set = await prisma.daySet.create({ data: { name: 'empty' } });
    const res = await request(app).get(`/api/day-sets/${set.id}/quiz`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Day set has no words');
  });

  it('404 nếu bộ không tồn tại', async () => {
    expect((await request(app).get('/api/day-sets/999/quiz')).status).toBe(404);
  });
});

describe('POST /api/day-sets/:id/tests', () => {
  it('chấm đúng công thức và lưu kết quả vào DB', async () => {
    const set = await seedSetWithWords();
    const happy = set.words.find((w) => w.english === 'happy')!;
    const run = set.words.find((w) => w.english === 'run')!;

    const res = await request(app).post(`/api/day-sets/${set.id}/tests`).send({
      answers: [
        { wordId: happy.id, english: 'HAPPY', synonyms: ['glad'] }, // 2/3 ≈ 66.7%
        { wordId: run.id, english: 'wrong' },                       // 0%
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.scorePercent).toBeCloseTo(33.3, 1);
    expect(res.body.answers).toHaveLength(2);

    const stored = await prisma.testResult.findFirstOrThrow({
      where: { daySetId: set.id },
      include: { answers: true },
    });
    expect(stored.scorePercent).toBeCloseTo(33.3, 1);
    expect(stored.answers).toHaveLength(2);
  });

  it('thiếu đáp án của 1 từ → từ đó tính sai, vẫn chấm đủ số từ', async () => {
    const set = await seedSetWithWords();
    const happy = set.words.find((w) => w.english === 'happy')!;
    const res = await request(app).post(`/api/day-sets/${set.id}/tests`).send({
      answers: [{ wordId: happy.id, english: 'happy' }],
    });
    expect(res.body.answers).toHaveLength(2);
    const runAnswer = res.body.answers.find((a: { english: string }) => a.english === 'run');
    expect(runAnswer.correctWords).toEqual([]);
    expect(runAnswer.missedWords).toEqual(['run']);
  });

  it('400 nếu bộ rỗng', async () => {
    const set = await prisma.daySet.create({ data: { name: 'empty' } });
    expect(
      (await request(app).post(`/api/day-sets/${set.id}/tests`).send({ answers: [] })).status,
    ).toBe(400);
  });

  it('404 nếu bộ không tồn tại', async () => {
    expect(
      (await request(app).post('/api/day-sets/999/tests').send({ answers: [] })).status,
    ).toBe(404);
  });
});

describe('GET /api/day-sets/:id/results', () => {
  it('liệt kê lịch sử mới nhất trước', async () => {
    const set = await prisma.daySet.create({
      data: { name: 'r', testResults: { create: [{ scorePercent: 50 }, { scorePercent: 100 }] } },
    });
    const res = await request(app).get(`/api/day-sets/${set.id}/results`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].scorePercent).toBeGreaterThanOrEqual(res.body[1].scorePercent);
    for (const item of res.body) {
      expect(typeof item.takenAt).toBe('string');
      expect(Object.keys(item).sort()).toEqual(['id', 'scorePercent', 'takenAt']);
    }
  });

  it('bộ không tồn tại → 404', async () => {
    expect((await request(app).get('/api/day-sets/999/results')).status).toBe(404);
  });
});

describe('GET /api/results/:id', () => {
  it('trả chi tiết kèm đáp án từng từ', async () => {
    const set = await seedSetWithWords();
    const submitted = await request(app).post(`/api/day-sets/${set.id}/tests`).send({ answers: [] });
    const detail = await request(app).get(`/api/results/${submitted.body.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.answers).toHaveLength(2);
    expect(detail.body.answers[0]).toHaveProperty('expectedWords');
    expect(detail.body.answers[0]).toHaveProperty('correctWords');
    expect(detail.body.answers[0]).toHaveProperty('missedWords');
  });

  it('404 khi không tồn tại', async () => {
    expect((await request(app).get('/api/results/999')).status).toBe(404);
  });
});
