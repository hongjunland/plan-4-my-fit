import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { routinesService } from '../routines';
import { supabase } from '../supabase';
import type { RoutineSettings, Workout, Exercise } from '../../types';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('RoutinesService', () => {
  const mockUserId = 'user-123';
  const mockRoutineId = 'routine-123';
  const mockWorkoutId = 'workout-123';
  const mockExerciseId = 'exercise-123';

  const mockRoutineSettings: RoutineSettings = {
    durationWeeks: 8,
    workoutsPerWeek: 3,
    splitType: 'upper_lower',
    additionalRequest: 'Focus on strength',
  };

  const mockExercise: Exercise = {
    id: mockExerciseId,
    name: '벤치프레스',
    sets: 3,
    reps: '8-10',
    muscleGroup: 'chest',
    description: '가슴 운동',
  };

  const mockWorkout: Workout = {
    id: mockWorkoutId,
    dayNumber: 1,
    name: 'Day 1 - 상체',
    exercises: [mockExercise],
  };

  const mockRoutine = {
    id: mockRoutineId,
    user_id: mockUserId,
    name: '테스트 루틴',
    settings: mockRoutineSettings,
    workouts: [],
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSupabaseChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue(mockSupabaseChain);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserRoutines', () => {
    it('should fetch user routines successfully', async () => {
      // Mock routines query
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [mockRoutine],
        error: null,
      });

      // Mock workouts query
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{
          id: mockWorkoutId,
          routine_id: mockRoutineId,
          day_number: 1,
          name: 'Day 1 - 상체',
        }],
        error: null,
      });

      // Mock exercises query
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{
          id: mockExerciseId,
          workout_id: mockWorkoutId,
          name: '벤치프레스',
          sets: 3,
          reps: '8-10',
          muscle_group: 'chest',
          description: '가슴 운동',
        }],
        error: null,
      });

      const result = await routinesService.getUserRoutines(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('테스트 루틴');
      expect(result[0].workouts).toHaveLength(1);
      expect(result[0].workouts[0].exercises).toHaveLength(1);
    });

    it('should return empty array when no routines exist', async () => {
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await routinesService.getUserRoutines(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(routinesService.getUserRoutines(mockUserId))
        .rejects.toThrow();
    });
  });

  describe('getActiveRoutine', () => {
    it('should fetch active routine successfully', async () => {
      const activeRoutine = { ...mockRoutine, is_active: true };
      
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [activeRoutine],
        error: null,
      });

      // Mock workouts query
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await routinesService.getActiveRoutine(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.isActive).toBe(true);
    });

    it('should return null when no active routine exists', async () => {
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await routinesService.getActiveRoutine(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('createRoutine', () => {
    const createRequest = {
      name: '새 루틴',
      settings: mockRoutineSettings,
      workouts: [mockWorkout],
    };

    it('should create routine successfully', async () => {
      // Mock routine count check
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValueOnce(countChain);

      // Mock routine creation
      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockRoutine,
        error: null,
      });

      // Mock workout creation
      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: mockWorkoutId,
          routine_id: mockRoutineId,
          day_number: 1,
          name: 'Day 1 - 상체',
        },
        error: null,
      });

      // Mock exercise creation
      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: [{
          id: mockExerciseId,
          workout_id: mockWorkoutId,
          name: '벤치프레스',
          sets: 3,
          reps: '8-10',
          muscle_group: 'chest',
          description: '가슴 운동',
        }],
        error: null,
      });

      const result = await routinesService.createRoutine(mockUserId, createRequest);

      expect(result.name).toBe('테스트 루틴');
      expect(result.workouts).toHaveLength(1);
    });

    it('should throw error when routine limit exceeded', async () => {
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValueOnce(countChain);

      await expect(routinesService.createRoutine(mockUserId, createRequest))
        .rejects.toThrow('루틴은 최대 10개까지만 생성할 수 있습니다.');
    });
  });

  describe('activateRoutine', () => {
    it('should activate routine and deactivate others', async () => {
      // Mock deactivate all routines
      mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: null,
      });

      // Mock activate specific routine
      mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await expect(routinesService.activateRoutine(mockUserId, mockRoutineId))
        .resolves.not.toThrow();

      expect(mockSupabaseChain.update).toHaveBeenCalledTimes(2);
    });

    it('should throw error when activation fails', async () => {
      mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      await expect(routinesService.activateRoutine(mockUserId, mockRoutineId))
        .rejects.toThrow();
    });
  });

  describe('updateExercise', () => {
    const exerciseUpdates = {
      name: '수정된 벤치프레스',
      sets: 4,
      reps: '6-8',
    };

    it('should update exercise successfully', async () => {
      const updatedExercise = {
        id: mockExerciseId,
        name: '수정된 벤치프레스',
        sets: 4,
        reps: '6-8',
        muscle_group: 'chest',
        description: '가슴 운동',
      };

      mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: updatedExercise,
        error: null,
      });

      const result = await routinesService.updateExercise(mockExerciseId, exerciseUpdates);

      expect(result.name).toBe('수정된 벤치프레스');
      expect(result.sets).toBe(4);
      expect(result.reps).toBe('6-8');
    });

    it('should throw error when update fails', async () => {
      mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(routinesService.updateExercise(mockExerciseId, exerciseUpdates))
        .rejects.toThrow();
    });
  });

  describe('addExercise', () => {
    const newExercise = {
      name: '새 운동',
      sets: 3,
      reps: '10-12',
      muscleGroup: 'back' as const,
      description: '등 운동',
    };

    it('should add exercise successfully', async () => {
      // Mock count query
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 2,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValueOnce(countChain);

      // Mock insert
      const createdExercise = {
        id: 'new-exercise-id',
        workout_id: mockWorkoutId,
        name: '새 운동',
        sets: 3,
        reps: '10-12',
        muscle_group: 'back',
        description: '등 운동',
      };

      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: createdExercise,
        error: null,
      });

      const result = await routinesService.addExercise(mockWorkoutId, newExercise);

      expect(result.name).toBe('새 운동');
      expect(result.muscleGroup).toBe('back');
    });
  });

  describe('deleteExercise', () => {
    it('should delete exercise successfully', async () => {
      mockSupabaseChain.delete.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await expect(routinesService.deleteExercise(mockExerciseId))
        .resolves.not.toThrow();
    });

    it('should throw error when deletion fails', async () => {
      mockSupabaseChain.delete.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      await expect(routinesService.deleteExercise(mockExerciseId))
        .rejects.toThrow();
    });
  });

  describe('reorderExercises', () => {
    it('should reorder exercises successfully', async () => {
      const exerciseIds = ['ex1', 'ex2', 'ex3'];
      
      // Mock each update call
      exerciseIds.forEach(() => {
        mockSupabaseChain.update.mockReturnValueOnce(mockSupabaseChain);
        mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
        mockSupabaseChain.eq.mockReturnValueOnce(Promise.resolve({ error: null }));
      });

      await expect(routinesService.reorderExercises(mockWorkoutId, exerciseIds))
        .resolves.not.toThrow();
    });
  });

  describe('duplicateRoutine', () => {
    it('should duplicate routine successfully', async () => {
      // Mock original routine fetch
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [mockRoutine],
        error: null,
      });

      // Mock workouts query for original routine
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{
          id: mockWorkoutId,
          routine_id: mockRoutineId,
          day_number: 1,
          name: 'Day 1 - 상체',
        }],
        error: null,
      });

      // Mock exercises query for original routine
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: [{
          id: mockExerciseId,
          workout_id: mockWorkoutId,
          name: '벤치프레스',
          sets: 3,
          reps: '8-10',
          muscle_group: 'chest',
          description: '가슴 운동',
        }],
        error: null,
      });

      // Mock routine count check for duplication
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValueOnce(countChain);

      // Mock new routine creation
      const duplicatedRoutine = {
        ...mockRoutine,
        id: 'new-routine-id',
        name: '테스트 루틴 (복사본)',
      };

      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: duplicatedRoutine,
        error: null,
      });

      // Mock workout creation for duplicated routine
      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: 'new-workout-id',
          routine_id: 'new-routine-id',
          day_number: 1,
          name: 'Day 1 - 상체',
        },
        error: null,
      });

      // Mock exercise creation for duplicated routine
      mockSupabaseChain.insert.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: [{
          id: 'new-exercise-id',
          workout_id: 'new-workout-id',
          name: '벤치프레스',
          sets: 3,
          reps: '8-10',
          muscle_group: 'chest',
          description: '가슴 운동',
        }],
        error: null,
      });

      const result = await routinesService.duplicateRoutine(mockUserId, mockRoutineId);

      expect(result.name).toBe('테스트 루틴 (복사본)');
    });

    it('should throw error when original routine not found', async () => {
      mockSupabaseChain.select.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await expect(routinesService.duplicateRoutine(mockUserId, mockRoutineId))
        .rejects.toThrow('복제할 루틴을 찾을 수 없습니다.');
    });
  });

  describe('deleteRoutine', () => {
    it('should delete routine successfully', async () => {
      mockSupabaseChain.delete.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await expect(routinesService.deleteRoutine(mockRoutineId))
        .resolves.not.toThrow();
    });

    it('should throw error when deletion fails', async () => {
      mockSupabaseChain.delete.mockReturnValueOnce(mockSupabaseChain);
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      await expect(routinesService.deleteRoutine(mockRoutineId))
        .rejects.toThrow();
    });
  });
});