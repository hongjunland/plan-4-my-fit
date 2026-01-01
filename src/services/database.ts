import { supabase } from './supabase';
import { logger } from '../utils/logger';
import type { Database } from '../types/database';
import type { 
  Profile as ProfileType, 
  ExerciseHistory, 
  UncomfortableArea,
  WorkoutLocation,
  Goal,
  Focus,
  FitnessLevel,
  ExperienceLevel
} from '../types';
import { 
  validateAge, 
  validateHeight, 
  validateWeight, 
  validateWeeklyWorkouts 
} from '../utils/validators';

// Type aliases for easier use
type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Profile = Tables['profiles']['Row'];
type Routine = Tables['routines']['Row'];
type WorkoutLog = Tables['workout_logs']['Row'];

// Profile validation errors
export class ProfileValidationError extends Error {
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'ProfileValidationError';
  }
}

// Enhanced profile validation
export const validateProfileData = (profileData: Partial<ProfileType>): void => {
  const errors: string[] = [];

  // Basic info validation
  if (profileData.age !== undefined && !validateAge(profileData.age)) {
    errors.push('연령은 15세에서 80세 사이여야 합니다');
  }

  if (profileData.height !== undefined && !validateHeight(profileData.height)) {
    errors.push('키는 100cm에서 250cm 사이여야 합니다');
  }

  if (profileData.weight !== undefined && !validateWeight(profileData.weight)) {
    errors.push('몸무게는 30kg에서 300kg 사이여야 합니다');
  }

  if (profileData.weeklyWorkouts !== undefined && !validateWeeklyWorkouts(profileData.weeklyWorkouts)) {
    errors.push('주간 운동 횟수는 1회에서 7회 사이여야 합니다');
  }

  // Gender validation
  if (profileData.gender !== undefined) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(profileData.gender)) {
      errors.push('성별은 male, female, other 중 하나여야 합니다');
    }
  }

  // Workout location validation
  if (profileData.workoutLocation !== undefined) {
    const validLocations: WorkoutLocation[] = ['gym', 'home', 'outdoor', 'mixed'];
    if (!validLocations.includes(profileData.workoutLocation)) {
      errors.push('운동 장소는 gym, home, outdoor, mixed 중 하나여야 합니다');
    }
  }

  // Goal validation
  if (profileData.goal !== undefined) {
    const validGoals: Goal[] = ['strength', 'weight_loss', 'endurance', 'muscle_gain', 'body_correction'];
    if (!validGoals.includes(profileData.goal)) {
      errors.push('운동 목표가 유효하지 않습니다');
    }
  }

  // Focus validation
  if (profileData.focus !== undefined) {
    const validFocus: Focus[] = ['upper_body', 'lower_body', 'full_body', 'core'];
    if (!validFocus.includes(profileData.focus)) {
      errors.push('운동 초점이 유효하지 않습니다');
    }
  }

  // Fitness level validation
  if (profileData.fitnessLevel !== undefined) {
    const validLevels: FitnessLevel[] = ['beginner', 'novice', 'intermediate', 'advanced'];
    if (!validLevels.includes(profileData.fitnessLevel)) {
      errors.push('체력 수준이 유효하지 않습니다');
    }
  }

  // Experience level validation
  if (profileData.experienceLevel !== undefined) {
    const validExperience: ExperienceLevel[] = ['none', 'under_6months', '6months_1year', '1year_3years', 'over_3years'];
    if (!validExperience.includes(profileData.experienceLevel)) {
      errors.push('운동 경력이 유효하지 않습니다');
    }
  }

  // Uncomfortable areas validation
  if (profileData.uncomfortableAreas !== undefined) {
    const validAreas: UncomfortableArea[] = ['neck', 'shoulder', 'back', 'knee', 'ankle', 'wrist'];
    const invalidAreas = profileData.uncomfortableAreas.filter(area => !validAreas.includes(area));
    if (invalidAreas.length > 0) {
      errors.push(`유효하지 않은 불편한 부위: ${invalidAreas.join(', ')}`);
    }
  }

  // Exercise history validation
  if (profileData.exerciseHistory !== undefined) {
    profileData.exerciseHistory.forEach((exercise, index) => {
      if (!exercise.exerciseName || exercise.exerciseName.trim().length === 0) {
        errors.push(`운동 기록 ${index + 1}: 운동명이 필요합니다`);
      }
      if (exercise.maxWeight <= 0 || exercise.maxWeight > 1000) {
        errors.push(`운동 기록 ${index + 1}: 중량은 0kg보다 크고 1000kg보다 작아야 합니다`);
      }
      if (exercise.reps <= 0 || exercise.reps > 1000) {
        errors.push(`운동 기록 ${index + 1}: 반복 횟수는 0보다 크고 1000보다 작아야 합니다`);
      }
    });
  }

  // Plan duration validation
  if (profileData.planDuration !== undefined) {
    const validDurations = [4, 8, 12, 16];
    if (!validDurations.includes(profileData.planDuration)) {
      errors.push('플랜 기간은 4, 8, 12, 16주 중 하나여야 합니다');
    }
  }

  if (errors.length > 0) {
    throw new ProfileValidationError('validation', errors.join('; '));
  }
};

