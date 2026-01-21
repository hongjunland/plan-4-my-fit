import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { isAuthenticated, isLoading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // 이미 로그인된 경우 캘린더 페이지로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to="/app/calendar" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      toast.success('로그인 중입니다...');
    } catch (error) {
      console.error('로그인 실패:', error);
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 p-2 shadow-md border border-gray-100">
            <img
              src="/logo.png"
              alt="Plan4MyFit logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Plan4MyFit</h2>
          <p className="text-gray-500">로딩 중...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 데스크톱 레이아웃 (lg 이상) */}
      <div className="hidden lg:flex min-h-screen">
        {/* 왼쪽 브랜딩 영역 */}
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-12 text-white text-center max-w-md">
            <div className="mb-12">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 p-3 shadow-lg">
                <img
                  src="/logo.png"
                  alt="Plan4MyFit logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold mb-6">Plan4MyFit</h1>
              <p className="text-xl text-blue-100 leading-relaxed mb-8">
                AI가 개인의 체력과 목표에 맞는<br />
                완벽한 운동 루틴을 생성합니다
              </p>
            </div>
            
            <div className="space-y-6 text-blue-100">
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">개인 맞춤형 운동 루틴 자동 생성</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">스마트 캘린더로 운동 일정 관리</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">실시간 진행률 추적 및 분석</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 로그인 폼 영역 */}
        <div className="w-1/2 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">나만의 운동 계획</h2>
              <p className="text-gray-600 text-lg">Google 계정으로 간편하게 로그인하세요</p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              variant="outline"
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 mb-8 py-4 font-medium shadow-sm text-base"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-3"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              계속 진행하면{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                이용약관
              </a>
              과{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 (lg 미만) */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* 상단 브랜딩 영역 - 모바일 최적화 */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-12 text-white text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-2 shadow-lg">
            <img
              src="/logo.png"
              alt="Plan4MyFit logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-3">Plan4MyFit</h1>
          <p className="text-blue-100 text-lg">
            AI가 만들어주는 나만의 운동 계획
          </p>
        </div>

        {/* 로그인 폼 영역 - 모바일 최적화 */}
        <div className="flex-1 bg-white px-6 py-8">
          <div className="max-w-sm mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">나만의 운동 계획</h2>
              <p className="text-gray-600">Google 계정으로 간편 로그인</p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              variant="outline"
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 mb-8 py-4 font-medium shadow-sm"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-3"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </div>
              )}
            </Button>

            {/* 모바일용 간단한 기능 소개 */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                개인 맞춤 운동 루틴
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                스마트 일정 관리
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                진행률 추적
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              계속 진행하면{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                이용약관
              </a>
              과{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;