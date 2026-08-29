import { Router, type NextFunction, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';
import { ApiError, parseId } from '../lib/errors.js';
import { grammarNoteSchema } from '../schemas.js';

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

export default router;
