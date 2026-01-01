import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import {
  calculateProgressStats,
  calculateRoutineProgress,
  generateMotivationMessage,
  type ProgressStats
} from '../services/progressStats';

interface RoutineProgress {
  completionRate: number;
  completedDays: number;
  totalDays: number;
  remainingDays: number;
}

interface UseProgressStatsReturn {
  progressStats: ProgressStats | null;
  routineProgress: RoutineProgress | null;
  motivationMessage: string;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const useProgressStats = (): UseProgressStatsReturn => {
  const { user } = useAuth();
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [routineProgress, setRoutineProgress] = useState<RoutineProgress | null>(null);
  const [motivationMessage, setMotivationMessage] = useState<string>('💪 오늘도 운동으로 건강한 하루 만들어요!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // 진행 상황 통계와 루틴 진행률을 병렬로 가져오기
      const [stats, routine] = await Promise.all([
        calculateProgressStats(user.id),
        calculateRoutineProgress(user.id)
      ]);

      setProgressStats(stats);
      setRoutineProgress(routine);
      
      // 동기부여 메시지 생성
      const message = generateMotivationMessage(stats);
      setMotivationMessage(message);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '통계를 불러오는 중 오류가 발생했습니다';
      setError(errorMessage);
      console.error('Error fetching progress stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자가 변경되거나 컴포넌트가 마운트될 때 통계 로드
  useEffect(() => {
    if (user) {
      refreshStats();
    } else {
      // 사용자가 없으면 초기화
      setProgressStats(null);
      setRoutineProgress(null);
      setMotivationMessage('💪 오늘도 운동으로 건강한 하루 만들어요!');
      setError(null);
    }
  }, [user]);

  return {
    progressStats,
    routineProgress,
    motivationMessage,
    isLoading,
    error,
    refreshStats
  };
};

export default useProgressStats;