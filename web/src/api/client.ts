import type {
  DaySetDetail,
  DaySetListItem,
  GrammarNote,
  ImportGrammarBody,
  ImportResult,
  ParseResult,
  QuizResponse,
  ResultDetail,
  ResultSummary,
  SubmitAnswersBody,
  WordDto,
} from '../types';

const BASE: string = import.meta.env.VITE_API_BASE ?? '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface WordUpsertBody {
  english: string;
  meaning: string;
  synonyms: string[];
}

export const api = {
  listDaySets: (): Promise<DaySetListItem[]> => http('/day-sets'),
  getDaySet: (id: number): Promise<DaySetDetail> => http(`/day-sets/${id}`),
  createDaySet: (name?: string): Promise<DaySetDetail> =>
    http('/day-sets', { method: 'POST', body: JSON.stringify(name ? { name } : {}) }),
  renameDaySet: (id: number, name: string): Promise<{ id: number; name: string; createdAt: string }> =>
    http(`/day-sets/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteDaySet: (id: number): Promise<void> => http(`/day-sets/${id}`, { method: 'DELETE' }),
  addWord: (daySetId: number, body: WordUpsertBody): Promise<WordDto> =>
    http(`/day-sets/${daySetId}/words`, { method: 'POST', body: JSON.stringify(body) }),
  updateWord: (id: number, body: WordUpsertBody): Promise<WordDto> =>
    http(`/words/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWord: (id: number): Promise<void> => http(`/words/${id}`, { method: 'DELETE' }),
  getQuiz: (daySetId: number): Promise<QuizResponse> => http(`/day-sets/${daySetId}/quiz`),
  submitTest: (daySetId: number, body: SubmitAnswersBody): Promise<ResultDetail> =>
    http(`/day-sets/${daySetId}/tests`, { method: 'POST', body: JSON.stringify(body) }),
  listResults: (daySetId: number): Promise<ResultSummary[]> => http(`/day-sets/${daySetId}/results`),
  getResult: (id: number): Promise<ResultDetail> => http(`/results/${id}`),
  listGrammarNotes: (): Promise<GrammarNote[]> => http('/grammar-notes'),
  createGrammarNote: (title: string, content: string): Promise<GrammarNote> =>
    http('/grammar-notes', { method: 'POST', body: JSON.stringify({ title, content }) }),
  updateGrammarNote: (id: number, title: string, content: string): Promise<GrammarNote> =>
    http(`/grammar-notes/${id}`, { method: 'PUT', body: JSON.stringify({ title, content }) }),
  deleteGrammarNote: (id: number): Promise<void> => http(`/grammar-notes/${id}`, { method: 'DELETE' }),
  parseGrammarText: (text: string): Promise<ParseResult> =>
    http('/grammar-notes/parse', { method: 'POST', body: JSON.stringify({ text }) }),
  importGrammarParsed: (body: ImportGrammarBody): Promise<ImportResult> =>
    http('/grammar-notes/import', { method: 'POST', body: JSON.stringify(body) }),
};
