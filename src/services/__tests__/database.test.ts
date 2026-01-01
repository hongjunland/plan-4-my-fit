import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService, profileService, routineService, workoutLogService, dbUtils } from '../database';

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn().mockReturnThis()
    }))
  }
}));

describe('Database Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('userService', () => {
    it('should have all required methods', () => {
      expect(userService.getCurrentUser).toBeDefined();
      expect(userService.getUserProfile).toBeDefined();
      expect(userService.createUser).toBeDefined();
      expect(userService.updateUser).toBeDefined();
    });
  });

  describe('profileService', () => {
    it('should have all required methods', () => {
      expect(profileService.getProfile).toBeDefined();
      expect(profileService.createProfile).toBeDefined();
      expect(profileService.updateProfile).toBeDefined();
      expect(profileService.deleteProfile).toBeDefined();
    });
  });

  describe('routineService', () => {
    it('should have all required methods', () => {
      expect(routineService.getUserRoutines).toBeDefined();
      expect(routineService.getActiveRoutine).toBeDefined();
      expect(routineService.createRoutine).toBeDefined();
      expect(routineService.updateRoutine).toBeDefined();
      expect(routineService.deleteRoutine).toBeDefined();
      expect(routineService.activateRoutine).toBeDefined();
    });
  });

  describe('workoutLogService', () => {
    it('should have all required methods', () => {
      expect(workoutLogService.getWorkoutLog).toBeDefined();
      expect(workoutLogService.getWorkoutLogsByDate).toBeDefined();
      expect(workoutLogService.getWorkoutLogsByDateRange).toBeDefined();
      expect(workoutLogService.createOrUpdateWorkoutLog).toBeDefined();
      expect(workoutLogService.deleteWorkoutLog).toBeDefined();
    });
  });

  describe('dbUtils', () => {
    it('should have utility methods', () => {
      expect(dbUtils.checkConnection).toBeDefined();
      expect(dbUtils.getUserStats).toBeDefined();
    });
  });
});