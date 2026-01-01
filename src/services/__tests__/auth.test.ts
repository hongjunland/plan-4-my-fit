import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../auth';
import { supabase } from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should call Supabase OAuth with correct parameters', async () => {
      // Arrange
      const mockData = { url: 'https://oauth-url.com' };
      (supabase.auth.signInWithOAuth as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      // Act
      const result = await authService.signInWithGoogle();

      // Assert
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error when OAuth fails', async () => {
      // Arrange
      const mockError = new Error('OAuth failed');
      (supabase.auth.signInWithOAuth as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      // Act & Assert
      await expect(authService.signInWithGoogle()).rejects.toThrow('OAuth failed');
    });
  });

  describe('signOut', () => {
    it('should call Supabase signOut successfully', async () => {
      // Arrange
      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      // Act
      const result = await authService.signOut();

      // Assert
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error when signOut fails', async () => {
      // Arrange
      const mockError = new Error('SignOut failed');
      (supabase.auth.signOut as any).mockResolvedValue({
        error: mockError,
      });

      // Act & Assert
      await expect(authService.signOut()).rejects.toThrow('SignOut failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return transformed user when user exists', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://avatar.com/test.jpg',
        },
      };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: 'https://avatar.com/test.jpg',
        isFirstLogin: false,
      });
    });

    it('should return null when no user exists', async () => {
      // Arrange
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when getUser fails', async () => {
      // Arrange
      const mockError = new Error('GetUser failed');
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('checkUserProfile', () => {
    it('should return true when profile exists', async () => {
      // Arrange
      const mockProfile = { id: 'profile-123' };
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Act
      const result = await authService.checkUserProfile('user-123');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toBe(true);
    });

    it('should return false when profile does not exist', async () => {
      // Arrange
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Act
      const result = await authService.checkUserProfile('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when database error occurs', async () => {
      // Arrange
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Act
      const result = await authService.checkUserProfile('user-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      (supabase.auth.onAuthStateChange as any).mockReturnValue({
        data: { subscription: mockUnsubscribe },
      });

      // Act
      authService.onAuthStateChange(mockCallback);

      // Assert
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should call callback with transformed user when session exists', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      };
      const mockSession = { user: mockUser };

      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        // Simulate auth state change
        callback('SIGNED_IN', mockSession);
        return { data: { subscription: vi.fn() } };
      });

      // Act
      authService.onAuthStateChange(mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: undefined,
        isFirstLogin: false,
      });
    });

    it('should call callback with null when no session', () => {
      // Arrange
      const mockCallback = vi.fn();

      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        // Simulate auth state change with no session
        callback('SIGNED_OUT', null);
        return { data: { subscription: vi.fn() } };
      });

      // Act
      authService.onAuthStateChange(mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });
});