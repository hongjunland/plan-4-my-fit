import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, RefreshCw, Link2Off, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card, Modal } from '../components/ui';
import { ROUTES } from '../constants';
import {
  getConnectionStatus,
  startOAuthFlow,
  disconnect,
  syncAllRoutines,
  CalendarConnectionState,
} from '../services/googleCalendar';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * CalendarSettingsPage
 * 
 * 구글 캘린더 연동 설정 페이지
 * 
 * Requirements:
 * - 1.1: 구글 캘린더 연동 버튼 제공
 * - 1.2: OAuth 인증 플로우 시작
 * - 1.4: 연동된 구글 계정 정보 표시
 * - 1.5: OAuth 인증 실패 시 에러 메시지 및 재시도
 * - 5.1: 연동 해제 버튼 제공
 * - 5.2: 연동 해제 확인 다이얼로그
 * - 5.5: 연동 해제 상태 표시
 * - 6.1: 현재 동기화 상태 표시
 * - 6.2: 마지막 동기화 시간 표시
 * - 6.3: 수동 동기화 버튼 제공
 */

const CalendarSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Connection state
  const [connectionState, setConnectionState] = useState<CalendarConnectionState>({
    isConnected: false,
    googleEmail: null,
    isTokenExpired: false,
    lastSyncAt: null,
    syncStatus: 'idle',
    errorMessage: null,
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch connection status on mount
  const fetchConnectionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await getConnectionStatus();
      setConnectionState(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '연동 상태를 확인할 수 없습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle OAuth connection (Requirement 1.1, 1.2)
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await startOAuthFlow();
      // User will be redirected to Google OAuth
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '연동을 시작할 수 없습니다.';
      setError(errorMessage);
      setIsConnecting(false);
    }
  };

  // Handle manual sync (Requirement 6.3, 6.4)
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      const result = await syncAllRoutines();
      
      if (result.success) {
        setSuccessMessage(`동기화 완료! ${result.createdCount || 0}개 이벤트 생성됨`);
        // Refresh connection status to update lastSyncAt
        await fetchConnectionStatus();
      } else {
        setError(result.errors?.join(', ') || '동기화 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '동기화에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle disconnect (Requirement 5.1, 5.2, 5.3, 5.4, 5.5)
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setError(null);
      await disconnect();
      setShowDisconnectModal(false);
      setSuccessMessage('구글 캘린더 연동이 해제되었습니다.');
      setConnectionState({
        isConnected: false,
        googleEmail: null,
        isTokenExpired: false,
        lastSyncAt: null,
        syncStatus: 'idle',
        errorMessage: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '연동 해제에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Format last sync time
  const formatLastSyncTime = (date: Date | null): string => {
    if (!date) return '동기화 기록 없음';
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  // Get status badge color and text
  const getStatusBadge = () => {
    if (connectionState.syncStatus === 'syncing' || isSyncing) {
      return { color: 'bg-blue-100 text-blue-800', text: '동기화 중' };
    }
    if (connectionState.syncStatus === 'error' || connectionState.errorMessage) {
      return { color: 'bg-red-100 text-red-800', text: '오류' };
    }
    if (connectionState.isTokenExpired) {
      return { color: 'bg-yellow-100 text-yellow-800', text: '재인증 필요' };
    }
    if (connectionState.isConnected) {
      return { color: 'bg-green-100 text-green-800', text: '연동됨' };
    }
    return { color: 'bg-gray-100 text-gray-800', text: '연동 해제됨' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(ROUTES.MY)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">캘린더 연동</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm font-medium mt-1 hover:underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center space-x-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Card className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-400" size={32} />
            <span className="ml-3 text-gray-600">연동 상태 확인 중...</span>
          </Card>
        ) : (
          <>
            {/* Connection Status Card (Requirement 1.4, 6.1) */}
            <Card>
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  connectionState.isConnected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Calendar className={connectionState.isConnected ? 'text-blue-600' : 'text-gray-400'} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">구글 캘린더</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>
              </div>

              {/* Connected State (Requirement 1.4) */}
              {connectionState.isConnected && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">연동된 계정</span>
                    <span className="text-sm font-medium text-gray-900">
                      {connectionState.googleEmail || '알 수 없음'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">마지막 동기화</span>
                    <span className="text-sm text-gray-700">
                      {formatLastSyncTime(connectionState.lastSyncAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Not Connected State */}
              {!connectionState.isConnected && (
                <p className="text-sm text-gray-500 mt-2">
                  구글 캘린더와 연동하면 운동 일정이 자동으로 캘린더에 등록됩니다.
                </p>
              )}
            </Card>

            {/* Action Buttons */}
            {connectionState.isConnected ? (
              <div className="space-y-3">
                {/* Sync Button (Requirement 6.3) */}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSync}
                  loading={isSyncing}
                  disabled={isSyncing || connectionState.isTokenExpired}
                >
                  <RefreshCw className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} size={18} />
                  {isSyncing ? '동기화 중...' : '지금 동기화'}
                </Button>

                {/* Re-authenticate Button (when token expired) */}
                {connectionState.isTokenExpired && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleConnect}
                    loading={isConnecting}
                  >
                    재인증하기
                  </Button>
                )}

                {/* Disconnect Button (Requirement 5.1) */}
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDisconnectModal(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Link2Off className="mr-2" size={18} />
                  연동 해제
                </Button>
              </div>
            ) : (
              /* Connect Button (Requirement 1.1) */
              <Button
                variant="primary"
                fullWidth
                onClick={handleConnect}
                loading={isConnecting}
              >
                <Calendar className="mr-2" size={18} />
                {isConnecting ? '연결 중...' : '구글 캘린더 연동하기'}
              </Button>
            )}

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">📅 캘린더 연동 안내</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 활성화된 루틴의 운동 일정이 자동으로 등록됩니다</li>
                <li>• 루틴 수정 시 캘린더도 함께 업데이트됩니다</li>
                <li>• 연동 해제 시 등록된 모든 이벤트가 삭제됩니다</li>
              </ul>
            </Card>
          </>
        )}
      </div>

      {/* Disconnect Confirmation Modal (Requirement 5.2) */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title="연동 해제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            구글 캘린더 연동을 해제하시겠습니까?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ 연동 해제 시 구글 캘린더에 등록된 모든 운동 일정이 삭제됩니다.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowDisconnectModal(false)}
              disabled={isDisconnecting}
            >
              취소
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleDisconnect}
              loading={isDisconnecting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDisconnecting ? '해제 중...' : '연동 해제'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarSettingsPage;