// Convert database profile to app profile type
export const convertDbProfileToAppProfile = (dbProfile: Profile): ProfileType => {
  return {
    userId: dbProfile.user_id,
    age: dbProfile.age,
    gender: dbProfile.gender,
    height: dbProfile.height,
    weight: dbProfile.weight,
    workoutLocation: dbProfile.workout_location,
    weeklyWorkouts: dbProfile.weekly_workouts,
    goal: dbProfile.goal,
    focus: dbProfile.focus,
    fitnessLevel: dbProfile.fitness_level,
    uncomfortableAreas: (dbProfile.uncomfortable_areas as UncomfortableArea[]) || [],
    experienceLevel: dbProfile.experience_level,
    exerciseHistory: (dbProfile.exercise_history as unknown as ExerciseHistory[]) || [],
    planDuration: dbProfile.plan_duration,
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at)
  };
};

// Convert app profile to database profile type
export const convertAppProfileToDbProfile = (appProfile: Partial<ProfileType>): Tables['profiles']['Insert'] | Tables['profiles']['Update'] => {
  const dbProfile: any = {};

  if (appProfile.userId !== undefined) dbProfile.user_id = appProfile.userId;
  if (appProfile.age !== undefined) dbProfile.age = appProfile.age;
  if (appProfile.gender !== undefined) dbProfile.gender = appProfile.gender;
  if (appProfile.height !== undefined) dbProfile.height = appProfile.height;
  if (appProfile.weight !== undefined) dbProfile.weight = appProfile.weight;
  if (appProfile.workoutLocation !== undefined) dbProfile.workout_location = appProfile.workoutLocation;
  if (appProfile.weeklyWorkouts !== undefined) dbProfile.weekly_workouts = appProfile.weeklyWorkouts;
  if (appProfile.goal !== undefined) dbProfile.goal = appProfile.goal;
  if (appProfile.focus !== undefined) dbProfile.focus = appProfile.focus;
  if (appProfile.fitnessLevel !== undefined) dbProfile.fitness_level = appProfile.fitnessLevel;
  if (appProfile.uncomfortableAreas !== undefined) dbProfile.uncomfortable_areas = appProfile.uncomfortableAreas;
  if (appProfile.experienceLevel !== undefined) dbProfile.experience_level = appProfile.experienceLevel;
  if (appProfile.exerciseHistory !== undefined) dbProfile.exercise_history = appProfile.exerciseHistory;
  if (appProfile.planDuration !== undefined) dbProfile.plan_duration = appProfile.planDuration;

  return dbProfile;
};

