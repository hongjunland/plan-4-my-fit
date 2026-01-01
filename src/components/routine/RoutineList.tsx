import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoutineCard } from './';
import { Button } from '../ui';
import { routinesService, type RoutineWithDetails } from '../../services/routines';
import useAuthStore from '../../stores/authStore';
import { ROUTES, APP_CONFIG } from '../../constants';

interface RoutineListProps {
  onRoutineActivated?: (routine: RoutineWithDetails) => void;
  onRoutineDeleted?: (routineId: string) => void;
}

const RoutineList: React.FC<RoutineListProps> = ({
  onRoutineActivated,
  onRoutineDeleted,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [routines, setRoutines] = useState<RoutineWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 루틴 목록 로드
  const loadRoutines = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userRoutines = await routinesService.getUserRoutines(user.id);
      setRoutines(userRoutines);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 목록 로드 실패:', err);
      }
      setError('루틴 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRoutines();
    }
  }, [user]);

  // 루틴 활성화
  const handleActivate = async (routineId: string) => {
    if (!user) return;

    try {
      setActionLoading(routineId);
      await routinesService.activateRoutine(user.id, routineId);
      
      // 상태 업데이트
      setRoutines(prev => prev.map(routine => ({
        ...routine,
        isActive: routine.id === routineId,
      })));

      const activatedRoutine = routines.find(r => r.id === routineId);
      if (activatedRoutine && onRoutineActivated) {
        onRoutineActivated({ ...activatedRoutine, isActive: true });
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 활성화 실패:', err);
      }
      setError('루틴 활성화에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 루틴 편집
  const handleEdit = (routineId: string) => {
    navigate(ROUTES.ROUTINES_EDIT.replace(':id', routineId));
  };

  // 루틴 복제
  const handleDuplicate = async (routineId: string) => {
    if (!user) return;

    try {
      setActionLoading(routineId);
      const duplicatedRoutine = await routinesService.duplicateRoutine(user.id, routineId);
      setRoutines(prev => [duplicatedRoutine, ...prev]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 복제 실패:', err);
      }
      if (err instanceof Error && err.message.includes('10개')) {
        setError('루틴은 최대 10개까지만 생성할 수 있습니다.');
      } else {
        setError('루틴 복제에 실패했습니다.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // 루틴 삭제
  const handleDelete = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const confirmed = window.confirm(
      `"${routine.name}" 루틴을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(routineId);
      await routinesService.deleteRoutine(routineId);
      setRoutines(prev => prev.filter(r => r.id !== routineId));
      
      if (onRoutineDeleted) {
        onRoutineDeleted(routineId);
      }
    } catch (err) {
      console.error('루틴 삭제 실패:', err);
      setError('루틴 삭제에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 새 루틴 생성
  const handleCreateNew = () => {
    if (routines.length >= APP_CONFIG.MAX_ROUTINES_PER_USER) {
      setError('루틴은 최대 10개까지만 생성할 수 있습니다.');
      return;
    }
    navigate(ROUTES.ROUTINES_NEW);
  };

  // 에러 메시지 닫기
  const dismissError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="space-y-3">
          <div className="h-7 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* 카드 스켈레톤 */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-12"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">루틴 관리</h1>
            <p className="text-gray-600 text-sm">
              나만의 운동 루틴을 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
            <Dumbbell size={14} />
            <span className="font-medium">{routines.length}/{APP_CONFIG.MAX_ROUTINES_PER_USER}</span>
          </div>
        </div>

        {/* 새 루틴 생성 버튼 */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCreateNew}
          disabled={routines.length >= APP_CONFIG.MAX_ROUTINES_PER_USER}
          className="font-semibold text-base rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} />
          새 루틴 만들기
        </Button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium mb-1">오류가 발생했습니다</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={dismissError}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 루틴 목록 */}
      {routines.length === 0 ? (
        <div className="text-center py-12 space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Dumbbell size={28} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">
              첫 번째 루틴을 만들어보세요
            </h3>
            <p className="text-gray-600 max-w-xs mx-auto leading-relaxed text-sm">
              AI가 당신의 목표와 체력 수준에 맞는 
              개인 맞춤형 운동 루틴을 생성해드립니다
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateNew}
            className="mx-auto px-8 h-12 font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={2.5} />
            AI 루틴 생성하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 활성 루틴 섹션 */}
          {routines.some(r => r.isActive) && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                활성 루틴
              </h2>
              {routines
                .filter(routine => routine.isActive)
                .map(routine => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onActivate={handleActivate}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    isLoading={actionLoading === routine.id}
                  />
                ))}
            </div>
          )}

          {/* 저장된 루틴 섹션 */}
          {routines.some(r => !r.isActive) && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                저장된 루틴 ({routines.filter(r => !r.isActive).length})
              </h2>
              {routines
                .filter(routine => !routine.isActive)
                .map(routine => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onActivate={handleActivate}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    isLoading={actionLoading === routine.id}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* 루틴 개수 제한 안내 */}
      {routines.length >= APP_CONFIG.MAX_ROUTINES_PER_USER && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-800 text-sm font-medium mb-1">
            루틴 저장 한도에 도달했습니다
          </p>
          <p className="text-amber-700 text-sm">
            새 루틴을 만들려면 기존 루틴을 삭제해주세요
          </p>
        </div>
      )}
    </div>
  );
};

export default RoutineList;