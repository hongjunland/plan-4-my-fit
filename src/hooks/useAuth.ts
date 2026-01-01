import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

/**
 * 인증 관련 커스텀 훅
 */
const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isFirstLogin,
    setUser,
    setLoading,
    signInWithGoogle,
    signOut,
    initialize,
  } = useAuthStore();

  // 컴포넌트 마운트 시 인증 상태 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isFirstLogin,
    
    // Actions
    signInWithGoogle,
    signOut,
    
    // Internal actions (일반적으로 직접 사용하지 않음)
    setUser,
    setLoading,
    initialize,
  };
};

export default useAuth;