import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultDetailView from '../src/components/ResultDetailView';
import type { ResultDetail } from '../src/types';

const detail: ResultDetail = {
  id: 5,
  daySetId: 1,
  takenAt: '2026-08-25T10:00:00.000Z',
  scorePercent: 75,
  answers: [
    {
      wordId: 1, english: 'happy', meaning: 'vui vẻ', declaredSynonyms: ['glad', 'cheerful'],
      mainCorrect: true, synonymsCorrect: 1, synonymsTotal: 2,
    },
    {
      wordId: 2, english: 'run', meaning: 'chạy', declaredSynonyms: [],
      mainCorrect: false, synonymsCorrect: 0, synonymsTotal: 0,
    },
  ],
};

describe('ResultDetailView', () => {
  it('hiện chi tiết từng từ', () => {
    render(<ResultDetailView detail={detail} />);
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('Đúng')).toBeInTheDocument();
    expect(screen.getByText('Sai')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('glad')).toBeInTheDocument();
    expect(screen.getByText('cheerful')).toBeInTheDocument();
  });
});
