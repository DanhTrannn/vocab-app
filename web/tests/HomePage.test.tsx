import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../src/pages/HomePage';
import { api } from '../src/api/client';
import type { DaySetDetail, DaySetListItem } from '../src/types';

vi.mock('../src/api/client', () => ({
  api: {
    listDaySets: vi.fn(),
    createDaySet: vi.fn(),
    deleteDaySet: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api, true);

const sampleRows: DaySetListItem[] = [
  { id: 1, name: '2026-08-25', createdAt: '2026-08-25T00:00:00.000Z', wordCount: 10, latestScorePercent: 87.5 },
  { id: 2, name: 'chua-test', createdAt: '2026-08-24T00:00:00.000Z', wordCount: 0, latestScorePercent: null },
];

const createdDetail: DaySetDetail = { id: 9, name: '2026-08-26', createdAt: '2026-08-26T00:00:00.000Z', words: [] };

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HomePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HomePage', () => {
  it('hiện danh sách bộ từ với số từ và điểm gần nhất', async () => {
    mockedApi.listDaySets.mockResolvedValue(sampleRows);
    renderHome();
    expect(await screen.findByText('2026-08-25')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // bộ chưa test
    expect(screen.getByText('10 từ')).toBeInTheDocument();
  });

  it('tạo bộ mới: gọi createDaySet với tên nhập và load lại danh sách', async () => {
    mockedApi.listDaySets.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 9, name: '2026-08-26', createdAt: 'x', wordCount: 0, latestScorePercent: null },
    ]);
    mockedApi.createDaySet.mockResolvedValue(createdDetail);
    const user = userEvent.setup();
    renderHome();

    const input = await screen.findByLabelText('Tên bộ từ');
    await user.clear(input);
    await user.type(input, '2026-08-26');
    await user.click(screen.getByRole('button', { name: '+ Tạo bộ mới' }));

    await waitFor(() => expect(mockedApi.createDaySet).toHaveBeenCalledWith('2026-08-26'));
    expect(await screen.findByText('2026-08-26')).toBeInTheDocument();
  });

  it('xoá bộ sau khi confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedApi.listDaySets.mockResolvedValue(sampleRows);
    mockedApi.deleteDaySet.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('2026-08-25');
    await user.click(screen.getByRole('button', { name: /Xoá bộ 2026-08-25/ }));
    await waitFor(() => expect(mockedApi.deleteDaySet).toHaveBeenCalledWith(1));
  });

  it('lỗi tải danh sách → hiện thông báo', async () => {
    mockedApi.listDaySets.mockRejectedValue(new Error('Server bận'));
    renderHome();
    expect(await screen.findByText(/Server bận/)).toBeInTheDocument();
  });
});