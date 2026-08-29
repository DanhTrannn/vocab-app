import { z } from 'zod';

export const daySetCreateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
});

export const daySetRenameSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const wordUpsertSchema = z.object({
  english: z.string().trim().min(1).max(100),
  meaning: z.string().trim().min(1).max(255),
  synonyms: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});

export const submitTestSchema = z.object({
  answers: z
    .array(
      z.object({
        wordId: z.number().int().positive(),
        english: z.string().optional(),
        synonyms: z.array(z.string()).optional(),
      }),
    )
    .default([]),
});

export const grammarNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
});
