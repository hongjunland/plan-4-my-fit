import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallbackPage from '../AuthCallbackPage';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../hooks/useAuth');
vi.mock('react-hot-toast');

const MockedUseAuth = useAuth as any;
const MockedToast = toast as any;

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:3000',
  search: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockedToast.success = vi.fn();
    MockedToast.error = vi.fn();
    mockLocation.search = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading state when isLoading is true', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      isFirstLogin: false,
      user: null,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    expect(screen.getByText('로그인 처리 중...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isFirstLogin: false,
      user: null,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/');
  });

  it('should redirect to profile setup for first-time users', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      isFirstLogin: true,
    };

    MockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isFirstLogin: true,
      user: mockUser,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/profile/setup');
    expect(MockedToast.success).toHaveBeenCalledWith('환영합니다, Test User님!');
  });

  it('should redirect to calendar for existing users', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      isFirstLogin: false,
    };

    MockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isFirstLogin: false,
      user: mockUser,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/calendar');
    expect(MockedToast.success).toHaveBeenCalledWith('다시 오신 것을 환영합니다, Test User님!');
  });

  it('should show error toast when OAuth error is present in URL', () => {
    mockLocation.search = '?error=access_denied&error_description=User%20denied%20access';

    MockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isFirstLogin: false,
      user: null,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    expect(MockedToast.error).toHaveBeenCalledWith('로그인에 실패했습니다. 다시 시도해주세요.');
  });

  it('should handle user without name gracefully', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: '',
      isFirstLogin: true,
    };

    MockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isFirstLogin: true,
      user: mockUser,
    });

    render(
      <RouterWrapper>
        <AuthCallbackPage />
      </RouterWrapper>
    );

    expect(MockedToast.success).toHaveBeenCalledWith('환영합니다, 님!');
  });
});