import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '../../services/routines';
import { aiService } from '../../services/ai';
import { queryKeys } from '../../lib/queryClient';
import type { RoutineSettings, Profile } from '../../types';
import type { UpdateRoutineRequest, CreateRoutineRequest } from '../../services/routines';

// Get all routines
export const useRoutines = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.routines,
    queryFn: () => routinesService.getUserRoutines(userId!),
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
    mutationFn: ({ userId, request }: { userId: string; request: CreateRoutineRequest }) =>
      routinesService.createRoutine(userId, request),
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
    mutationFn: ({ routineId, updates }: { routineId: string; updates: UpdateRoutineRequest }) =>
      routinesService.updateRoutine(routineId, updates),
    onSuccess: (routine) => {
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
    mutationFn: ({ userId, routineId }: { userId: string; routineId: string }) =>
      routinesService.activateRoutine(userId, routineId),
    onSuccess: () => {
      // Invalidate active routine cache
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoutine });
      // Invalidate routines list to update all routine statuses
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};

// Delete routine
export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (routineId: string) => routinesService.deleteRoutine(routineId),
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
    mutationFn: ({ userId, routineId }: { userId: string; routineId: string }) =>
      routinesService.duplicateRoutine(userId, routineId),
    onSuccess: () => {
      // Invalidate routines to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
};