import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutLogService } from '../../services/database';
import { queryKeys } from '../../lib/queryClient';

// Get today's workout log
export const useTodayLog = (userId?: string, routineId?: string, workoutId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: queryKeys.todayLog,
    queryFn: () => workoutLogService.getWorkoutLog(userId!, routineId!, workoutId!, today),
    enabled: !!(userId && routineId && workoutId),
    staleTime: 1 * 60 * 1000, // 1 minute - frequent updates expected
  });
};

// Get week logs
export const useWeekLogs = (userId?: string, routineId?: string, weekStart?: string) => {
  return useQuery({
    queryKey: queryKeys.weekLogs(weekStart!),
    queryFn: () => workoutLogService.getWeeklyLogs(userId!, weekStart!),
    enabled: !!(userId && routineId && weekStart),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get month logs
export const useMonthLogs = (userId?: string, routineId?: string, year?: number, month?: number) => {
  return useQuery({
    queryKey: queryKeys.monthLogs(year!, month!),
    queryFn: () => workoutLogService.getMonthlyLogs(userId!, year!, month!),
    enabled: !!(userId && routineId && year && month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Toggle exercise completion
export const useToggleExercise = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      routineId, 
      workoutId, 
      exerciseId,
      date, 
      totalExerciseCount 
    }: {
      userId: string;
      routineId: string;
      workoutId: string;
      exerciseId: string;
      date: string;
      totalExerciseCount?: number;
    }) => workoutLogService.toggleExerciseCompletion(
      userId, 
      routineId, 
      workoutId, 
      exerciseId, 
      date, 
      totalExerciseCount
    ),
    onSuccess: (log) => {
      // Update today's log if it's for today
      const today = new Date().toISOString().split('T')[0];
      if (log && log.date === today) {
        queryClient.setQueryData(queryKeys.todayLog, log);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.progressStats });
    },
  });
};