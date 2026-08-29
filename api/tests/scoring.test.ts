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
  it('đúng 2/3 từ → 66.7%', () => {
    const g = gradeWord({
      wordId: 1,
      english: 'happy',
      synonyms: ['glad', 'cheerful'],
      answerWords: ['happy', 'glad'],
    });
    expect(g.correctWords).toEqual(['happy', 'glad']);
    expect(g.missedWords).toEqual(['cheerful']);
    expect(g.totalExpected).toBe(3);
    expect(g.scorePercent).toBeCloseTo(66.7, 1);
  });

  it('không phân biệt hoa/thường, khoảng trắng thừa', () => {
    const g = gradeWord({
      wordId: 1, english: 'Happy', synonyms: ['Glad'],
      answerWords: [' happy ', '  GLAD '],
    });
    expect(g.correctWords).toEqual(['Happy', 'Glad']);
    expect(g.missedWords).toEqual([]);
    expect(g.scorePercent).toBe(100);
  });

  it('gõ trùng một từ nhiều lần chỉ tính 1 lần', () => {
    const g = gradeWord({
      wordId: 1, english: 'happy', synonyms: ['glad'],
      answerWords: ['happy', 'GLAD', 'glad'],
    });
    expect(g.correctWords).toEqual(['happy', 'glad']);
    expect(g.missedWords).toEqual([]);
    expect(g.scorePercent).toBe(100);
  });

  it('gõ từ lạ ngoài danh sách không được điểm', () => {
    const g = gradeWord({
      wordId: 1, english: 'happy', synonyms: ['glad'],
      answerWords: ['happy', 'sad', 'unhappy'],
    });
    expect(g.correctWords).toEqual(['happy']);
    expect(g.missedWords).toEqual(['glad']);
    expect(g.scorePercent).toBe(50);
  });

  it('0 synonym: không nhập gì = 0%, nhập đúng = 100%', () => {
    expect(gradeWord({ wordId: 1, english: 'run', synonyms: [], answerWords: undefined }).scorePercent).toBe(0);
    expect(gradeWord({ wordId: 1, english: 'run', synonyms: [], answerWords: ['run'] }).scorePercent).toBe(100);
  });

  it('bỏ trống đáp án coi như sai', () => {
    const g = gradeWord({ wordId: 1, english: 'happy', synonyms: ['glad'], answerWords: undefined });
    expect(g.correctWords).toEqual([]);
    expect(g.missedWords).toEqual(['happy', 'glad']);
    expect(g.scorePercent).toBe(0);
  });

  it('từ chính cũng ngang hàng với đồng nghĩa', () => {
    const g = gradeWord({
      wordId: 1, english: 'happy', synonyms: ['glad', 'cheerful'],
      answerWords: ['glad', 'cheerful'],
    });
    expect(g.correctWords).toEqual(['glad', 'cheerful']);
    expect(g.missedWords).toEqual(['happy']);
    expect(g.scorePercent).toBeCloseTo(66.7, 1);
  });
});

describe('gradeTest', () => {
  it('điểm bài = trung bình các từ, làm tròn 1 chữ số thập phân', () => {
    const { scorePercent, perWord } = gradeTest([
      { wordId: 1, english: 'a', synonyms: ['x', 'y'], answerWords: ['a', 'x'] }, // 2/3 ≈ 66.7%
      { wordId: 2, english: 'b', synonyms: [], answerWords: ['zzz'] },              // 0%
    ]);
    expect(perWord[0].scorePercent).toBeCloseTo(66.7, 1);
    expect(scorePercent).toBe(33.3);
  });

  it('danh sách rỗng → 0%', () => {
    expect(gradeTest([])).toEqual({ scorePercent: 0, perWord: [] });
  });
});
