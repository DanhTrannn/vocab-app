import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResultsPage from '../src/pages/ResultsPage';
import { api } from '../src/api/client';
import type { DaySetDetail, ResultDetail, ResultSummary } from '../src/types';

vi.mock('../src/api/client', () => ({
  api: {
    getDaySet: vi.fn(),
    listResults: vi.fn(),
    getResult: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api, true);

const daySet: DaySetDetail = { id: 1, name: '2026-08-25', createdAt: 'x', words: [] };
const history: ResultSummary[] = [
  { id: 7, takenAt: '2026-08-25T10:00:00.000Z', scorePercent: 87.5 },
];
const detail: ResultDetail = {
  id: 7,
  daySetId: 1,
  takenAt: '2026-08-25T10:00:00.000Z',
  scorePercent: 87.5,
  answers: [
    {
      wordId: 1, english: 'happy', meaning: 'vui vẻ',
      expectedWords: ['happy', 'glad'],
      correctWords: ['happy', 'glad'],
      missedWords: [],
      scorePercent: 100,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/day-sets/1/results']}>
      <Routes>
        <Route path="/day-sets/:id/results" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.getDaySet.mockResolvedValue(daySet);
  mockedApi.getResult.mockResolvedValue(detail);
});

describe('ResultsPage', () => {
  it('hiện tên bộ, lịch sử các lần test; click xem chi tiết', async () => {
    mockedApi.listResults.mockResolvedValue(history);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Kết quả' })).toBeInTheDocument();
    expect(screen.getByText('87.5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem chi tiết kết quả #7' }));
    expect(await screen.findByText('happy')).toBeInTheDocument();
  });

  it('chưa có lần test nào → thông báo rỗng', async () => {
    mockedApi.listResults.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('Chưa có kết quả')).toBeInTheDocument();
  });
});
