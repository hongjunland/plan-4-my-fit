import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized caching settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  profile: ['profile'] as const,
  
  // Routines
  routines: ['routines'] as const,
  routine: (id: string) => ['routines', id] as const,
  activeRoutine: ['routines', 'active'] as const,
  
  // Workout logs
  workoutLogs: ['workoutLogs'] as const,
  todayLog: ['workoutLogs', 'today'] as const,
  weekLogs: (date: string) => ['workoutLogs', 'week', date] as const,
  monthLogs: (year: number, month: number) => ['workoutLogs', 'month', year, month] as const,
  
  // Progress stats
  progressStats: ['progressStats'] as const,
  weeklyStats: (date: string) => ['progressStats', 'weekly', date] as const,
  monthlyStats: (year: number, month: number) => ['progressStats', 'monthly', year, month] as const,
} as const;