// User operations
export const userService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1);
      
      if (error) {
        console.error('사용자 프로필 조회 오류:', error);
        throw error;
      }
      
      // 결과가 없으면 null 반환
      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('사용자 프로필 조회 실패:', error);
      throw error;
    }
  },

  async createUser(userData: Tables['users']['Insert']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: Tables['users']['Update']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Enhanced Profile operations
export const profileService = {
  async getProfile(userId: string): Promise<ProfileType | null> {
    try {
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('프로필 조회 오류:', error);
        throw error;
      }
      
      // 결과가 없으면 null 반환
      if (!data || data.length === 0) {
        return null;
      }

      return convertDbProfileToAppProfile(data[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('프로필을 불러오는 중 오류가 발생했습니다');
    }
  },

  async createProfile(profileData: Partial<ProfileType>): Promise<ProfileType> {
    try {
      // Validate profile data
      validateProfileData(profileData);

      // Ensure required fields are present
      if (!profileData.userId) {
        throw new ProfileValidationError('userId', '사용자 ID가 필요합니다');
      }

      const requiredFields = [
        'age', 'gender', 'height', 'weight', 'workoutLocation', 
        'weeklyWorkouts', 'goal', 'focus', 'fitnessLevel', 
        'experienceLevel', 'planDuration'
      ];

      for (const field of requiredFields) {
        if (profileData[field as keyof ProfileType] === undefined) {
          throw new ProfileValidationError(field, `${field}는 필수 항목입니다`);
        }
      }

      const dbProfileData = convertAppProfileToDbProfile(profileData) as Tables['profiles']['Insert'];
      
      // Use upsert to handle existing profiles
      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbProfileData, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Profile upsert error:', error);
        throw error;
      }

      logger.debug('프로필 생성/업데이트 성공', { userId: data.user_id });
      
      // 프로필 캐시 무효화
      const { authService } = await import('./auth');
      authService.invalidateProfileCache(profileData.userId);
      
      return convertDbProfileToAppProfile(data);
    } catch (error) {
      if (error instanceof ProfileValidationError) {
        throw error;
      }
      console.error('Error creating/updating profile:', error);
      throw new Error('프로필 생성 중 오류가 발생했습니다');
    }
  },

  async updateProfile(userId: string, updates: Partial<ProfileType>): Promise<ProfileType> {
    try {
      // Validate update data
      validateProfileData(updates);

      const dbUpdates = convertAppProfileToDbProfile(updates) as Tables['profiles']['Update'];
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('프로필을 찾을 수 없습니다');
        }
        throw error;
      }

      return convertDbProfileToAppProfile(data);
    } catch (error) {
      if (error instanceof ProfileValidationError) {
        throw error;
      }
      console.error('Error updating profile:', error);
      throw new Error('프로필 업데이트 중 오류가 발생했습니다');
    }
  },

  async deleteProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('프로필 삭제 중 오류가 발생했습니다');
    }
  },

  // Check if profile is complete (all required fields filled)
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return false;

      const requiredFields = [
        'age', 'gender', 'height', 'weight', 'workoutLocation', 
        'weeklyWorkouts', 'goal', 'focus', 'fitnessLevel', 
        'experienceLevel', 'planDuration'
      ];

      return requiredFields.every(field => 
        profile[field as keyof ProfileType] !== undefined && 
        profile[field as keyof ProfileType] !== null
      );
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  },

  // Get profile summary for AI routine generation
  async getProfileSummary(userId: string): Promise<string> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error('프로필을 찾을 수 없습니다');

      const genderText = profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '기타';
      const locationText = {
        gym: '헬스장',
        home: '홈트레이닝',
        outdoor: '야외운동',
        mixed: '복합'
      }[profile.workoutLocation];

      const goalText = {
        strength: '근력 증가',
        weight_loss: '체중 감량',
        endurance: '체력 향상',
        muscle_gain: '근육량 증가',
        body_correction: '체형 교정'
      }[profile.goal];

      const focusText = {
        upper_body: '상체 중심',
        lower_body: '하체 중심',
        full_body: '전신 균형',
        core: '코어 강화'
      }[profile.focus];

      const fitnessText = {
        beginner: '입문자',
        novice: '초급자',
        intermediate: '중급자',
        advanced: '상급자'
      }[profile.fitnessLevel];

      const experienceText = {
        none: '없음',
        under_6months: '6개월 미만',
        '6months_1year': '6개월~1년',
        '1year_3years': '1년~3년',
        over_3years: '3년 이상'
      }[profile.experienceLevel];

      let summary = `${profile.age}세 ${genderText}, 키 ${profile.height}cm, 몸무게 ${profile.weight}kg
운동 장소: ${locationText}, 주간 ${profile.weeklyWorkouts}회
목표: ${goalText}, 초점: ${focusText}
체력 수준: ${fitnessText}, 운동 경력: ${experienceText}
플랜 기간: ${profile.planDuration}주`;

      if (profile.uncomfortableAreas.length > 0) {
        const areaText = {
          neck: '목',
          shoulder: '어깨',
          back: '허리',
          knee: '무릎',
          ankle: '발목',
          wrist: '손목'
        };
        const areas = profile.uncomfortableAreas.map(area => areaText[area]).join(', ');
        summary += `\n불편한 부위: ${areas}`;
      }

      if (profile.exerciseHistory && profile.exerciseHistory.length > 0) {
        summary += '\n운동 경력:';
        profile.exerciseHistory.forEach(exercise => {
          summary += `\n- ${exercise.exerciseName}: ${exercise.maxWeight}kg × ${exercise.reps}회`;
        });
      }

      return summary;
    } catch (error) {
      console.error('Error generating profile summary:', error);
      throw new Error('프로필 요약 생성 중 오류가 발생했습니다');
    }
  },

  // Validate exercise history entry
  validateExerciseHistory(history: ExerciseHistory[]): boolean {
    try {
      history.forEach((exercise, index) => {
        if (!exercise.exerciseName || exercise.exerciseName.trim().length === 0) {
          throw new Error(`운동 기록 ${index + 1}: 운동명이 필요합니다`);
        }
        if (exercise.maxWeight <= 0 || exercise.maxWeight > 1000) {
          throw new Error(`운동 기록 ${index + 1}: 중량은 0kg보다 크고 1000kg보다 작아야 합니다`);
        }
        if (exercise.reps <= 0 || exercise.reps > 1000) {
          throw new Error(`운동 기록 ${index + 1}: 반복 횟수는 0보다 크고 1000보다 작아야 합니다`);
        }
      });
      return true;
    } catch (error) {
      console.error('Exercise history validation error:', error);
      return false;
    }
  }
};

