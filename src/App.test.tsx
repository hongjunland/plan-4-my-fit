import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app with layout', () => {
    render(<App />);
    // Check that the app renders with the header title
    expect(screen.getByText('헬스 루틴 플래너')).toBeInTheDocument();
  });

  it('renders the bottom navigation', () => {
    render(<App />);
    // Check that bottom navigation items are present (인스타그램 스타일 순서)
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('루틴')).toBeInTheDocument();
    expect(screen.getByText('현황')).toBeInTheDocument();
    expect(screen.getByText('마이')).toBeInTheDocument();
  });
});
