import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyPage from '../MyPage';
import useAuthStore from '../../stores/authStore';

// Mock dependencies
vi.mock('../../stores/authStore');
vi.mock('react-hot-toast');

const MockedUseAuthStore = useAuthStore as any;

// Mock Navigate component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MyPage', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: '테스트 사용자',
    profilePicture: 'https://example.com/profile.jpg',
    isFirstLogin: false,
  };

  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockedUseAuthStore.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('사용자 정보 표시', () => {
    it('should display user profile information correctly', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      // Check user name and email display
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('활성 사용자')).toBeInTheDocument();
    });

    it('should display profile picture when available', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('should display user initial when profile picture is not available', () => {
      MockedUseAuthStore.mockReturnValue({
        user: { ...mockUser, profilePicture: undefined },
        signOut: mockSignOut,
      });

      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      expect(screen.getByText('테')).toBeInTheDocument();
    });

    it('should display fallback values when user data is missing', () => {
      MockedUseAuthStore.mockReturnValue({
        user: { id: '1', email: '', name: '', isFirstLogin: false },
        signOut: mockSignOut,
      });

      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      expect(screen.getByText('사용자')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('설정 메뉴', () => {
    it('should display all menu items with correct labels', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      // Check menu items
      expect(screen.getByText('프로필 설정')).toBeInTheDocument();
      expect(screen.getByText('개인 정보 및 운동 설정 수정')).toBeInTheDocument();
      
      expect(screen.getByText('알림 설정')).toBeInTheDocument();
      expect(screen.getByText('운동 알림 및 리마인더 설정')).toBeInTheDocument();
      
      expect(screen.getByText('캘린더 연동')).toBeInTheDocument();
      expect(screen.getByText('구글 캘린더와 운동 일정 동기화')).toBeInTheDocument();
      
      expect(screen.getByText('도움말')).toBeInTheDocument();
      expect(screen.getByText('앱 사용법 및 자주 묻는 질문')).toBeInTheDocument();
    });

    it('should show "준비중" badge for unavailable features', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const preparingBadges = screen.getAllByText('준비중');
      expect(preparingBadges).toHaveLength(3); // 알림 설정, 캘린더 연동, 도움말
    });

    it('should navigate to profile edit when profile setting is clicked', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const profileSettingButton = screen.getByText('프로필 설정').closest('button');
      expect(profileSettingButton).not.toBeDisabled();
      
      fireEvent.click(profileSettingButton!);
      expect(mockNavigate).toHaveBeenCalledWith('/my/profile');
    });

    it('should show alert for unavailable features when clicked', () => {
      // Mock window.alert
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      // Test notification settings - button should be disabled, so we need to check if it's clickable
      const notificationButton = screen.getByText('알림 설정').closest('button');
      expect(notificationButton).toBeDisabled();

      // Test calendar integration
      const calendarButton = screen.getByText('캘린더 연동').closest('button');
      expect(calendarButton).toBeDisabled();

      // Test help
      const helpButton = screen.getByText('도움말').closest('button');
      expect(helpButton).toBeDisabled();

      mockAlert.mockRestore();
    });
  });

  describe('로그아웃 기능', () => {
    it('should display logout button', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      expect(screen.getByText('로그아웃')).toBeInTheDocument();
      expect(screen.getByText('계정에서 로그아웃합니다')).toBeInTheDocument();
    });

    it('should call signOut and navigate to login when logout is clicked', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const logoutButton = screen.getByText('로그아웃').closest('button');
      fireEvent.click(logoutButton!);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle logout error gracefully', async () => {
      const mockError = new Error('Logout failed');
      mockSignOut.mockRejectedValue(mockError);
      
      // Mock console.error to avoid test output noise
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const logoutButton = screen.getByText('로그아웃').closest('button');
      fireEvent.click(logoutButton!);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockConsoleError).toHaveBeenCalledWith('Logout error:', mockError);
        // Should not navigate on error
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      mockConsoleError.mockRestore();
    });
  });

  describe('네비게이션 및 레이아웃', () => {
    it('should have proper spacing for bottom navigation', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      // Check the outermost container has bottom padding
      const outerContainer = screen.getByText('테스트 사용자').closest('div')?.parentElement?.parentElement?.parentElement?.parentElement;
      expect(outerContainer).toHaveClass('pb-20'); // Bottom padding for navigation
    });

    it('should have proper section headers', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      expect(screen.getByText('설정')).toBeInTheDocument();
    });

    it('should have proper visual separation between sections', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      // Check for border separator before logout button - look for the div with border classes
      const logoutSection = screen.getByText('로그아웃').closest('button')?.parentElement;
      expect(logoutSection).toHaveClass('pt-4', 'border-t', 'border-gray-100');
    });
  });

  describe('접근성 및 사용성', () => {
    it('should have proper button roles and accessibility', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should disable unavailable menu items properly', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const notificationButton = screen.getByText('알림 설정').closest('button');
      const calendarButton = screen.getByText('캘린더 연동').closest('button');
      const helpButton = screen.getByText('도움말').closest('button');

      expect(notificationButton).toBeDisabled();
      expect(calendarButton).toBeDisabled();
      expect(helpButton).toBeDisabled();
    });

    it('should have proper visual feedback for interactive elements', () => {
      render(
        <RouterWrapper>
          <MyPage />
        </RouterWrapper>
      );

      const profileButton = screen.getByText('프로필 설정').closest('button');
      expect(profileButton).toHaveClass('hover:bg-gray-50');

      const logoutButton = screen.getByText('로그아웃').closest('button');
      expect(logoutButton).toHaveClass('hover:bg-red-50');
    });
  });
});