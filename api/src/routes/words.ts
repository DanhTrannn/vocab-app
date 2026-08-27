import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { Router, type NextFunction, type Request } from 'express';
import prisma from '../lib/prisma.js';
import { ApiError, parseId } from '../lib/errors.js';
import { wordUpsertSchema } from '../schemas.js';
import { dedupeByNormalized } from '../scoring/scoring.js';

const router = Router();

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

function toWordDto(word: { id: number; english: string; meaning: string; synonyms: { text: string }[] }) {
  return { id: word.id, english: word.english, meaning: word.meaning, synonyms: word.synonyms.map((s) => s.text) };
}

function isDuplicateKeyError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

async function updateWord(wordId: number, reqBody: unknown, res: Response): Promise<void> {
  const body = { ...(reqBody as Record<string, unknown>), synonyms: ((reqBody as Record<string, unknown>).synonyms ?? []).filter((s: string) => s.trim() !== '') };
  const data = wordUpsertSchema.parse(body);
  try {
    const word = await prisma.$transaction(async (tx) => {
      await tx.word.findUniqueOrThrow({ where: { id: wordId } });
      await tx.synonym.deleteMany({ where: { wordId } });
      return tx.word.update({
        where: { id: wordId },
        data: {
          english: data.english,
          meaning: data.meaning,
          synonyms: { create: dedupeByNormalized(data.synonyms).map((text) => ({ text })) },
        },
        include: { synonyms: true },
      });
    });
    res.json(toWordDto(word));
  } catch (err) {
    if (isNotFound(err)) throw new ApiError(404, 'Word not found');
    if (isDuplicateKeyError(err)) throw new ApiError(409, 'Word already exists in this day set');
    throw err;
  }
}

router.get('/day-sets/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const set = await prisma.daySet.findUnique({
    where: { id },
    include: { words: { include: { synonyms: true }, orderBy: { id: 'asc' } } },
  });
  if (!set) throw new ApiError(404, 'Day set not found');
  res.json({
    id: set.id,
    name: set.name,
    createdAt: set.createdAt.toISOString(),
    words: set.words.map(toWordDto),
  });
}));

router.post('/day-sets/:id/words', wrap(async (req, res) => {
  const setId = parseId(req.params.id);
  const body = { ...req.body, synonyms: (req.body.synonyms ?? []).filter((s: string) => s.trim() !== '') };
  const data = wordUpsertSchema.parse(body);
  const set = await prisma.daySet.findUnique({ where: { id: setId } });
  if (!set) throw new ApiError(404, 'Day set not found');
  try {
    const word = await prisma.word.create({
      data: {
        daySetId: setId,
        english: data.english,
        meaning: data.meaning,
        synonyms: { create: dedupeByNormalized(data.synonyms).map((text) => ({ text })) },
      },
      include: { synonyms: true },
    });
    res.status(201).json(toWordDto(word));
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, 'Word already exists in this day set');
    throw err;
  }
}));

router.put('/words/:id', wrap(async (req, res) => {
  await updateWord(parseId(req.params.id), req.body, res);
}));

router.delete('/words/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  try {
    await prisma.word.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (isNotFound(err)) throw new ApiError(404, 'Word not found');
    throw err;
  }
}));

export default router;
