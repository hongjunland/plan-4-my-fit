import { useQuery } from '@tanstack/react-query';
import { 
  calculateWeeklyStats, 
  calculateMonthlyStats, 
  calculateProgressStats 
} from '../../services/progressStats';
import { queryKeys } from '../../lib/queryClient';

// Get weekly progress stats
export const useWeeklyStats = (userId?: string, routineId?: string, weekStart?: string) => {
  return useQuery({
    queryKey: queryKeys.weeklyStats(weekStart!),
    queryFn: () => calculateWeeklyStats(userId!, weekStart!),
    enabled: !!(userId && routineId && weekStart),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get monthly progress stats
export const useMonthlyStats = (userId?: string, routineId?: string, year?: number, month?: number) => {
  return useQuery({
    queryKey: queryKeys.monthlyStats(year!, month!),
    queryFn: () => calculateMonthlyStats(userId!, year!, month!),
    enabled: !!(userId && routineId && year && month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get overall progress stats
export const useProgressStats = (userId?: string, routineId?: string) => {
  return useQuery({
    queryKey: queryKeys.progressStats,
    queryFn: () => calculateProgressStats(userId!),
    enabled: !!(userId && routineId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};