export interface DaySetListItem {
  id: number;
  name: string;
  createdAt: string;
  wordCount: number;
  latestScorePercent: number | null;
}

export interface WordDto {
  id: number;
  english: string;
  meaning: string;
  synonyms: string[];
}

export interface DaySetDetail {
  id: number;
  name: string;
  createdAt: string;
  words: WordDto[];
}

export interface QuizQuestion {
  wordId: number;
  meaning: string;
}

export interface Pronunciation {
  wordId: number;
  english: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  pronunciations: Pronunciation[];
}

export interface AnswerPayload {
  wordId: number;
  synonyms?: string[];
}

export interface SubmitAnswersBody {
  answers: AnswerPayload[];
}

export interface ResultSummary {
  id: number;
  takenAt: string;
  scorePercent: number;
}

export interface WordAnswerDetail {
  wordId: number;
  english: string;
  meaning: string;
  expectedWords: string[];
  correctWords: string[];
  missedWords: string[];
  scorePercent: number;
}

export interface ResultDetail {
  id: number;
  daySetId: number;
  takenAt: string;
  scorePercent: number;
  answers: WordAnswerDetail[];
}

export interface GrammarNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface ParsedWord {
  english: string;
  partOfSpeech: string;
  meaning: string;
  synonyms: string[];
}

export interface ParseResult {
  grammarTitle: string;
  grammarContent: string;
  words: ParsedWord[];
}

export interface ImportGrammarBody {
  daySetId: number;
  grammarTitle: string;
  grammarContent: string;
  words: ParsedWord[];
}

export interface ImportResult {
  grammarNote: GrammarNote;
  wordsCreated: number;
  wordsSkipped: number;
}
