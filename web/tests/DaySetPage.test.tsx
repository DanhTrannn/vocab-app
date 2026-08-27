import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DaySetPage from '../src/pages/DaySetPage';
import { api } from '../src/api/client';
import type { DaySetDetail, WordDto } from '../src/types';

vi.mock('../src/api/client', () => ({
  api: {
    getDaySet: vi.fn(),
    addWord: vi.fn(),
    updateWord: vi.fn(),
    deleteWord: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api, true);

const happyWord: WordDto = { id: 10, english: 'happy', meaning: 'vui vẻ', synonyms: ['glad', 'cheerful'] };
const detail: DaySetDetail = {
  id: 1,
  name: '2026-08-25',
  createdAt: '2026-08-25T00:00:00.000Z',
  words: [happyWord],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/day-sets/1']}>
      <Routes>
        <Route path="/day-sets/:id" element={<DaySetPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.getDaySet.mockResolvedValue(structuredClone(detail));
});

describe('DaySetPage', () => {
  it('hiện tên bộ, danh sách từ và nút thêm', async () => {
    renderPage();
    expect(await screen.findByText('2026-08-25')).toBeInTheDocument();
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('glad, cheerful')).toBeInTheDocument();
    expect(screen.getByLabelText('Từ tiếng Anh')).toBeInTheDocument();
  });

  it('thêm từ mới với synonyms phân tách dấu phẩy', async () => {
    mockedApi.addWord.mockResolvedValue({ id: 11, english: 'run', meaning: 'chạy', synonyms: ['jog'] });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('happy');

    await user.type(screen.getByLabelText('Từ tiếng Anh'), 'run');
    await user.type(screen.getByLabelText('Nghĩa'), 'chạy');
    await user.type(screen.getByLabelText('Từ đồng nghĩa (phân tách bằng dấu phẩy)'), 'jog');
    await user.click(screen.getByRole('button', { name: 'Thêm từ' }));

    await waitFor(() =>
      expect(mockedApi.addWord).toHaveBeenCalledWith(1, { english: 'run', meaning: 'chạy', synonyms: ['jog'] }),
    );
  });

  it('sửa từ: bấm Sửa → form đổ dữ liệu → lưu gọi updateWord', async () => {
    mockedApi.updateWord.mockResolvedValue({ ...happyWord, meaning: 'hạnh phúc' });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('happy');

    await user.click(screen.getByRole('button', { name: 'Sửa happy' }));
    const englishInput = screen.getByLabelText('Từ tiếng Anh') as HTMLInputElement;
    expect(englishInput.value).toBe('happy');

    await user.clear(screen.getByLabelText('Nghĩa'));
    await user.type(screen.getByLabelText('Nghĩa'), 'hạnh phúc');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() =>
      expect(mockedApi.updateWord).toHaveBeenCalledWith(10, {
        english: 'happy', meaning: 'hạnh phúc', synonyms: ['glad', 'cheerful'],
      }),
    );
  });

  it('xoá từ sau khi confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedApi.deleteWord.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('happy');
    await user.click(screen.getByRole('button', { name: 'Xoá từ happy' }));
    await waitFor(() => expect(mockedApi.deleteWord).toHaveBeenCalledWith(10));
  });

  it('bấm Huỷ khi đang sửa → về chế độ thêm', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('happy');
    await user.click(screen.getByRole('button', { name: 'Sửa happy' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.getByRole('button', { name: 'Thêm từ' })).toBeInTheDocument();
  });
});
