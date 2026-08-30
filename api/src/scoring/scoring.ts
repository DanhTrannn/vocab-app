export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function dedupeByNormalized(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = normalize(item);
    if (key === '' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface GradeWordInput {
  wordId: number;
  english: string;
  synonyms: string[];
  answerWords?: string[] | null;
}

export interface GradedWord {
  wordId: number;
  correctWords: string[];
  missedWords: string[];
  totalExpected: number;
  scorePercent: number;
}

/** Flatten english + synonyms into a deduplicated list of expected words. */
function expectedWords(input: GradeWordInput): string[] {
  return dedupeByNormalized([input.english, ...(input.synonyms ?? [])]);
}

/** Match user answers against expected words, case-insensitive. Returns { matched, missed }. */
function matchWords(
  userWords: string[],
  expected: string[],
): { matched: string[]; missed: string[] } {
  const expectedNorm = new Map(expected.map((w) => [normalize(w), w]));
  const matchedNorm = new Set<string>();
  const matched: string[] = [];
  const missed: string[] = [];

  for (const w of userWords) {
    const key = normalize(w);
    if (key === '' || matchedNorm.has(key)) continue;
    if (expectedNorm.has(key)) {
      matchedNorm.add(key);
      matched.push(expectedNorm.get(key)!);
    }
  }

  for (const w of expected) {
    if (!matchedNorm.has(normalize(w))) missed.push(w);
  }

  return { matched, missed };
}

/** Điểm 1 từ (%), làm tròn 1 chữ số thập phân. */
export function gradeWord(input: GradeWordInput): GradedWord {
  const expected = expectedWords(input);
  const total = expected.length;
  if (total === 0) {
    return { wordId: input.wordId, correctWords: [], missedWords: [], totalExpected: 0, scorePercent: 0 };
  }

  const userWords = input.answerWords == null ? [] : dedupeByNormalized(input.answerWords);
  const { matched, missed } = matchWords(userWords, expected);

  const scorePercent = Math.round((matched.length / total) * 1000) / 10;
  return { wordId: input.wordId, correctWords: matched, missedWords: missed, totalExpected: total, scorePercent };
}

function rawScore(input: GradeWordInput): number {
  const expected = expectedWords(input);
  const total = expected.length;
  if (total === 0) return 0;
  const userWords = input.answerWords == null ? [] : dedupeByNormalized(input.answerWords);
  const { matched } = matchWords(userWords, expected);
  return (matched.length / total) * 100;
}

/** Điểm bài test = trung bình điểm các từ (%), làm tròn 1 chữ số thập phân. */
export function gradeTest(inputs: GradeWordInput[]): { scorePercent: number; perWord: GradedWord[] } {
  if (inputs.length === 0) return { scorePercent: 0, perWord: [] };
  const perWord = inputs.map(gradeWord);
  const avg = inputs.reduce((sum, w) => sum + rawScore(w), 0) / inputs.length;
  return { scorePercent: Math.round(avg * 10) / 10, perWord };
}
