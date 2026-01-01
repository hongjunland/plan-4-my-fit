import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import useAuth from '../../hooks/useAuth';

// Mock dependencies
vi.mock('../../hooks/useAuth');
vi.mock('react-hot-toast');

const MockedUseAuth = useAuth as any;

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render login page with app title and features', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    expect(screen.getByText('Plan4MyFit')).toBeInTheDocument();
    expect(screen.getByText('AI가 만들어주는 나만의 운동 계획')).toBeInTheDocument();
    expect(screen.getByText('개인 맞춤형 운동 루틴 생성')).toBeInTheDocument();
    expect(screen.getByText('캘린더로 운동 일정 관리')).toBeInTheDocument();
    expect(screen.getByText('진행 상황 추적 및 분석')).toBeInTheDocument();
  });

  it('should render Google login button', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(screen.queryByText('Plan4MyFit')).not.toBeInTheDocument();
  });

  it('should redirect to calendar when user is authenticated', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/calendar');
  });

  it('should render terms and privacy policy links', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
  });

  it('should show app logo/icon', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <RouterWrapper>
        <LoginPage />
      </RouterWrapper>
    );

    // Check for SVG icon with proper accessibility attributes
    const icon = screen.getByRole('img', { name: /plan4myfit logo/i });
    expect(icon).toBeInTheDocument();
  });
});