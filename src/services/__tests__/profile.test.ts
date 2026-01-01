import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  profileService, 
  ProfileValidationError, 
  validateProfileData,
  convertDbProfileToAppProfile,
  convertAppProfileToDbProfile
} from '../database';
import type { Profile } from '../../types';

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

describe('Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateProfileData', () => {
    it('should validate valid profile data', () => {
      const validProfile: Partial<Profile> = {
        age: 25,
        gender: 'male',
        height: 175,
        weight: 70,
        workoutLocation: 'gym',
        weeklyWorkouts: 3,
        goal: 'strength',
        focus: 'full_body',
        fitnessLevel: 'intermediate',
        experienceLevel: '1year_3years',
        planDuration: 12,
        uncomfortableAreas: [],
        exerciseHistory: []
      };

      expect(() => validateProfileData(validProfile)).not.toThrow();
    });

    it('should throw error for invalid age', () => {
      const invalidProfile: Partial<Profile> = {
        age: 10, // Too young
        gender: 'male',
        height: 175,
        weight: 70
      };

      expect(() => validateProfileData(invalidProfile)).toThrow(ProfileValidationError);
    });

    it('should throw error for invalid height', () => {
      const invalidProfile: Partial<Profile> = {
        age: 25,
        gender: 'male',
        height: 50, // Too short
        weight: 70
      };

      expect(() => validateProfileData(invalidProfile)).toThrow(ProfileValidationError);
    });

    it('should throw error for invalid weight', () => {
      const invalidProfile: Partial<Profile> = {
        age: 25,
        gender: 'male',
        height: 175,
        weight: 500 // Too heavy
      };

      expect(() => validateProfileData(invalidProfile)).toThrow(ProfileValidationError);
    });

    it('should validate exercise history', () => {
      const profileWithHistory: Partial<Profile> = {
        age: 25,
        exerciseHistory: [
          { exerciseName: '벤치프레스', maxWeight: 80, reps: 8 },
          { exerciseName: '스쿼트', maxWeight: 100, reps: 10 }
        ]
      };

      expect(() => validateProfileData(profileWithHistory)).not.toThrow();
    });

    it('should throw error for invalid exercise history', () => {
      const profileWithInvalidHistory: Partial<Profile> = {
        age: 25,
        exerciseHistory: [
          { exerciseName: '', maxWeight: 80, reps: 8 } // Empty exercise name
        ]
      };

      expect(() => validateProfileData(profileWithInvalidHistory)).toThrow(ProfileValidationError);
    });
  });

  describe('convertDbProfileToAppProfile', () => {
    it('should convert database profile to app profile', () => {
      const dbProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        age: 25,
        gender: 'male' as const,
        height: 175,
        weight: 70,
        workout_location: 'gym' as const,
        weekly_workouts: 3,
        goal: 'strength' as const,
        focus: 'full_body' as const,
        fitness_level: 'intermediate' as const,
        uncomfortable_areas: ['back'],
        experience_level: '1year_3years' as const,
        exercise_history: [{ exerciseName: '벤치프레스', maxWeight: 80, reps: 8 }],
        plan_duration: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const appProfile = convertDbProfileToAppProfile(dbProfile);

      expect(appProfile.userId).toBe('user-id');
      expect(appProfile.age).toBe(25);
      expect(appProfile.workoutLocation).toBe('gym');
      expect(appProfile.exerciseHistory).toHaveLength(1);
      expect(appProfile.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('convertAppProfileToDbProfile', () => {
    it('should convert app profile to database profile', () => {
      const appProfile: Partial<Profile> = {
        userId: 'user-id',
        age: 25,
        gender: 'male',
        height: 175,
        weight: 70,
        workoutLocation: 'gym',
        weeklyWorkouts: 3,
        goal: 'strength',
        focus: 'full_body',
        fitnessLevel: 'intermediate',
        uncomfortableAreas: ['back'],
        experienceLevel: '1year_3years',
        exerciseHistory: [{ exerciseName: '벤치프레스', maxWeight: 80, reps: 8 }],
        planDuration: 12
      };

      const dbProfile = convertAppProfileToDbProfile(appProfile);

      expect(dbProfile.user_id).toBe('user-id');
      expect(dbProfile.age).toBe(25);
      expect(dbProfile.workout_location).toBe('gym');
      expect(dbProfile.exercise_history).toEqual([{ exerciseName: '벤치프레스', maxWeight: 80, reps: 8 }]);
    });
  });

  describe('profileService methods', () => {
    it('should have all required methods', () => {
      expect(profileService.getProfile).toBeDefined();
      expect(profileService.createProfile).toBeDefined();
      expect(profileService.updateProfile).toBeDefined();
      expect(profileService.deleteProfile).toBeDefined();
      expect(profileService.isProfileComplete).toBeDefined();
      expect(profileService.getProfileSummary).toBeDefined();
      expect(profileService.validateExerciseHistory).toBeDefined();
    });
  });
});