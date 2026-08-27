import { Prisma } from '@prisma/client';
import { Router, type NextFunction, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';
import { ApiError, parseId } from '../lib/errors.js';
import { daySetCreateSchema, daySetRenameSchema } from '../schemas.js';

const router = Router();

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

router.get('/day-sets', wrap(async (_req, res) => {
  const sets = await prisma.daySet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { words: true } },
      testResults: { orderBy: [{ takenAt: 'desc' }, { id: 'desc' }], take: 1, select: { scorePercent: true } },
    },
  });
  res.json(
    sets.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      wordCount: s._count.words,
      latestScorePercent: s.testResults[0]?.scorePercent ?? null,
    })),
  );
}));

router.post('/day-sets', wrap(async (req, res) => {
  const data = daySetCreateSchema.parse(req.body ?? {});
  const base = data.name ?? new Date().toISOString().slice(0, 10);
  const taken = new Set(
    (await prisma.daySet.findMany({ where: { name: { startsWith: base } }, select: { name: true } })).map((s) => s.name),
  );
  let name = base;
  let n = 2;
  while (taken.has(name)) {
    name = `${base} (${n})`;
    n += 1;
  }
  const created = await prisma.daySet.create({ data: { name } });
  res.status(201).json({ id: created.id, name: created.name, createdAt: created.createdAt.toISOString() });
}));

router.patch('/day-sets/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { name } = daySetRenameSchema.parse(req.body);
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const clash = await tx.daySet.findFirst({ where: { name, id: { not: id } } });
      if (clash) throw new ApiError(409, 'Name already used');
      return tx.daySet.update({ where: { id }, data: { name } });
    });
  } catch (err) {
    if (isNotFound(err)) throw new ApiError(404, 'Day set not found');
    throw err;
  }
  res.json({ id: updated.id, name: updated.name, createdAt: updated.createdAt.toISOString() });
}));

router.delete('/day-sets/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  try {
    await prisma.daySet.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (isNotFound(err)) throw new ApiError(404, 'Day set not found');
    throw err;
  }
}));

export default router;
