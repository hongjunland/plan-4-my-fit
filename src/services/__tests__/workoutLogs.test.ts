import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutLogService } from '../database';
import { supabase } from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn()
    }))
  }
}));

describe('workoutLogService', () => {
  const mockUserId = 'user-123';
  const mockRoutineId = 'routine-123';
  const mockWorkoutId = 'workout-123';
  const mockExerciseId = 'exercise-123';
  const mockDate = '2024-01-15';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkoutLog', () => {
    it('should fetch a specific workout log', async () => {
      const mockLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['exercise-1', 'exercise-2'],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLog, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await workoutLogService.getWorkoutLog(mockUserId, mockRoutineId, mockWorkoutId, mockDate);

      expect(supabase.from).toHaveBeenCalledWith('workout_logs');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockChain.eq).toHaveBeenCalledWith('routine_id', mockRoutineId);
      expect(mockChain.eq).toHaveBeenCalledWith('workout_id', mockWorkoutId);
      expect(mockChain.eq).toHaveBeenCalledWith('date', mockDate);
      expect(result).toEqual(mockLog);
    });

    it('should return null when log not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await workoutLogService.getWorkoutLog(mockUserId, mockRoutineId, mockWorkoutId, mockDate);

      expect(result).toBeNull();
    });
  });

  describe('toggleExerciseCompletion', () => {
    it('should add exercise to completed list when not completed', async () => {
      // Mock existing log without the exercise
      const existingLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['other-exercise'],
        is_completed: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      const updatedLog = {
        ...existingLog,
        completed_exercises: ['other-exercise', mockExerciseId],
        is_completed: true
      };

      // Mock getWorkoutLog
      vi.spyOn(workoutLogService, 'getWorkoutLog').mockResolvedValue(existingLog);
      
      // Mock createOrUpdateWorkoutLog
      vi.spyOn(workoutLogService, 'createOrUpdateWorkoutLog').mockResolvedValue(updatedLog);

      const result = await workoutLogService.toggleExerciseCompletion(
        mockUserId, 
        mockRoutineId, 
        mockWorkoutId, 
        mockExerciseId, 
        mockDate
      );

      expect(workoutLogService.getWorkoutLog).toHaveBeenCalledWith(
        mockUserId, mockRoutineId, mockWorkoutId, mockDate
      );
      expect(workoutLogService.createOrUpdateWorkoutLog).toHaveBeenCalledWith({
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['other-exercise', mockExerciseId],
        is_completed: true
      });
      expect(result).toEqual(updatedLog);
    });

    it('should remove exercise from completed list when already completed', async () => {
      // Mock existing log with the exercise
      const existingLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['other-exercise', mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      const updatedLog = {
        ...existingLog,
        completed_exercises: ['other-exercise'],
        is_completed: true
      };

      // Mock getWorkoutLog
      vi.spyOn(workoutLogService, 'getWorkoutLog').mockResolvedValue(existingLog);
      
      // Mock createOrUpdateWorkoutLog
      vi.spyOn(workoutLogService, 'createOrUpdateWorkoutLog').mockResolvedValue(updatedLog);

      const result = await workoutLogService.toggleExerciseCompletion(
        mockUserId, 
        mockRoutineId, 
        mockWorkoutId, 
        mockExerciseId, 
        mockDate
      );

      expect(workoutLogService.createOrUpdateWorkoutLog).toHaveBeenCalledWith({
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['other-exercise'],
        is_completed: true
      });
      expect(result).toEqual(updatedLog);
    });
  });

  describe('getWeeklyLogs', () => {
    it('should fetch logs for a week period', async () => {
      const startDate = '2024-01-15';
      const mockLogs = [
        { id: 'log-1', date: '2024-01-15', is_completed: true },
        { id: 'log-2', date: '2024-01-16', is_completed: false }
      ];

      vi.spyOn(workoutLogService, 'getWorkoutLogsByDateRange').mockResolvedValue(mockLogs as any);

      const result = await workoutLogService.getWeeklyLogs(mockUserId, startDate);

      expect(workoutLogService.getWorkoutLogsByDateRange).toHaveBeenCalledWith(
        mockUserId, 
        startDate, 
        '2024-01-21' // 7 days later
      );
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getMonthlyLogs', () => {
    it('should fetch logs for a specific month', async () => {
      const year = 2024;
      const month = 1; // January
      const mockLogs = [
        { id: 'log-1', date: '2024-01-01', is_completed: true },
        { id: 'log-2', date: '2024-01-15', is_completed: false }
      ];

      vi.spyOn(workoutLogService, 'getWorkoutLogsByDateRange').mockResolvedValue(mockLogs as any);

      const result = await workoutLogService.getMonthlyLogs(mockUserId, year, month);

      // JavaScript Date constructor: new Date(year, month-1, day)
      // So January is month 0, and new Date(2024, 1, 0) gives last day of January
      const expectedStartDate = new Date(2024, 0, 1).toISOString().split('T')[0]; // 2024-01-01
      const expectedEndDate = new Date(2024, 1, 0).toISOString().split('T')[0];   // 2024-01-31

      expect(workoutLogService.getWorkoutLogsByDateRange).toHaveBeenCalledWith(
        mockUserId, 
        expectedStartDate,
        expectedEndDate
      );
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getWorkoutProgress', () => {
    it('should calculate workout progress correctly', async () => {
      const mockLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: ['exercise-1', 'exercise-2'],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      vi.spyOn(workoutLogService, 'getWorkoutLog').mockResolvedValue(mockLog);

      const result = await workoutLogService.getWorkoutProgress(
        mockUserId, mockRoutineId, mockWorkoutId, mockDate
      );

      expect(result).toEqual({
        completedCount: 2,
        totalCount: 2, // 임시값
        percentage: 100,
        isCompleted: true
      });
    });

    it('should return zero progress when no log exists', async () => {
      vi.spyOn(workoutLogService, 'getWorkoutLog').mockResolvedValue(null);

      const result = await workoutLogService.getWorkoutProgress(
        mockUserId, mockRoutineId, mockWorkoutId, mockDate
      );

      expect(result).toEqual({
        completedCount: 0,
        totalCount: 0,
        percentage: 0,
        isCompleted: false
      });
    });
  });

  describe('getStreakDays', () => {
    it('should calculate streak days correctly', async () => {
      // Mock consecutive completed workouts
      const mockLogsDay1 = [{ id: 'log-1', is_completed: true }];
      const mockLogsDay2 = [{ id: 'log-2', is_completed: true }];
      const mockLogsDay3 = []; // No workout, breaks streak

      vi.spyOn(workoutLogService, 'getWorkoutLogsByDate')
        .mockResolvedValueOnce(mockLogsDay1 as any) // Today
        .mockResolvedValueOnce(mockLogsDay2 as any) // Yesterday
        .mockResolvedValueOnce(mockLogsDay3 as any); // Day before yesterday

      const result = await workoutLogService.getStreakDays(mockUserId);

      expect(result).toBe(2); // 2 consecutive days
    });

    it('should return 0 when no completed workouts', async () => {
      vi.spyOn(workoutLogService, 'getWorkoutLogsByDate')
        .mockResolvedValue([]); // No workouts

      const result = await workoutLogService.getStreakDays(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getMonthlyStats', () => {
    it('should calculate monthly statistics correctly', async () => {
      const mockLogs = [
        { id: 'log-1', is_completed: true },
        { id: 'log-2', is_completed: true },
        { id: 'log-3', is_completed: false },
        { id: 'log-4', is_completed: true }
      ];

      vi.spyOn(workoutLogService, 'getMonthlyLogs').mockResolvedValue(mockLogs as any);
      vi.spyOn(workoutLogService, 'getStreakDays').mockResolvedValue(5);

      const result = await workoutLogService.getMonthlyStats(mockUserId, 2024, 1);

      expect(result).toEqual({
        totalWorkouts: 4,
        completedWorkouts: 3,
        completionRate: 75, // 3/4 * 100
        streakDays: 5
      });
    });
  });
});