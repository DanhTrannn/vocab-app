import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App shell', () => {
  it('render trang chủ placeholder', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Từ Vựng' })).toBeInTheDocument();
  });
});
