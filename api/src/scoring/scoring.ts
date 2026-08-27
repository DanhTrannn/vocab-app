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
  answerEnglish?: string | null;
  answerSynonyms?: string[] | null;
}

export interface GradedWord {
  wordId: number;
  mainCorrect: boolean;
  synonymsCorrect: number;
  synonymsTotal: number;
  scorePercent: number;
}

/** Điểm 1 từ (%), làm tròn 1 chữ số thập phân. */
export function gradeWord(input: GradeWordInput): GradedWord {
  const declared = dedupeByNormalized(input.synonyms ?? []);
  const total = 1 + declared.length;

  const answer = input.answerEnglish == null ? '' : normalize(input.answerEnglish);
  const mainCorrect = answer !== '' && answer === normalize(input.english);

  const answered = input.answerSynonyms == null ? [] : dedupeByNormalized(input.answerSynonyms);
  const declaredSet = new Set(declared.map(normalize));
  const synonymsCorrect = answered.filter((a) => declaredSet.has(normalize(a))).length;

  const scorePercent = Math.round((((mainCorrect ? 1 : 0) + synonymsCorrect) / total) * 1000) / 10;
  return { wordId: input.wordId, mainCorrect, synonymsCorrect, synonymsTotal: declared.length, scorePercent };
}

function rawScore(input: GradeWordInput): number {
  const declared = dedupeByNormalized(input.synonyms ?? []);
  const total = 1 + declared.length;
  const answer = input.answerEnglish == null ? '' : normalize(input.answerEnglish);
  const mainCorrect = answer !== '' && answer === normalize(input.english);
  const answered = input.answerSynonyms == null ? [] : dedupeByNormalized(input.answerSynonyms);
  const declaredSet = new Set(declared.map(normalize));
  const synonymsCorrect = answered.filter((a) => declaredSet.has(normalize(a))).length;
  return ((mainCorrect ? 1 : 0) + synonymsCorrect) / total * 100;
}

/** Điểm bài test = trung bình điểm các từ (%), làm tròn 1 chữ số thập phân. */
export function gradeTest(inputs: GradeWordInput[]): { scorePercent: number; perWord: GradedWord[] } {
  if (inputs.length === 0) return { scorePercent: 0, perWord: [] };
  const perWord = inputs.map(gradeWord);
  const avg = inputs.reduce((sum, w) => sum + rawScore(w), 0) / inputs.length;
  return { scorePercent: Math.round(avg * 10) / 10, perWord };
}
