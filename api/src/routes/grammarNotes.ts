import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError, parseId } from '../lib/errors.js';
import { grammarNoteSchema } from '../schemas.js';
import { parseGrammarInput, type ParseResult } from '../lib/parser.js';

const router = Router();

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

router.get('/grammar-notes', wrap(async (_req, res) => {
  const notes = await prisma.grammarNote.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  res.json(notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
  })));
}));

router.post('/grammar-notes', wrap(async (req, res) => {
  const body = grammarNoteSchema.parse(req.body);
  const created = await prisma.grammarNote.create({ data: body });
  res.status(201).json({
    id: created.id,
    title: created.title,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
  });
}));

router.put('/grammar-notes/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const body = grammarNoteSchema.parse(req.body);
  try {
    const updated = await prisma.grammarNote.update({ where: { id }, data: body });
    res.json({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch {
    throw new ApiError(404, 'Grammar note not found');
  }
}));

router.delete('/grammar-notes/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  try {
    await prisma.grammarNote.delete({ where: { id } });
    res.status(204).end();
  } catch {
    throw new ApiError(404, 'Grammar note not found');
  }
}));

const parseSchema = z.object({ text: z.string().min(1) });
const importSchema = z.object({
  daySetId: z.number().int().positive(),
  grammarTitle: z.string().min(1),
  grammarContent: z.string().min(1),
  words: z.array(z.object({
    english: z.string(),
    partOfSpeech: z.string(),
    meaning: z.string(),
    synonyms: z.array(z.string()),
  })),
});

router.post('/grammar-notes/parse', wrap(async (req, res) => {
  const { text } = parseSchema.parse(req.body);
  const result: ParseResult = parseGrammarInput(text);
  res.json(result);
}));

router.post('/grammar-notes/import', wrap(async (req, res) => {
  const body = importSchema.parse(req.body);

  const grammarNote = await prisma.grammarNote.create({
    data: { title: body.grammarTitle, content: body.grammarContent },
  });

  const createdWords: { id: number; english: string }[] = [];
  for (const w of body.words) {
    const existing = await prisma.word.findFirst({
      where: { daySetId: body.daySetId, english: w.english },
    });
    if (existing) continue;

    const word = await prisma.word.create({
      data: {
        daySetId: body.daySetId,
        english: w.english,
        meaning: w.meaning,
        synonyms: { create: w.synonyms.map((s) => ({ text: s })) },
      },
    });
    createdWords.push({ id: word.id, english: word.english });
  }

  res.status(201).json({
    grammarNote: {
      id: grammarNote.id,
      title: grammarNote.title,
      content: grammarNote.content,
      createdAt: grammarNote.createdAt.toISOString(),
    },
    wordsCreated: createdWords.length,
    wordsSkipped: body.words.length - createdWords.length,
  });
}));

export default router;
