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
      wordId: 1, english: 'happy', meaning: 'vui vẻ',
      expectedWords: ['happy', 'glad', 'cheerful'],
      correctWords: ['happy', 'glad'],
      missedWords: ['cheerful'],
      scorePercent: 66.7,
    },
    {
      wordId: 2, english: 'run', meaning: 'chạy',
      expectedWords: ['run'],
      correctWords: [],
      missedWords: ['run'],
      scorePercent: 0,
    },
  ],
};

describe('ResultDetailView', () => {
  it('hiện từ đã nhớ và từ chưa nhớ', () => {
    render(<ResultDetailView detail={detail} />);
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('glad')).toBeInTheDocument();
    expect(screen.getByText('cheerful')).toBeInTheDocument();
    expect(screen.getByText('run')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
