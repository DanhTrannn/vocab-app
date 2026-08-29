import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuizPage from '../src/pages/QuizPage';
import { api } from '../src/api/client';
import type { QuizResponse, ResultDetail } from '../src/types';

vi.mock('../src/api/client', () => ({
  api: { getQuiz: vi.fn(), submitTest: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

const quiz: QuizResponse = {
  questions: [
    { wordId: 1, meaning: 'vui vẻ' },
    { wordId: 2, meaning: 'chạy' },
  ],
  pronunciations: [
    { wordId: 1, english: 'happy' },
    { wordId: 2, english: 'run' },
  ],
};

const result: ResultDetail = {
  id: 9,
  daySetId: 1,
  takenAt: '2026-08-25T10:00:00.000Z',
  scorePercent: 100,
  answers: [
    { wordId: 1, english: 'happy', meaning: 'vui vẻ', expectedWords: ['happy', 'glad'], correctWords: ['happy', 'glad'], missedWords: [], scorePercent: 100 },
    { wordId: 2, english: 'run', meaning: 'chạy', expectedWords: ['run'], correctWords: ['run'], missedWords: [], scorePercent: 100 },
  ],
};

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={['/day-sets/1/quiz']}>
      <Routes>
        <Route path="/day-sets/:id/quiz" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getQuizSection() {
  const sections = screen.getAllByText('Làm test', { selector: 'h1' });
  return within(sections[sections.length - 1].closest('section')!);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuizPage', () => {
  it('hiện câu hỏi theo lượt, điều hướng qua lại giữ nguyên đáp án', async () => {
    mockedApi.getQuiz.mockResolvedValue(quiz);
    const user = userEvent.setup();
    renderQuiz();

    expect(await screen.findByText('vui vẻ')).toBeInTheDocument();
    expect(screen.getByText('Câu 1/2')).toBeInTheDocument();

    const sec = getQuizSection();
    await user.type(sec.getByLabelText('Từ đã nhớ'), 'happy, glad');
    await user.click(sec.getByRole('button', { name: 'Sau →' }));

    expect(sec.getByText('Câu 2/2')).toBeInTheDocument();
    expect(sec.getByText('chạy')).toBeInTheDocument();

    await user.click(sec.getByRole('button', { name: '← Trước' }));
    expect(sec.getByLabelText('Từ đã nhớ')).toHaveValue('happy, glad');
  });

  it('nộp bài → gọi submitTest và hiện kết quả', async () => {
    mockedApi.getQuiz.mockResolvedValue(quiz);
    mockedApi.submitTest.mockResolvedValue(result);
    const user = userEvent.setup();
    renderQuiz();

    await screen.findByText('vui vẻ');
    const sec = getQuizSection();
    await user.type(sec.getByLabelText('Từ đã nhớ'), 'happy, glad');
    await user.click(sec.getByRole('button', { name: 'Sau →' }));
    await user.click(sec.getByRole('button', { name: 'Nộp bài' }));

    await vi.waitFor(() =>
      expect(mockedApi.submitTest).toHaveBeenCalledWith(1, {
        answers: [{ wordId: 1, synonyms: ['happy', 'glad'] }, { wordId: 2 }],
      }),
    );
    expect(await screen.findByText('Kết quả bài test')).toBeInTheDocument();
    expect(screen.getAllByText(/100/).length).toBeGreaterThanOrEqual(1);
  });

  it('lỗi tải đề (bộ rỗng) → hiện thông báo lỗi', async () => {
    mockedApi.getQuiz.mockRejectedValue(new Error('Day set has no words'));
    renderQuiz();
    expect(await screen.findByRole('alert')).toHaveTextContent(/no words/);
  });
});
