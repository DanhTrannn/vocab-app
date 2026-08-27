import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';

vi.mock('../src/api/client', () => ({
  api: { listDaySets: vi.fn().mockResolvedValue([]) },
}));

describe('App shell', () => {
  it('render trang chủ với link về app', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Vocab App' })).toBeInTheDocument();
  });
});
