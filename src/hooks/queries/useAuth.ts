import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth';
import { profileService } from '../../services/database';
import { queryKeys } from '../../lib/queryClient';
import type { Profile } from '../../types';

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth,
    queryFn: authService.getCurrentUser,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth failures
  });
};

// Get user profile
export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => profileService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create profile mutation
export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileService.createProfile,
    onSuccess: (profile) => {
      // Update profile cache
      queryClient.setQueryData(queryKeys.profile, profile);
      // Invalidate auth to refresh user state
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<Profile> }) =>
      profileService.updateProfile(userId, updates),
    onSuccess: (profile) => {
      // Update profile cache
      queryClient.setQueryData(queryKeys.profile, profile);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
};