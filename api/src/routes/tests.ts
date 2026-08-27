import { Router, type NextFunction, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';
import { ApiError, parseId } from '../lib/errors.js';
import { submitTestSchema } from '../schemas.js';
import { gradeTest } from '../scoring/scoring.js';

const router = Router();

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

export interface WordAnswerDetail {
  wordId: number;
  english: string;
  meaning: string;
  declaredSynonyms: string[];
  mainCorrect: boolean;
  synonymsCorrect: number;
  synonymsTotal: number;
}

export interface ResultDetail {
  id: number;
  daySetId: number;
  takenAt: string;
  scorePercent: number;
  answers: WordAnswerDetail[];
}

export async function getResultDetail(resultId: number): Promise<ResultDetail> {
  const r = await prisma.testResult.findUnique({
    where: { id: resultId },
    include: { answers: { include: { word: { include: { synonyms: true } } } } },
  });
  if (!r) throw new ApiError(404, 'Result not found');
  return {
    id: r.id,
    daySetId: r.daySetId,
    takenAt: r.takenAt.toISOString(),
    scorePercent: r.scorePercent,
    answers: r.answers.map((a) => ({
      wordId: a.wordId,
      english: a.word.english,
      meaning: a.word.meaning,
      declaredSynonyms: a.word.synonyms.map((s) => s.text),
      mainCorrect: a.mainCorrect,
      synonymsCorrect: a.synonymsCorrect,
      synonymsTotal: a.synonymsTotal,
    })),
  };
}

async function requireNonEmptySet(daySetId: number): Promise<void> {
  const count = await prisma.word.count({ where: { daySetId } });
  if (count === 0) throw new ApiError(400, 'Day set has no words');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.get('/day-sets/:id/quiz', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const set = await prisma.daySet.findUnique({ where: { id } });
  if (!set) throw new ApiError(404, 'Day set not found');
  await requireNonEmptySet(id);
  const words = await prisma.word.findMany({
    where: { daySetId: id },
    select: { id: true, meaning: true, english: true },
  });
  res.json({
    questions: shuffle(words.map((w) => ({ wordId: w.id, meaning: w.meaning }))),
    pronunciations: words.map((w) => ({ wordId: w.id, english: w.english })),
  });
}));

router.post('/day-sets/:id/tests', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const set = await prisma.daySet.findUnique({ where: { id } });
  if (!set) throw new ApiError(404, 'Day set not found');
  await requireNonEmptySet(id);
  const body = submitTestSchema.parse(req.body);

  const words = await prisma.word.findMany({ where: { daySetId: id }, include: { synonyms: true } });
  const byId = new Map(body.answers.map((a) => [a.wordId, a]));
  const graded = gradeTest(
    words.map((w) => ({
      wordId: w.id,
      english: w.english,
      synonyms: w.synonyms.map((s) => s.text),
      answerEnglish: byId.get(w.id)?.english,
      answerSynonyms: byId.get(w.id)?.synonyms,
    })),
  );

  const created = await prisma.testResult.create({
    data: {
      daySetId: id,
      scorePercent: graded.scorePercent,
      answers: {
        create: graded.perWord.map((g) => ({
          wordId: g.wordId,
          mainCorrect: g.mainCorrect,
          synonymsCorrect: g.synonymsCorrect,
          synonymsTotal: g.synonymsTotal,
        })),
      },
    },
  });
  res.status(201).json(await getResultDetail(created.id));
}));

router.get('/day-sets/:id/results', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const set = await prisma.daySet.findUnique({ where: { id } });
  if (!set) throw new ApiError(404, 'Day set not found');
  const results = await prisma.testResult.findMany({
    where: { daySetId: id },
    orderBy: [{ takenAt: 'desc' }, { id: 'desc' }],
    select: { id: true, takenAt: true, scorePercent: true },
  });
  res.json(results.map((r) => ({ id: r.id, takenAt: r.takenAt.toISOString(), scorePercent: r.scorePercent })));
}));

router.get('/results/:id', wrap(async (req, res) => {
  res.json(await getResultDetail(parseId(req.params.id)));
}));

export default router;
