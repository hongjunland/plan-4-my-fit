import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '../authStore';
import { authService } from '../../services/auth';

// Mock auth service
vi.mock('../../services/auth', () => ({
  authService: {
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    checkUserProfile: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isFirstLogin: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFirstLogin).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication state', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isFirstLogin: false,
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isFirstLogin).toBe(false);
    });

    it('should clear user and update authentication state when user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          isFirstLogin: false,
        });
      });

      // Then clear the user
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isFirstLogin).toBe(false);
    });

    it('should set isFirstLogin correctly for new users', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockNewUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isFirstLogin: true,
      };

      act(() => {
        result.current.setUser(mockNewUser);
      });

      expect(result.current.isFirstLogin).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('signInWithGoogle', () => {
    it('should call authService.signInWithGoogle and manage loading state', async () => {
      const { result } = renderHook(() => useAuthStore());
      (authService.signInWithGoogle as any).mockResolvedValue({});

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(authService.signInWithGoogle).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle signInWithGoogle error and reset loading state', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockError = new Error('Sign in failed');
      (authService.signInWithGoogle as any).mockRejectedValue(mockError);

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow('Sign in failed');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should call authService.signOut and clear user state', async () => {
      const { result } = renderHook(() => useAuthStore());
      (authService.signOut as any).mockResolvedValue(true);

      // First set a user
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          isFirstLogin: false,
        });
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(authService.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isFirstLogin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle signOut error and reset loading state', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockError = new Error('Sign out failed');
      (authService.signOut as any).mockRejectedValue(mockError);

      await act(async () => {
        await expect(result.current.signOut()).rejects.toThrow('Sign out failed');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with existing user and set up auth state listener', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isFirstLogin: false,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.checkUserProfile as any).mockResolvedValue(true);
      (authService.onAuthStateChange as any).mockReturnValue({
        data: { subscription: vi.fn() },
      });

      await act(async () => {
        await result.current.initialize();
      });

      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(authService.checkUserProfile).toHaveBeenCalledWith('user-123');
      expect(authService.onAuthStateChange).toHaveBeenCalled();
      expect(result.current.user).toEqual({
        ...mockUser,
        isFirstLogin: false,
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with first-time user', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isFirstLogin: false,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.checkUserProfile as any).mockResolvedValue(false); // No profile exists
      (authService.onAuthStateChange as any).mockReturnValue({
        data: { subscription: vi.fn() },
      });

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        isFirstLogin: true,
      });
      expect(result.current.isFirstLogin).toBe(true);
    });

    it('should initialize with no user', async () => {
      const { result } = renderHook(() => useAuthStore());

      (authService.getCurrentUser as any).mockResolvedValue(null);
      (authService.onAuthStateChange as any).mockReturnValue({
        data: { subscription: vi.fn() },
      });

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isFirstLogin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle initialization error', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mockError = new Error('Initialization failed');

      (authService.getCurrentUser as any).mockRejectedValue(mockError);

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isFirstLogin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });
});