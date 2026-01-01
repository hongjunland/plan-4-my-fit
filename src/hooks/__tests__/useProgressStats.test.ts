import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useProgressStats from '../useProgressStats';
import useAuth from '../useAuth';
import * as progressStatsService from '../../services/progressStats';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('../../services/progressStats');

describe('useProgressStats', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, error: null });
    
    const { result } = renderHook(() => useProgressStats());
    
    expect(result.current.progressStats).toBeNull();
    expect(result.current.routineProgress).toBeNull();
    expect(result.current.motivationMessage).toBe('💪 오늘도 운동으로 건강한 하루 만들어요!');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch stats when user is available', async () => {
    const mockProgressStats = {
      weekly: { completionRate: 75, completedWorkouts: 3, totalWorkouts: 4, weekDates: [] },
      monthly: { completionRate: 80, completedWorkouts: 8, totalWorkouts: 10, streakDays: 5, workoutDays: 8 },
      muscleGroups: [{ muscleGroup: 'chest' as const, frequency: 5, percentage: 50 }],
      streakDays: 5
    };

    const mockRoutineProgress = {
      completionRate: 60,
      completedDays: 6,
      totalDays: 10,
      remainingDays: 4
    };

    const mockMotivationMessage = '👍 잘하고 있어요! 5일 연속이에요!';

    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(progressStatsService.calculateProgressStats).mockResolvedValue(mockProgressStats);
    vi.mocked(progressStatsService.calculateRoutineProgress).mockResolvedValue(mockRoutineProgress);
    vi.mocked(progressStatsService.generateMotivationMessage).mockReturnValue(mockMotivationMessage);

    const { result } = renderHook(() => useProgressStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressStats).toEqual(mockProgressStats);
    expect(result.current.routineProgress).toEqual(mockRoutineProgress);
    expect(result.current.motivationMessage).toBe(mockMotivationMessage);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state correctly', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    
    // Mock a delayed response
    vi.mocked(progressStatsService.calculateProgressStats).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        weekly: { completionRate: 0, completedWorkouts: 0, totalWorkouts: 0, weekDates: [] },
        monthly: { completionRate: 0, completedWorkouts: 0, totalWorkouts: 0, streakDays: 0, workoutDays: 0 },
        muscleGroups: [],
        streakDays: 0
      }), 100))
    );
    
    vi.mocked(progressStatsService.calculateRoutineProgress).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        completionRate: 0,
        completedDays: 0,
        totalDays: 0,
        remainingDays: 0
      }), 100))
    );

    const { result } = renderHook(() => useProgressStats());

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Failed to fetch stats';
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(progressStatsService.calculateProgressStats).mockRejectedValue(new Error(errorMessage));
    vi.mocked(progressStatsService.calculateRoutineProgress).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProgressStats());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progressStats).toBeNull();
    expect(result.current.routineProgress).toBeNull();
  });

  it('should reset state when user becomes null', async () => {
    // First render with user
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(progressStatsService.calculateProgressStats).mockResolvedValue({
      weekly: { completionRate: 75, completedWorkouts: 3, totalWorkouts: 4, weekDates: [] },
      monthly: { completionRate: 80, completedWorkouts: 8, totalWorkouts: 10, streakDays: 5, workoutDays: 8 },
      muscleGroups: [],
      streakDays: 5
    });
    vi.mocked(progressStatsService.calculateRoutineProgress).mockResolvedValue({
      completionRate: 60,
      completedDays: 6,
      totalDays: 10,
      remainingDays: 4
    });

    const { result, rerender } = renderHook(() => useProgressStats());

    await waitFor(() => {
      expect(result.current.progressStats).not.toBeNull();
    });

    // Then render without user
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, error: null });
    rerender();

    expect(result.current.progressStats).toBeNull();
    expect(result.current.routineProgress).toBeNull();
    expect(result.current.motivationMessage).toBe('💪 오늘도 운동으로 건강한 하루 만들어요!');
    expect(result.current.error).toBeNull();
  });

  it('should provide refreshStats function', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(progressStatsService.calculateProgressStats).mockResolvedValue({
      weekly: { completionRate: 50, completedWorkouts: 2, totalWorkouts: 4, weekDates: [] },
      monthly: { completionRate: 60, completedWorkouts: 6, totalWorkouts: 10, streakDays: 3, workoutDays: 6 },
      muscleGroups: [],
      streakDays: 3
    });
    vi.mocked(progressStatsService.calculateRoutineProgress).mockResolvedValue({
      completionRate: 40,
      completedDays: 4,
      totalDays: 10,
      remainingDays: 6
    });

    const { result } = renderHook(() => useProgressStats());

    await waitFor(() => {
      expect(result.current.progressStats).not.toBeNull();
    });

    // Clear mocks and set new return values
    vi.clearAllMocks();
    vi.mocked(progressStatsService.calculateProgressStats).mockResolvedValue({
      weekly: { completionRate: 100, completedWorkouts: 4, totalWorkouts: 4, weekDates: [] },
      monthly: { completionRate: 90, completedWorkouts: 9, totalWorkouts: 10, streakDays: 7, workoutDays: 9 },
      muscleGroups: [],
      streakDays: 7
    });
    vi.mocked(progressStatsService.calculateRoutineProgress).mockResolvedValue({
      completionRate: 80,
      completedDays: 8,
      totalDays: 10,
      remainingDays: 2
    });

    // Call refreshStats
    await result.current.refreshStats();

    await waitFor(() => {
      expect(result.current.progressStats?.weekly.completionRate).toBe(100);
    });

    expect(result.current.routineProgress?.completionRate).toBe(80);
  });

  it('should not fetch stats when user is not available', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, error: null });

    renderHook(() => useProgressStats());

    expect(progressStatsService.calculateProgressStats).not.toHaveBeenCalled();
    expect(progressStatsService.calculateRoutineProgress).not.toHaveBeenCalled();
  });
});