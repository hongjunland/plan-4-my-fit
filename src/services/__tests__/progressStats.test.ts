import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateStreakDays,
  calculateMuscleGroupStats,
  calculateProgressStats,
  calculateRoutineProgress,
  generateMotivationMessage
} from '../progressStats';
import { workoutLogService, routineService } from '../database';

// Mock the database services
vi.mock('../database', () => ({
  workoutLogService: {
    getWorkoutLogsByDateRange: vi.fn(),
    getMonthlyLogs: vi.fn(),
    getStreakDays: vi.fn()
  },
  routineService: {
    getActiveRoutine: vi.fn()
  }
}));

describe('progressStats', () => {
  const mockUserId = 'test-user-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateWeeklyStats', () => {
    it('should calculate weekly completion rate correctly', async () => {
      // Mock data: 3 completed out of 5 total workouts
      const mockLogs = [
        { id: '1', is_completed: true, date: '2024-01-01' },
        { id: '2', is_completed: true, date: '2024-01-02' },
        { id: '3', is_completed: false, date: '2024-01-03' },
        { id: '4', is_completed: true, date: '2024-01-04' },
        { id: '5', is_completed: false, date: '2024-01-05' }
      ];

      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockResolvedValue(mockLogs);

      const result = await calculateWeeklyStats(mockUserId);

      expect(result.completedWorkouts).toBe(3);
      expect(result.totalWorkouts).toBe(5);
      expect(result.completionRate).toBe(60); // 3/5 * 100 = 60%
      expect(result.weekDates).toHaveLength(7);
    });

    it('should handle empty workout logs', async () => {
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockResolvedValue([]);

      const result = await calculateWeeklyStats(mockUserId);

      expect(result.completedWorkouts).toBe(0);
      expect(result.totalWorkouts).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.weekDates).toHaveLength(7);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockRejectedValue(new Error('Database error'));

      const result = await calculateWeeklyStats(mockUserId);

      expect(result.completedWorkouts).toBe(0);
      expect(result.totalWorkouts).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.weekDates).toEqual([]);
    });
  });

  describe('calculateMonthlyStats', () => {
    it('should calculate monthly stats correctly', async () => {
      const mockLogs = [
        { id: '1', is_completed: true, date: '2024-01-01' },
        { id: '2', is_completed: true, date: '2024-01-02' },
        { id: '3', is_completed: false, date: '2024-01-03' },
        { id: '4', is_completed: true, date: '2024-01-04' },
        { id: '5', is_completed: true, date: '2024-01-04' } // Same date as #4
      ];

      vi.mocked(workoutLogService.getMonthlyLogs).mockResolvedValue(mockLogs);
      vi.mocked(workoutLogService.getStreakDays).mockResolvedValue(5);

      const result = await calculateMonthlyStats(mockUserId, 2024, 1);

      expect(result.completedWorkouts).toBe(4);
      expect(result.totalWorkouts).toBe(5);
      expect(result.completionRate).toBe(80); // 4/5 * 100 = 80%
      expect(result.workoutDays).toBe(4); // Unique dates: 01, 02, 03, 04
      expect(result.streakDays).toBe(5);
    });

    it('should use current month when no parameters provided', async () => {
      const mockLogs = [
        { id: '1', is_completed: true, date: '2024-01-01' }
      ];

      vi.mocked(workoutLogService.getMonthlyLogs).mockResolvedValue(mockLogs);
      vi.mocked(workoutLogService.getStreakDays).mockResolvedValue(1);

      const result = await calculateMonthlyStats(mockUserId);

      expect(workoutLogService.getMonthlyLogs).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Number), // current year
        expect.any(Number)  // current month
      );
    });
  });

  describe('calculateStreakDays', () => {
    it('should return streak days from service', async () => {
      vi.mocked(workoutLogService.getStreakDays).mockResolvedValue(7);

      const result = await calculateStreakDays(mockUserId);

      expect(result).toBe(7);
      expect(workoutLogService.getStreakDays).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle errors and return 0', async () => {
      vi.mocked(workoutLogService.getStreakDays).mockRejectedValue(new Error('Database error'));

      const result = await calculateStreakDays(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('calculateMuscleGroupStats', () => {
    it('should calculate muscle group frequency correctly', async () => {
      const mockLogs = [
        {
          id: '1',
          is_completed: true,
          workout_id: 'workout-1',
          completed_exercises: ['ex1', 'ex2']
        },
        {
          id: '2',
          is_completed: true,
          workout_id: 'workout-1',
          completed_exercises: ['ex1', 'ex3']
        }
      ];

      const mockRoutine = {
        id: 'routine-1',
        workouts: [
          {
            id: 'workout-1',
            exercises: [
              { id: 'ex1', muscleGroup: 'chest' },
              { id: 'ex2', muscleGroup: 'back' },
              { id: 'ex3', muscleGroup: 'chest' }
            ]
          }
        ]
      };

      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockResolvedValue(mockLogs);
      vi.mocked(routineService.getActiveRoutine).mockResolvedValue(mockRoutine);

      const result = await calculateMuscleGroupStats(mockUserId, 30);

      expect(result).toHaveLength(2);
      
      // chest: ex1 (2 times) + ex3 (1 time) = 3 times, 75%
      const chestStat = result.find(stat => stat.muscleGroup === 'chest');
      expect(chestStat?.frequency).toBe(3);
      expect(chestStat?.percentage).toBe(75);
      
      // back: ex2 (1 time) = 1 time, 25%
      const backStat = result.find(stat => stat.muscleGroup === 'back');
      expect(backStat?.frequency).toBe(1);
      expect(backStat?.percentage).toBe(25);
    });

    it('should return empty array when no active routine', async () => {
      vi.mocked(routineService.getActiveRoutine).mockResolvedValue(null);

      const result = await calculateMuscleGroupStats(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockRejectedValue(new Error('Database error'));

      const result = await calculateMuscleGroupStats(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('calculateRoutineProgress', () => {
    it('should calculate routine progress correctly', async () => {
      const mockRoutine = {
        id: 'routine-1',
        created_at: '2024-01-01T00:00:00Z',
        settings: {
          durationWeeks: 4,
          workoutsPerWeek: 3
        }
      };

      const mockLogs = [
        { id: '1', routine_id: 'routine-1', is_completed: true },
        { id: '2', routine_id: 'routine-1', is_completed: true },
        { id: '3', routine_id: 'routine-1', is_completed: false }
      ];

      vi.mocked(routineService.getActiveRoutine).mockResolvedValue(mockRoutine);
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockResolvedValue(mockLogs);

      const result = await calculateRoutineProgress(mockUserId);

      expect(result.totalDays).toBe(12); // 4 weeks * 3 workouts = 12
      expect(result.completedDays).toBe(2);
      expect(result.completionRate).toBe(17); // 2/12 * 100 = 16.67 -> 17
      expect(result.remainingDays).toBe(10); // 12 - 2 = 10
    });

    it('should return zero values when no active routine', async () => {
      vi.mocked(routineService.getActiveRoutine).mockResolvedValue(null);

      const result = await calculateRoutineProgress(mockUserId);

      expect(result.completionRate).toBe(0);
      expect(result.completedDays).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.remainingDays).toBe(0);
    });
  });

  describe('generateMotivationMessage', () => {
    it('should generate message based on streak days', () => {
      const stats = {
        weekly: { completionRate: 50, completedWorkouts: 2, totalWorkouts: 4, weekDates: [] },
        monthly: { completionRate: 60, completedWorkouts: 6, totalWorkouts: 10, streakDays: 30, workoutDays: 8 },
        muscleGroups: [],
        streakDays: 30
      };

      const message = generateMotivationMessage(stats);

      expect(message).toContain('30일 연속');
      expect(message).toContain('🔥');
    });

    it('should generate message based on weekly completion rate', () => {
      const stats = {
        weekly: { completionRate: 85, completedWorkouts: 4, totalWorkouts: 5, weekDates: [] },
        monthly: { completionRate: 60, completedWorkouts: 6, totalWorkouts: 10, streakDays: 2, workoutDays: 8 },
        muscleGroups: [],
        streakDays: 2
      };

      const message = generateMotivationMessage(stats);

      expect(message).toContain('이번 주 85%');
      expect(message).toContain('🎉');
    });

    it('should generate default message when no significant progress', () => {
      const stats = {
        weekly: { completionRate: 20, completedWorkouts: 1, totalWorkouts: 5, weekDates: [] },
        monthly: { completionRate: 30, completedWorkouts: 3, totalWorkouts: 10, streakDays: 1, workoutDays: 3 },
        muscleGroups: [],
        streakDays: 1
      };

      const message = generateMotivationMessage(stats);

      expect(message).toBe('💪 오늘도 운동으로 건강한 하루 만들어요!');
    });
  });

  describe('calculateProgressStats', () => {
    it('should combine all stats correctly', async () => {
      // Mock all the individual functions
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockResolvedValue([]);
      vi.mocked(workoutLogService.getMonthlyLogs).mockResolvedValue([]);
      vi.mocked(workoutLogService.getStreakDays).mockResolvedValue(5);
      vi.mocked(routineService.getActiveRoutine).mockResolvedValue(null);

      const result = await calculateProgressStats(mockUserId);

      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('muscleGroups');
      expect(result).toHaveProperty('streakDays');
      expect(result.streakDays).toBe(5);
    });

    it('should handle errors and return default values', async () => {
      vi.mocked(workoutLogService.getWorkoutLogsByDateRange).mockRejectedValue(new Error('Database error'));
      vi.mocked(workoutLogService.getMonthlyLogs).mockRejectedValue(new Error('Database error'));
      vi.mocked(workoutLogService.getStreakDays).mockRejectedValue(new Error('Database error'));
      vi.mocked(routineService.getActiveRoutine).mockRejectedValue(new Error('Database error'));

      const result = await calculateProgressStats(mockUserId);

      expect(result.weekly.completionRate).toBe(0);
      expect(result.monthly.completionRate).toBe(0);
      expect(result.muscleGroups).toEqual([]);
      expect(result.streakDays).toBe(0);
    });
  });
});