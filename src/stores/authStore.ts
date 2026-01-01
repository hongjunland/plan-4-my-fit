import { create } from 'zustand';
import { logger } from '../utils/logger';
import { trackEvent } from '../utils/analytics';
import { setUserContext, clearUserContext } from '../utils/sentry';
import { authService, type AuthUser } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// 인증 상태 변경 리스너가 중복 등록되지 않도록 추적
let authStateChangeListener: any = null;
let isInitialized = false; // 초기화 상태 추적

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isFirstLogin: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isFirstLogin: user ? user.isFirstLogin : false,
    });
    
    // Update monitoring context
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      clearUserContext();
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      await authService.signInWithGoogle();
      
      // Track login event
      trackEvent('user_login', { method: 'google' });
      
      // 실제 사용자 정보는 onAuthStateChange에서 설정됨
    } catch (error) {
      logger.error('Google 로그인 실패', error as Error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      
      // Track logout event
      trackEvent('user_logout', {});
      
      await authService.signOut();
      
      // 초기화 상태 리셋
      isInitialized = false;
      
      set({
        user: null,
        isAuthenticated: false,
        isFirstLogin: false,
      });
    } catch (error) {
      logger.error('로그아웃 실패', error as Error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    // 이미 초기화되었으면 중복 실행 방지
    if (isInitialized) {
      logger.debug('인증 이미 초기화됨, 건너뛰기');
      return;
    }

    try {
      isInitialized = true;
      set({ isLoading: true });
      logger.debug('인증 초기화 시작...');
      
      // 기존 리스너가 있으면 제거
      if (authStateChangeListener) {
        authStateChangeListener.data?.subscription?.unsubscribe?.();
        authStateChangeListener = null;
      }

      // 인증 상태 변경 감지 설정 (프로필 확인 없이)
      authStateChangeListener = authService.onAuthStateChange(async (user) => {
        logger.debug('인증 상태 변경', { userEmail: user?.email || 'null' });
        
        if (user) {
          // 기본 사용자 정보만 설정 (프로필 확인은 초기화에서만)
          set({
            user: { ...user, isFirstLogin: false }, // 임시값
            isAuthenticated: true,
            isFirstLogin: false, // 임시값
            isLoading: false
          });
        } else {
          logger.debug('로그아웃됨');
          set({
            user: null,
            isAuthenticated: false,
            isFirstLogin: false,
            isLoading: false
          });
        }
      });

      // 현재 사용자 정보 가져오기 (초기 로드용)
      const user = await authService.getCurrentUser();
      logger.debug('현재 사용자', { userEmail: user?.email || 'null' });
      
      if (user) {
        // 프로필 존재 여부 확인 (초기화에서만)
        logger.debug('프로필 존재 여부 확인 중...');
        const hasProfile = await authService.checkUserProfile(user.id);
        logger.debug('프로필 존재', { hasProfile });
        
        const authUser: AuthUser = {
          ...user,
          isFirstLogin: !hasProfile,
        };
        
        logger.debug('인증 상태 설정', {
          email: authUser.email,
          isFirstLogin: authUser.isFirstLogin
        });
        
        set({
          user: authUser,
          isAuthenticated: true,
          isFirstLogin: !hasProfile,
        });
      } else {
        logger.debug('인증되지 않은 사용자');
        set({
          user: null,
          isAuthenticated: false,
          isFirstLogin: false,
        });
      }

      } catch (error) {
        logger.error('인증 초기화 실패', error as Error);
        set({
          user: null,
          isAuthenticated: false,
          isFirstLogin: false,
        });
      } finally {
      set({ isLoading: false });
      logger.debug('인증 초기화 완료');
    }
  },
}));

// 기본 export도 유지 (하위 호환성)
export default useAuthStore;