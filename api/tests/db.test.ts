import { describe, expect, it } from 'vitest';
import prisma from '../src/lib/prisma.js';

describe('schema cascade', () => {
  it('xoá DaySet xoá luôn words + synonyms', async () => {
    const set = await prisma.daySet.create({
      data: {
        name: '2026-08-25',
        words: {
          create: { english: 'happy', meaning: 'vui vẻ', synonyms: { create: [{ text: 'glad' }] } },
        },
      },
    });
    const word = await prisma.word.findFirstOrThrow({ where: { daySetId: set.id } });

    await prisma.daySet.delete({ where: { id: set.id } });

    expect(await prisma.word.findUnique({ where: { id: word.id } })).toBeNull();
    expect(await prisma.synonym.count()).toBe(0);
  });
});
