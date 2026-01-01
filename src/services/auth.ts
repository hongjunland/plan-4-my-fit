import { supabase } from './supabase';
import { logger } from '../utils/logger';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isFirstLogin: boolean;
}

// 프로필 확인 결과 캐시 (메모리 캐시, 5분 유효)
const profileCache = new Map<string, { hasProfile: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

class AuthService {
  /**
   * Google OAuth 로그인
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google 로그인 오류:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      throw error;
    }
  }

  /**
   * 로그아웃
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 오류:', error);
        throw error;
      }

      // 캐시 클리어
      profileCache.clear();
      
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // 먼저 세션 확인
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('세션 조회 오류:', sessionError);
        return null;
      }

      if (!sessionData.session) {
        logger.debug('세션이 없음');
        return null;
      }

      // 세션이 있으면 사용자 정보 조회
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('사용자 정보 조회 오류:', error);
        return null;
      }

      if (!user) {
        logger.debug('사용자 정보가 없음');
        return null;
      }

      logger.debug('사용자 정보 조회 성공', { 
        email: user.email, 
        userId: user.id 
      });
      return this.transformSupabaseUser(user);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 사용자 세션 상태 변경 감지
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state changed', { 
        event, 
        userEmail: session?.user?.email 
      });
      
      if (session?.user) {
        const authUser = this.transformSupabaseUser(session.user);
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  /**
   * 사용자 프로필 존재 여부 확인 (캐시 포함)
   */
  async checkUserProfile(userId: string): Promise<boolean> {
    try {
      // 캐시 확인
      const cached = profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        logger.debug('캐시된 프로필 정보 사용', { 
          hasProfile: cached.hasProfile 
        });
        return cached.hasProfile;
      }

      logger.debug('프로필 확인 중...', { userId });
      
      // profiles 테이블에서 직접 확인 (auth.users.id 사용)
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('프로필 확인 오류:', error);
        return false;
      }

      const hasProfile = data && data.length > 0;
      logger.debug('프로필 존재 확인', { hasProfile });
      
      // 캐시에 저장
      profileCache.set(userId, {
        hasProfile,
        timestamp: Date.now()
      });
      
      return hasProfile;
      
    } catch (error) {
      console.error('프로필 확인 실패:', error);
      return false;
    }
  }

  /**
   * 프로필 캐시 무효화 (프로필 생성/삭제 시 호출)
   */
  invalidateProfileCache(userId: string) {
    profileCache.delete(userId);
    logger.debug('프로필 캐시 무효화', { userId });
  }

  /**
   * Supabase User를 AuthUser로 변환
   */
  private transformSupabaseUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || '',
      profilePicture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      isFirstLogin: false, // 프로필 존재 여부로 판단
    };
  }

  /**
   * 첫 로그인 여부 확인 및 업데이트
   */
  async updateFirstLoginStatus(userId: string): Promise<void> {
    try {
      const hasProfile = await this.checkUserProfile(userId);
      
      if (!hasProfile) {
        // 프로필이 없으면 첫 로그인으로 간주
        logger.debug('첫 로그인 사용자', { userId });
      }
    } catch (error) {
      console.error('첫 로그인 상태 업데이트 실패:', error);
    }
  }
}

export const authService = new AuthService();