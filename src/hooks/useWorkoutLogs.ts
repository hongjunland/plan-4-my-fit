import { useState, useCallback } from 'react';
import { workoutLogService } from '../services/database';
import useAuth from './useAuth';
import type { Database } from '../types/database';

type WorkoutLog = Database['public']['Tables']['workout_logs']['Row'];

interface WorkoutProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isCompleted: boolean;
}

interface MonthlyStats {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  streakDays: number;
}

const useWorkoutLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 오늘의 운동 기록 조회
  const getTodayLogs = useCallback(async () => {
    if (!user) return [];

    try {
      setIsLoading(true);
      setError(null);
      const todayLogs = await workoutLogService.getTodayLog(user.id);
      setLogs(todayLogs);
      return todayLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '운동 기록 조회 중 오류가 발생했습니다';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 특정 날짜의 운동 기록 조회
  const getLogsByDate = useCallback(async (date: string) => {
    if (!user) return [];

    try {
      setIsLoading(true);
      setError(null);
      const dateLogs = await workoutLogService.getWorkoutLogsByDate(user.id, date);
      return dateLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '운동 기록 조회 중 오류가 발생했습니다';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 주간 운동 기록 조회
  const getWeeklyLogs = useCallback(async (startDate: string) => {
    if (!user) return [];

    try {
      setIsLoading(true);
      setError(null);
      const weeklyLogs = await workoutLogService.getWeeklyLogs(user.id, startDate);
      return weeklyLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '주간 운동 기록 조회 중 오류가 발생했습니다';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 월간 운동 기록 조회
  const getMonthlyLogs = useCallback(async (year: number, month: number) => {
    if (!user) return [];

    try {
      setIsLoading(true);
      setError(null);
      const monthlyLogs = await workoutLogService.getMonthlyLogs(user.id, year, month);
      return monthlyLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '월간 운동 기록 조회 중 오류가 발생했습니다';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 운동 완료 체크/언체크
  const toggleExerciseCompletion = useCallback(async (
    routineId: string,
    workoutId: string,
    exerciseId: string,
    date: string = new Date().toISOString().split('T')[0],
    totalExerciseCount?: number // 전체 운동 개수 추가
  ) => {
    if (!user) return null;

    try {
      setIsLoading(true);
      setError(null);
      const updatedLog = await workoutLogService.toggleExerciseCompletion(
        user.id,
        routineId,
        workoutId,
        exerciseId,
        date,
        totalExerciseCount
      );

      // 로컬 상태 업데이트
      setLogs(prevLogs => {
        const existingLogIndex = prevLogs.findIndex(
          log => log.routine_id === routineId &&
                 log.workout_id === workoutId &&
                 log.date === date
        );

        if (existingLogIndex > -1) {
          const newLogs = [...prevLogs];
          newLogs[existingLogIndex] = updatedLog;
          return newLogs;
        } else {
          return [...prevLogs, updatedLog];
        }
      });

      return updatedLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '운동 완료 상태 변경 중 오류가 발생했습니다';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 운동 전체 완료 처리
  const completeWorkout = useCallback(async (
    routineId: string,
    workoutId: string,
    exerciseIds: string[],
    date: string = new Date().toISOString().split('T')[0]
  ) => {
    if (!user) return null;

    try {
      setIsLoading(true);
      setError(null);
      const completedLog = await workoutLogService.completeWorkout(
        user.id,
        routineId,
        workoutId,
        date,
        exerciseIds
      );

      // 로컬 상태 업데이트
      setLogs(prevLogs => {
        const existingLogIndex = prevLogs.findIndex(
          log => log.routine_id === routineId &&
                 log.workout_id === workoutId &&
                 log.date === date
        );

        if (existingLogIndex > -1) {
          const newLogs = [...prevLogs];
          newLogs[existingLogIndex] = completedLog;
          return newLogs;
        } else {
          return [...prevLogs, completedLog];
        }
      });

      return completedLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '운동 완료 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 운동 진행률 조회
  const getWorkoutProgress = useCallback(async (
    routineId: string,
    workoutId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<WorkoutProgress> => {
    if (!user) {
      return { completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false };
    }

    try {
      return await workoutLogService.getWorkoutProgress(user.id, routineId, workoutId, date);
    } catch (err) {
      console.error('Error getting workout progress:', err);
      return { completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false };
    }
  }, [user]);

  // 연속 운동 일수 조회
  const getStreakDays = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      return await workoutLogService.getStreakDays(user.id);
    } catch (err) {
      console.error('Error getting streak days:', err);
      return 0;
    }
  }, [user]);

  // 월간 통계 조회
  const getMonthlyStats = useCallback(async (year: number, month: number): Promise<MonthlyStats> => {
    if (!user) {
      return { totalWorkouts: 0, completedWorkouts: 0, completionRate: 0, streakDays: 0 };
    }

    try {
      return await workoutLogService.getMonthlyStats(user.id, year, month);
    } catch (err) {
      console.error('Error getting monthly stats:', err);
      return { totalWorkouts: 0, completedWorkouts: 0, completionRate: 0, streakDays: 0 };
    }
  }, [user]);

  // 특정 운동이 완료되었는지 확인
  const isExerciseCompleted = useCallback((
    routineId: string,
    workoutId: string,
    exerciseId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): boolean => {
    const log = logs.find(
      log => log.routine_id === routineId &&
             log.workout_id === workoutId &&
             log.date === date
    );

    if (!log) return false;

    const completedExercises = (log.completed_exercises as string[]) || [];
    return completedExercises.includes(exerciseId);
  }, [logs]);

  // 컴포넌트 마운트 시 오늘의 운동 기록 로드 - 제거 (불필요한 자동 호출)
  // useEffect(() => {
  //   if (user) {
  //     getTodayLogs();
  //   }
  // }, [user]);

  return {
    logs,
    isLoading,
    error,
    getTodayLogs,
    getLogsByDate,
    getWeeklyLogs,
    getMonthlyLogs,
    toggleExerciseCompletion,
    completeWorkout,
    getWorkoutProgress,
    getStreakDays,
    getMonthlyStats,
    isExerciseCompleted,
    // Legacy support
    logWorkout: completeWorkout,
    getProgress: getWorkoutProgress
  };
};

export default useWorkoutLogs;