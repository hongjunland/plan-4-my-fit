import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const AuthCallbackPage = () => {
  const { isAuthenticated, isLoading, isFirstLogin, user, initialize } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        logger.debug('OAuth 콜백 처리 시작...');
        
        // URL에서 에러 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          console.error('OAuth 에러:', error, errorDescription);
          toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
          setIsProcessing(false);
          return;
        }

        // URL에서 세션 정보 추출 및 설정
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 조회 오류:', sessionError);
          toast.error('로그인 처리 중 오류가 발생했습니다.');
          setIsProcessing(false);
          return;
        }

        if (data.session) {
          logger.debug('세션 확인됨', { userEmail: data.session.user.email });
          // 인증 상태 강제 새로고침
          await initialize();
        } else {
          logger.debug('세션이 없음');
          toast.error('로그인 세션을 찾을 수 없습니다.');
        }

      } catch (error) {
        console.error('OAuth 콜백 처리 실패:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [initialize]);

  // 콜백 처리 중
  if (isProcessing || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 첫 로그인 사용자는 프로필 설정으로
  if (isFirstLogin) {
    toast.success(`환영합니다, ${user?.name}님!`);
    return <Navigate to="/profile/setup" replace />;
  }

  // 기존 사용자는 캘린더로
  toast.success(`다시 오신 것을 환영합니다, ${user?.name}님!`);
  return <Navigate to="/app/calendar" replace />;
};

export default AuthCallbackPage;