// Routine operations
export const routineService = {
  async getUserRoutines(userId: string): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getActiveRoutine(userId: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createRoutine(routineData: Tables['routines']['Insert']): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .insert(routineData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRoutine(routineId: string, updates: Tables['routines']['Update']): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);
    
    if (error) throw error;
  },

  async activateRoutine(userId: string, routineId: string): Promise<void> {
    // First deactivate all routines for the user
    await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Then activate the selected routine
    const { error } = await supabase
      .from('routines')
      .update({ is_active: true })
      .eq('id', routineId);
    
    if (error) throw error;
  }
};

// Workout log operations
export const workoutLogService = {
  async getWorkoutLog(userId: string, routineId: string, workoutId: string, date: string): Promise<WorkoutLog | null> {
    try {
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .eq('workout_id', workoutId)
        .eq('date', date)
        .limit(1);
      
      if (error) {
        console.error('워크아웃 로그 조회 오류:', error);
        throw error;
      }

      // 결과가 없으면 null 반환
      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('워크아웃 로그 조회 실패:', error);
      throw error;
    }
  },

  async getWorkoutLogsByDate(userId: string, date: string): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);
    
    if (error) throw error;
    return data || [];
  },

  async getWorkoutLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createOrUpdateWorkoutLog(logData: Tables['workout_logs']['Insert']): Promise<WorkoutLog> {
    const { data, error } = await supabase
      .from('workout_logs')
      .upsert(logData, {
        onConflict: 'user_id,routine_id,workout_id,date'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteWorkoutLog(logId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', logId);
    
    if (error) throw error;
  },

  // 운동 완료 체크/언체크 함수 (요구사항 5.4, 5.5)
  async toggleExerciseCompletion(
    userId: string, 
    routineId: string, 
    workoutId: string, 
    exerciseId: string, 
    date: string
  ): Promise<WorkoutLog> {
    try {
      // 기존 로그 조회 - .single() 대신 배열로 조회하여 406 오류 방지
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .eq('workout_id', workoutId)
        .eq('date', date)
        .limit(1);
      
      if (error) {
        console.error('기존 워크아웃 로그 조회 오류:', error);
        throw error;
      }

      const existingLog = data && data.length > 0 ? data[0] : null;
      let completedExercises: string[] = [];
      
      if (existingLog) {
        completedExercises = (existingLog.completed_exercises as string[]) || [];
      }
      
      // 운동 완료 상태 토글
      const exerciseIndex = completedExercises.indexOf(exerciseId);
      if (exerciseIndex > -1) {
        // 이미 완료된 운동이면 제거
        completedExercises.splice(exerciseIndex, 1);
      } else {
        // 완료되지 않은 운동이면 추가
        completedExercises.push(exerciseId);
      }
      
      // 전체 운동 완료 여부 확인 (이는 실제 루틴의 운동 개수와 비교해야 함)
      const isCompleted = completedExercises.length > 0; // 임시로 하나라도 완료되면 true
      
      const logData: Tables['workout_logs']['Insert'] = {
        user_id: userId,
        routine_id: routineId,
        workout_id: workoutId,
        date,
        completed_exercises: completedExercises,
        is_completed: isCompleted
      };
      
      return await this.createOrUpdateWorkoutLog(logData);
    } catch (error) {
      console.error('Error toggling exercise completion:', error);
      throw new Error('운동 완료 상태 변경 중 오류가 발생했습니다');
    }
  },

  // 운동 전체 완료 처리
  async completeWorkout(
    userId: string, 
    routineId: string, 
    workoutId: string, 
    date: string,
    exerciseIds: string[]
  ): Promise<WorkoutLog> {
    try {
      const logData: Tables['workout_logs']['Insert'] = {
        user_id: userId,
        routine_id: routineId,
        workout_id: workoutId,
        date,
        completed_exercises: exerciseIds,
        is_completed: true
      };
      
      return await this.createOrUpdateWorkoutLog(logData);
    } catch (error) {
      console.error('Error completing workout:', error);
      throw new Error('운동 완료 처리 중 오류가 발생했습니다');
    }
  },

  // 주간 기록 조회 (요구사항 5.8)
  async getWeeklyLogs(userId: string, startDate: string): Promise<WorkoutLog[]> {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // 7일간
      
      return await this.getWorkoutLogsByDateRange(
        userId, 
        startDate, 
        endDate.toISOString().split('T')[0]
      );
    } catch (error) {
      console.error('Error fetching weekly logs:', error);
      throw new Error('주간 운동 기록 조회 중 오류가 발생했습니다');
    }
  },

  // 월간 기록 조회 (요구사항 5.12)
  async getMonthlyLogs(userId: string, year: number, month: number): Promise<WorkoutLog[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // 해당 월의 마지막 날
      
      return await this.getWorkoutLogsByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    } catch (error) {
      console.error('Error fetching monthly logs:', error);
      throw new Error('월간 운동 기록 조회 중 오류가 발생했습니다');
    }
  },

  // 오늘의 운동 기록 조회
  async getTodayLog(userId: string): Promise<WorkoutLog[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getWorkoutLogsByDate(userId, today);
    } catch (error) {
      console.error('Error fetching today logs:', error);
      throw new Error('오늘 운동 기록 조회 중 오류가 발생했습니다');
    }
  },

  // 운동 진행률 계산
  async getWorkoutProgress(userId: string, routineId: string, workoutId: string, date: string): Promise<{
    completedCount: number;
    totalCount: number;
    percentage: number;
    isCompleted: boolean;
  }> {
    try {
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .eq('workout_id', workoutId)
        .eq('date', date)
        .limit(1);
      
      if (error) {
        console.error('워크아웃 진행률 조회 오류:', error);
        return {
          completedCount: 0,
          totalCount: 0,
          percentage: 0,
          isCompleted: false
        };
      }

      const log = data && data.length > 0 ? data[0] : null;
      const completedExercises = (log?.completed_exercises as string[]) || [];
      
      // 실제 구현에서는 루틴에서 해당 운동의 전체 운동 개수를 가져와야 함
      // 여기서는 임시로 완료된 운동 개수만 반환
      const completedCount = completedExercises.length;
      const totalCount = completedCount; // 임시값, 실제로는 루틴에서 가져와야 함
      
      return {
        completedCount,
        totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        isCompleted: log?.is_completed || false
      };
    } catch (error) {
      console.error('Error calculating workout progress:', error);
      return {
        completedCount: 0,
        totalCount: 0,
        percentage: 0,
        isCompleted: false
      };
    }
  },

  // 연속 운동 일수 계산
  async getStreakDays(userId: string): Promise<number> {
    try {
      const today = new Date();
      let streakDays = 0;
      let currentDate = new Date(today);
      
      // 오늘부터 거꾸로 확인하면서 연속 운동 일수 계산
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const logs = await this.getWorkoutLogsByDate(userId, dateStr);
        
        const hasCompletedWorkout = logs.some(log => log.is_completed);
        
        if (hasCompletedWorkout) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
        
        // 무한 루프 방지 (최대 365일)
        if (streakDays >= 365) break;
      }
      
      return streakDays;
    } catch (error) {
      console.error('Error calculating streak days:', error);
      return 0;
    }
  },

  // 월간 완료 통계
  async getMonthlyStats(userId: string, year: number, month: number): Promise<{
    totalWorkouts: number;
    completedWorkouts: number;
    completionRate: number;
    streakDays: number;
  }> {
    try {
      const monthlyLogs = await this.getMonthlyLogs(userId, year, month);
      const completedWorkouts = monthlyLogs.filter(log => log.is_completed).length;
      const totalWorkouts = monthlyLogs.length;
      const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
      const streakDays = await this.getStreakDays(userId);
      
      return {
        totalWorkouts,
        completedWorkouts,
        completionRate,
        streakDays
      };
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        completionRate: 0,
        streakDays: 0
      };
    }
  }
};

// Utility functions
export const dbUtils = {
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async getUserStats(userId: string) {
    const [routines, logs] = await Promise.all([
      routineService.getUserRoutines(userId),
      workoutLogService.getWorkoutLogsByDateRange(
        userId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      )
    ]);

    return {
      totalRoutines: routines.length,
      activeRoutines: routines.filter(r => r.is_active).length,
      workoutsLast30Days: logs.length,
      completedWorkoutsLast30Days: logs.filter(l => l.is_completed).length
    };
  }
};

export default {
  userService,
  profileService,
  routineService,
  workoutLogService,
  dbUtils
};