import { describe, expect, it } from 'vitest';
import { dedupeByNormalized, gradeTest, gradeWord, normalize } from '../src/scoring/scoring.js';

describe('normalize', () => {
  it('trim + lowercase', () => {
    expect(normalize('  Happy ')).toBe('happy');
  });
});

describe('dedupeByNormalized', () => {
  it('bỏ trùng (không phân biệt hoa/thường) và rỗng, giữ nguyên văn đầu tiên', () => {
    expect(dedupeByNormalized(['Glad', ' glad ', '', 'GLAD', 'cheerful'])).toEqual(['Glad', 'cheerful']);
  });
});

describe('gradeWord', () => {
  it('đúng từ chính + 2/3 synonym = 75%', () => {
    expect(
      gradeWord({
        wordId: 1,
        english: 'happy',
        synonyms: ['glad', 'cheerful', 'joyful'],
        answerEnglish: 'happy',
        answerSynonyms: ['glad', 'joyful'],
      }),
    ).toEqual({ wordId: 1, mainCorrect: true, synonymsCorrect: 2, synonymsTotal: 3, scorePercent: 75 });
  });

  it('không phân biệt hoa/thường, khoảng trắng thừa', () => {
    const g = gradeWord({
      wordId: 1, english: 'Happy', synonyms: ['Glad'],
      answerEnglish: ' happy ', answerSynonyms: ['  GLAD '],
    });
    expect(g.mainCorrect).toBe(true);
    expect(g.synonymsCorrect).toBe(1);
    expect(g.scorePercent).toBe(100);
  });

  it('gõ trùng một synonym nhiều lần chỉ tính 1 lần', () => {
    const g = gradeWord({
      wordId: 1, english: 'happy', synonyms: ['glad'],
      answerEnglish: 'happy', answerSynonyms: ['glad', 'GLAD', 'glad'],
    });
    expect(g.synonymsCorrect).toBe(1);
    expect(g.scorePercent).toBe(100);
  });

  it('gõ từ lạ ngoài danh sách không được điểm', () => {
    const g = gradeWord({
      wordId: 1, english: 'happy', synonyms: ['glad'],
      answerEnglish: 'happy', answerSynonyms: ['sad', 'unhappy'],
    });
    expect(g.synonymsCorrect).toBe(0);
    expect(g.scorePercent).toBe(50);
  });

  it('0 synonym: sai từ chính = 0%, đúng = 100%', () => {
    expect(gradeWord({ wordId: 1, english: 'run', synonyms: [], answerEnglish: 'ran' }).scorePercent).toBe(0);
    expect(gradeWord({ wordId: 1, english: 'run', synonyms: [], answerEnglish: 'run' }).scorePercent).toBe(100);
  });

  it('bỏ trống đáp án coi như sai', () => {
    const g = gradeWord({ wordId: 1, english: 'happy', synonyms: ['glad'], answerEnglish: undefined, answerSynonyms: undefined });
    expect(g.mainCorrect).toBe(false);
    expect(g.scorePercent).toBe(0);
  });
});

describe('gradeTest', () => {
  it('điểm bài = trung bình các từ, làm tròn 1 chữ số thập phân', () => {
    const { scorePercent, perWord } = gradeTest([
      { wordId: 1, english: 'a', synonyms: ['x', 'y'], answerEnglish: 'a', answerSynonyms: ['x'] }, // (1+1)/3 ≈ 66.7%
      { wordId: 2, english: 'b', synonyms: [], answerEnglish: 'zzz' },                              // 0%
    ]);
    expect(perWord[0].scorePercent).toBeCloseTo(66.7, 1);
    expect(scorePercent).toBe(33.3);
  });

  it('danh sách rỗng → 0%', () => {
    expect(gradeTest([])).toEqual({ scorePercent: 0, perWord: [] });
  });
});
