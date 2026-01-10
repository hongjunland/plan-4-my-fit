import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';
import { ROUTES } from '../constants';
import { handleCallback } from '../services/googleCalendar';
import { logger } from '../utils/logger';

/**
 * GoogleCalendarCallbackPage
 * 
 * OAuth 콜백 처리 페이지
 * 구글 OAuth 인증 후 리다이렉트되는 페이지입니다.
 * 
 * Requirements:
 * - 1.3: OAuth 토큰을 Supabase에 안전하게 저장
 * - 1.5: OAuth 인증 실패 시 에러 메시지 표시 및 재시도 옵션 제공
 */

type CallbackStatus = 'processing' | 'success' | 'error';

interface CallbackState {
  status: CallbackStatus;
  googleEmail: string | null;
  errorMessage: string | null;
}

const GoogleCalendarCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [state, setState] = useState<CallbackState>({
    status: 'processing',
    googleEmail: null,
    errorMessage: null,
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URL에서 code 파라미터 추출
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // 에러 파라미터 확인 (Requirement 1.5)
        if (error) {
          logger.error('Google OAuth error', new Error(errorDescription || error), { errorCode: error });
          setState({
            status: 'error',
            googleEmail: null,
            errorMessage: errorDescription || getErrorMessage(error),
          });
          return;
        }

        // code 파라미터 확인
        if (!code) {
          logger.error('Missing authorization code');
          setState({
            status: 'error',
            googleEmail: null,
            errorMessage: '인증 코드가 없습니다. 다시 시도해주세요.',
          });
          return;
        }

        logger.debug('Processing Google Calendar OAuth callback', { hasCode: true });

        // Edge Function 호출하여 토큰 교환 (Requirement 1.3)
        const redirectUri = `${window.location.origin}${ROUTES.GOOGLE_CALENDAR_CALLBACK}`;
        const result = await handleCallback(code, redirectUri);

        if (result.success) {
          logger.info('Google Calendar connected successfully', { 
            googleEmail: result.googleEmail 
          });
          setState({
            status: 'success',
            googleEmail: result.googleEmail,
            errorMessage: null,
          });
          
          // 3초 후 캘린더 설정 페이지로 리다이렉트
          setTimeout(() => {
            navigate(ROUTES.CALENDAR_SETTINGS, { replace: true });
          }, 2000);
        } else {
          setState({
            status: 'error',
            googleEmail: null,
            errorMessage: result.message || '연동에 실패했습니다.',
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        const errorObj = err instanceof Error ? err : new Error(errorMessage);
        logger.error('Google Calendar callback failed', errorObj);
        setState({
          status: 'error',
          googleEmail: null,
          errorMessage,
        });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  // 에러 코드를 사용자 친화적 메시지로 변환
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'access_denied':
        return '구글 캘린더 접근 권한이 거부되었습니다.';
      case 'invalid_request':
        return '잘못된 요청입니다. 다시 시도해주세요.';
      case 'unauthorized_client':
        return '인증되지 않은 클라이언트입니다.';
      case 'server_error':
        return '구글 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 'temporarily_unavailable':
        return '서비스가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요.';
      default:
        return '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
  };

  // 재시도 핸들러 (Requirement 1.5)
  const handleRetry = () => {
    navigate(ROUTES.CALENDAR_SETTINGS, { replace: true });
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate(ROUTES.MY, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-sm p-8 text-center">
        {/* Processing State */}
        {state.status === 'processing' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              연동 처리 중
            </h2>
            <p className="text-gray-500">
              구글 캘린더와 연동하고 있습니다...
            </p>
          </>
        )}

        {/* Success State */}
        {state.status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              연동 완료!
            </h2>
            <p className="text-gray-500 mb-2">
              구글 캘린더가 성공적으로 연동되었습니다.
            </p>
            {state.googleEmail && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl py-2 px-4 inline-block">
                {state.googleEmail}
              </p>
            )}
            <p className="text-sm text-gray-400 mt-4">
              잠시 후 설정 페이지로 이동합니다...
            </p>
          </>
        )}

        {/* Error State (Requirement 1.5) */}
        {state.status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              연동 실패
            </h2>
            <p className="text-gray-500 mb-6">
              {state.errorMessage}
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleRetry}
              >
                다시 시도
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={handleCancel}
              >
                취소
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallbackPage;
