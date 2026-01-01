import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '../../services/routines';
import { aiService } from '../../services/ai';
import { queryKeys } from '../../lib/queryClient';
import type { Routine, RoutineSettings, Profile } from '../../types';

// Get all routines
export const useRoutines = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.routines,
    queryFn: () => routinesService.getRoutines(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get active routine
export const useActiveRoutine = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeRoutine,
    queryFn: () => routinesService.getActiveRoutine(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get specific routine
export const useRoutine = (routineId?: string) => {
  return useQuery({
    queryKey: queryKeys.routine(routineId!),
    queryFn: () => routinesService.getRoutine(routineId!),
    enabled: !!routineId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Generate routine with AI
export const useGenerateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profile, settings }: { profile: Profile; settings: RoutineSettings }) =>
      aiService.generateRoutine(profile, settings),
    onSuccess: () => {
      // Invalidate routines to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};

// Create routine
export const useCreateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: routinesService.createRoutine,
    onSuccess: () => {
      // Invalidate routines to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};

// Update routine
export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ routineId, updates }: { routineId: string; updates: Partial<Routine> }) =>
      routinesService.updateRoutine(routineId, updates),
    onSuccess: (routine: any) => {
      // Update specific routine cache
      queryClient.setQueryData(queryKeys.routine(routine.id), routine);
      // Invalidate routines list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
      // If this was the active routine, update active routine cache
      if (routine.isActive) {
        queryClient.setQueryData(queryKeys.activeRoutine, routine);
      }
    },
  });
};

// Activate routine
export const useActivateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: routinesService.activateRoutine,
    onSuccess: (routine: any) => {
      // Update active routine cache
      queryClient.setQueryData(queryKeys.activeRoutine, routine);
      // Invalidate routines list to update all routine statuses
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};

// Delete routine
export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: routinesService.deleteRoutine,
    onSuccess: (_, routineId: string) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.routine(routineId) });
      // Invalidate routines list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
      // Invalidate active routine in case it was deleted
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoutine });
    },
  });
};

// Duplicate routine
export const useDuplicateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: routinesService.duplicateRoutine,
    onSuccess: () => {
      // Invalidate routines to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};