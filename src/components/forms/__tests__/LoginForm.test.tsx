import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import useAuth from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('react-hot-toast');

const MockedUseAuth = useAuth as any;
const MockedToast = toast as any;

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LoginForm', () => {
  const mockSignInWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockedUseAuth.mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
    });
    MockedToast.success = vi.fn();
    MockedToast.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render Google login button', () => {
    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should call signInWithGoogle when button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue({});

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should show success toast on successful login', async () => {
    mockSignInWithGoogle.mockResolvedValue({});

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(MockedToast.success).toHaveBeenCalledWith('로그인 중입니다...');
    });
  });

  it('should show error toast on login failure', async () => {
    const mockError = new Error('Login failed');
    mockSignInWithGoogle.mockRejectedValue(mockError);

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(MockedToast.error).toHaveBeenCalledWith('로그인에 실패했습니다. 다시 시도해주세요.');
    });
  });

  it('should show loading state during login', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockSignInWithGoogle.mockReturnValue(loginPromise);

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('로그인 중...')).toBeInTheDocument();
    });

    // Resolve the login
    resolveLogin!({});

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Google로 계속하기')).toBeInTheDocument();
    });
  });

  it('should disable button during login', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockSignInWithGoogle.mockReturnValue(loginPromise);

    render(
      <RouterWrapper>
        <LoginForm />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    // Button should be disabled during login
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });

    // Resolve the login
    resolveLogin!({});

    // Button should be enabled again
    await waitFor(() => {
      expect(loginButton).not.toBeDisabled();
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const mockOnSuccess = vi.fn();
    mockSignInWithGoogle.mockResolvedValue({});

    render(
      <RouterWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </RouterWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /google로 계속하기/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});