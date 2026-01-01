import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useAuth from '../useAuth';
import useAuthStore from '../../stores/authStore';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  default: vi.fn(),
}));

describe('useAuth', () => {
  const mockAuthStore = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isFirstLogin: false,
    setUser: vi.fn(),
    setLoading: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    initialize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return auth store state and actions', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(mockAuthStore.user);
    expect(result.current.isAuthenticated).toBe(mockAuthStore.isAuthenticated);
    expect(result.current.isLoading).toBe(mockAuthStore.isLoading);
    expect(result.current.isFirstLogin).toBe(mockAuthStore.isFirstLogin);
    expect(result.current.signInWithGoogle).toBe(mockAuthStore.signInWithGoogle);
    expect(result.current.signOut).toBe(mockAuthStore.signOut);
    expect(result.current.setUser).toBe(mockAuthStore.setUser);
    expect(result.current.setLoading).toBe(mockAuthStore.setLoading);
    expect(result.current.initialize).toBe(mockAuthStore.initialize);
  });

  it('should call initialize on mount', () => {
    renderHook(() => useAuth());

    expect(mockAuthStore.initialize).toHaveBeenCalled();
  });

  it('should return authenticated user state', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      isFirstLogin: false,
    };

    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      user: mockUser,
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return first login state', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      isFirstLogin: true,
    };

    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      user: mockUser,
      isAuthenticated: true,
      isFirstLogin: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isFirstLogin).toBe(true);
  });

  it('should return loading state', () => {
    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      isLoading: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });
});