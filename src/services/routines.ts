import { supabase } from './supabase';
import { logger } from '../utils/logger';
import type { Routine, RoutineSettings, Workout, Exercise } from '../types';
import { 
  getConnectionStatus, 
  createEventsForRoutine, 
  deleteEventsForRoutine,
  syncRoutine as syncRoutineToCalendar
} from './googleCalendar';

// Exercise 타입을 re-export
export type { Exercise } from '../types';

export interface CreateRoutineRequest {
  name: string;
  settings: RoutineSettings;
  workouts: Workout[];
}

export interface UpdateRoutineRequest {
  name?: string;
  settings?: RoutineSettings;
  isActive?: boolean;
}

export interface RoutineWithDetails extends Omit<Routine, 'workouts'> {
  workouts: WorkoutWithExercises[];
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

class RoutinesService {
  // 간단한 메모리 캐시
  private activeRoutineCache: {
    userId: string;
    routine: RoutineWithDetails | null;
    timestamp: number;
  } | null = null;

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 사용자의 모든 루틴 조회
   */
  async getUserRoutines(userId: string): Promise<RoutineWithDetails[]> {
    try {
      // 루틴 기본 정보 조회
      const { data: routines, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (routinesError) {
        console.error('루틴 조회 오류:', routinesError);
        throw routinesError;
      }

      if (!routines || routines.length === 0) {
        return [];
      }

      // 각 루틴의 워크아웃과 운동 정보 조회
      const routinesWithDetails = await Promise.all(
        routines.map(async (routine) => {
          const workouts = await this.getRoutineWorkouts(routine.id);
          
          return {
            id: routine.id,
            userId: routine.user_id,
            name: routine.name,
            settings: routine.settings as unknown as RoutineSettings,
            workouts,
            isActive: routine.is_active,
            createdAt: new Date(routine.created_at),
            updatedAt: new Date(routine.updated_at),
          };
        })
      );

      return routinesWithDetails;
    } catch (error) {
      console.error('루틴 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 활성 루틴 조회 (캐싱 포함)
   */
  async getActiveRoutine(userId: string, useCache = true): Promise<RoutineWithDetails | null> {
    try {
      // 캐시 확인
      if (useCache && this.activeRoutineCache && 
          this.activeRoutineCache.userId === userId &&
          (Date.now() - this.activeRoutineCache.timestamp) < this.CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('활성 루틴 캐시 사용');
        }
        return this.activeRoutineCache.routine;
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('활성 루틴 조회 시작', { userId });
      }
      
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data: routines, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 활성 루틴 조회 오류:', error);
        }
        throw error;
      }

      // 결과가 없으면 null 반환
      if (!routines || routines.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('활성 루틴이 없음');
        }
        // 캐시 업데이트
        this.activeRoutineCache = {
          userId,
          routine: null,
          timestamp: Date.now()
        };
        return null;
      }

      const routine = routines[0];
      const workouts = await this.getRoutineWorkouts(routine.id);

      const result = {
        id: routine.id,
        userId: routine.user_id,
        name: routine.name,
        settings: routine.settings as unknown as RoutineSettings,
        workouts,
        isActive: routine.is_active,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
      };

      // 캐시 업데이트
      this.activeRoutineCache = {
        userId,
        routine: result,
        timestamp: Date.now()
      };

      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('활성 루틴 조회 실패:', error);
      }
      throw error;
    }
  }

  /**
   * 캐시 무효화 (루틴 변경 시 호출)
   */
  private invalidateActiveRoutineCache(userId?: string) {
    if (!userId || (this.activeRoutineCache && this.activeRoutineCache.userId === userId)) {
      this.activeRoutineCache = null;
    }
  }

  /**
   * 특정 루틴 조회
   */
  async getRoutine(routineId: string): Promise<RoutineWithDetails | null> {
    try {
      // .single() 대신 배열로 조회하여 406 오류 방지
      const { data: routines, error } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .limit(1);

      if (error) {
        console.error('루틴 조회 오류:', error);
        throw error;
      }

      if (!routines || routines.length === 0) {
        return null;
      }

      const routine = routines[0];
      const workouts = await this.getRoutineWorkouts(routine.id);

      return {
        id: routine.id,
        userId: routine.user_id,
        name: routine.name,
        settings: routine.settings as unknown as RoutineSettings,
        workouts,
        isActive: routine.is_active,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
      };
    } catch (error) {
      console.error('루틴 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴의 워크아웃과 운동 정보 조회
   */
  private async getRoutineWorkouts(routineId: string): Promise<WorkoutWithExercises[]> {
    try {
      // 워크아웃 조회
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('routine_id', routineId)
        .order('day_number', { ascending: true });

      if (workoutsError) {
        console.error('워크아웃 조회 오류:', workoutsError);
        throw workoutsError;
      }

      if (!workouts || workouts.length === 0) {
        return [];
      }

      // 각 워크아웃의 운동 정보 조회
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const { data: exercises, error: exercisesError } = await supabase
            .from('exercises')
            .select('*')
            .eq('workout_id', workout.id)
            .order('order_index', { ascending: true });

          if (exercisesError) {
            console.error('운동 조회 오류:', exercisesError);
            throw exercisesError;
          }

          return {
            id: workout.id,
            dayNumber: workout.day_number,
            name: workout.name,
            exercises: (exercises || []).map(exercise => ({
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              muscleGroup: exercise.muscle_group,
              description: exercise.description || undefined,
            })),
          };
        })
      );

      return workoutsWithExercises;
    } catch (error) {
      console.error('워크아웃 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 새 루틴 생성
   */
  async createRoutine(userId: string, request: CreateRoutineRequest): Promise<RoutineWithDetails> {
    try {
      // 루틴 개수 제한 확인 (10개)
      const { count, error: countError } = await supabase
        .from('routines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('루틴 개수 확인 오류:', countError);
        throw countError;
      }

      if (count && count >= 10) {
        throw new Error('루틴은 최대 10개까지만 생성할 수 있습니다.');
      }

      // 루틴 생성
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          name: request.name,
          settings: request.settings as unknown as any,
          workouts: [], // 빈 배열로 설정 (정규화된 구조 사용)
          is_active: false,
        })
        .select()
        .single();

      if (routineError) {
        console.error('루틴 생성 오류:', routineError);
        throw routineError;
      }

      // 워크아웃과 운동 생성
      const workouts = await this.createWorkoutsAndExercises(routine.id, request.workouts);

      // 캐시 무효화 (새 루틴이 생성되었으므로)
      this.invalidateActiveRoutineCache(userId);

      return {
        id: routine.id,
        userId: routine.user_id,
        name: routine.name,
        settings: routine.settings as unknown as RoutineSettings,
        workouts,
        isActive: routine.is_active,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
      };
    } catch (error) {
      console.error('루틴 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 워크아웃과 운동 생성
   */
  private async createWorkoutsAndExercises(routineId: string, workouts: Workout[]): Promise<WorkoutWithExercises[]> {
    try {
      const createdWorkouts: WorkoutWithExercises[] = [];

      for (const workout of workouts) {
        // 워크아웃 생성
        const { data: createdWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            routine_id: routineId,
            day_number: workout.dayNumber,
            name: workout.name,
          })
          .select()
          .single();

        if (workoutError) {
          console.error('워크아웃 생성 오류:', workoutError);
          throw workoutError;
        }

        // 운동 생성
        const exercisesToInsert = workout.exercises.map((exercise, index) => ({
          workout_id: createdWorkout.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          muscle_group: exercise.muscleGroup,
          description: exercise.description,
          order_index: index,
        }));

        const { data: createdExercises, error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert)
          .select();

        if (exercisesError) {
          console.error('운동 생성 오류:', exercisesError);
          throw exercisesError;
        }

        createdWorkouts.push({
          id: createdWorkout.id,
          dayNumber: createdWorkout.day_number,
          name: createdWorkout.name,
          exercises: (createdExercises || []).map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            muscleGroup: exercise.muscle_group,
            description: exercise.description || undefined,
          })),
        });
      }

      return createdWorkouts;
    } catch (error) {
      console.error('워크아웃 및 운동 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴 수정
   * 활성화된 루틴 수정 시 구글 캘린더 이벤트도 업데이트
   * Requirements: 3.1
   */
  async updateRoutine(routineId: string, request: UpdateRoutineRequest): Promise<RoutineWithDetails> {
    try {
      // 먼저 루틴 정보 조회 (활성 상태 확인용)
      const existingRoutine = await this.getRoutine(routineId);
      if (!existingRoutine) {
        throw new Error('루틴을 찾을 수 없습니다.');
      }

      const updateData: any = {};
      if (request.name) updateData.name = request.name;
      if (request.settings) updateData.settings = request.settings as unknown as any;
      if (request.isActive !== undefined) updateData.is_active = request.isActive;

      const { data: routine, error } = await supabase
        .from('routines')
        .update(updateData)
        .eq('id', routineId)
        .select()
        .single();

      if (error) {
        console.error('루틴 수정 오류:', error);
        throw error;
      }

      const workouts = await this.getRoutineWorkouts(routine.id);

      // 활성화된 루틴이 수정된 경우 캘린더 이벤트 동기화
      if (existingRoutine.isActive) {
        const calendarStatus = await getConnectionStatus();
        
        if (calendarStatus.isConnected && !calendarStatus.isTokenExpired) {
          try {
            // 기존 이벤트 삭제 후 새로 생성 (동기화)
            const today = new Date().toISOString().split('T')[0];
            await syncRoutineToCalendar(routineId, today);
            logger.info('Synced calendar events for updated routine', { routineId });
          } catch (syncError) {
            // 캘린더 동기화 실패는 로깅만 하고 계속 진행
            logger.warn('Failed to sync calendar events for routine', { 
              routineId, 
              error: syncError instanceof Error ? syncError.message : String(syncError) 
            });
          }
        }
      }

      // 캐시 무효화
      this.invalidateActiveRoutineCache(routine.user_id);

      return {
        id: routine.id,
        userId: routine.user_id,
        name: routine.name,
        settings: routine.settings as unknown as RoutineSettings,
        workouts,
        isActive: routine.is_active,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
      };
    } catch (error) {
      console.error('루틴 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴 활성화 (다른 모든 루틴 비활성화)
   * 구글 캘린더 연동 시 이벤트 자동 생성
   * Requirements: 2.1, 4.1
   */
  async activateRoutine(userId: string, routineId: string): Promise<void> {
    try {
      // 기존 활성 루틴의 캘린더 이벤트 삭제 (구글 캘린더 연동된 경우)
      const calendarStatus = await getConnectionStatus();
      
      if (calendarStatus.isConnected && !calendarStatus.isTokenExpired) {
        // 기존 활성 루틴 조회
        const { data: activeRoutines } = await supabase
          .from('routines')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true);
        
        // 기존 활성 루틴의 캘린더 이벤트 삭제
        if (activeRoutines && activeRoutines.length > 0) {
          for (const routine of activeRoutines) {
            try {
              await deleteEventsForRoutine(routine.id);
              logger.debug('Deleted calendar events for deactivated routine', { routineId: routine.id });
            } catch (error) {
              // 캘린더 이벤트 삭제 실패는 로깅만 하고 계속 진행
              logger.warn('Failed to delete calendar events for routine', { 
                routineId: routine.id, 
                error: error instanceof Error ? error.message : String(error) 
              });
            }
          }
        }
      }

      // 트랜잭션으로 처리: 모든 루틴 비활성화 후 선택한 루틴 활성화
      const { error: deactivateError } = await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('루틴 비활성화 오류:', deactivateError);
        }
        throw deactivateError;
      }

      const { error: activateError } = await supabase
        .from('routines')
        .update({ is_active: true })
        .eq('id', routineId)
        .eq('user_id', userId);

      if (activateError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('루틴 활성화 오류:', activateError);
        }
        throw activateError;
      }

      // 구글 캘린더 연동된 경우 새 루틴의 이벤트 생성
      if (calendarStatus.isConnected && !calendarStatus.isTokenExpired) {
        try {
          const today = new Date().toISOString().split('T')[0];
          await createEventsForRoutine({
            routineId,
            startDate: today,
            timeZone: 'Asia/Seoul',
            defaultStartTime: '09:00',
            durationMinutes: 60,
          });
          logger.info('Created calendar events for activated routine', { routineId });
        } catch (error) {
          // 캘린더 이벤트 생성 실패는 로깅만 하고 계속 진행
          // 루틴 활성화 자체는 성공으로 처리
          logger.error('Failed to create calendar events for routine', 
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }

      // 캐시 무효화
      this.invalidateActiveRoutineCache(userId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 활성화 실패:', error);
      }
      throw error;
    }
  }

  /**
   * 루틴 비활성화
   * 구글 캘린더 연동 시 이벤트 자동 삭제
   * Requirements: 4.1
   */
  async deactivateRoutine(userId: string, routineId: string): Promise<void> {
    try {
      // 구글 캘린더 연동된 경우 이벤트 삭제
      const calendarStatus = await getConnectionStatus();
      
      if (calendarStatus.isConnected && !calendarStatus.isTokenExpired) {
        try {
          await deleteEventsForRoutine(routineId);
          logger.info('Deleted calendar events for deactivated routine', { routineId });
        } catch (error) {
          // 캘린더 이벤트 삭제 실패는 로깅만 하고 계속 진행
          logger.warn('Failed to delete calendar events for routine', { 
            routineId, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // 루틴 비활성화
      const { error } = await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('id', routineId)
        .eq('user_id', userId);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('루틴 비활성화 오류:', error);
        }
        throw error;
      }

      // 캐시 무효화
      this.invalidateActiveRoutineCache(userId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 비활성화 실패:', error);
      }
      throw error;
    }
  }

  /**
   * 루틴 복제
   */
  async duplicateRoutine(userId: string, routineId: string): Promise<RoutineWithDetails> {
    try {
      // 원본 루틴 조회
      const originalRoutine = await this.getRoutine(routineId);
      if (!originalRoutine) {
        throw new Error('복제할 루틴을 찾을 수 없습니다.');
      }

      // 새 이름 생성
      const newName = `${originalRoutine.name} (복사본)`;

      // 루틴 복제
      const duplicatedRoutine = await this.createRoutine(userId, {
        name: newName,
        settings: originalRoutine.settings,
        workouts: originalRoutine.workouts,
      });

      return duplicatedRoutine;
    } catch (error) {
      console.error('루틴 복제 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴 삭제
   * 구글 캘린더 연동 시 이벤트도 함께 삭제
   * Requirements: 4.2
   */
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      // 구글 캘린더 연동된 경우 이벤트 먼저 삭제
      const calendarStatus = await getConnectionStatus();
      
      if (calendarStatus.isConnected && !calendarStatus.isTokenExpired) {
        try {
          await deleteEventsForRoutine(routineId);
          logger.info('Deleted calendar events for deleted routine', { routineId });
        } catch (error) {
          // 캘린더 이벤트 삭제 실패는 로깅만 하고 계속 진행
          // 루틴 삭제는 진행되어야 함
          logger.warn('Failed to delete calendar events for routine', { 
            routineId, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('루틴 삭제 오류:', error);
        }
        throw error;
      }

      // 캐시 무효화 (모든 사용자의 캐시를 무효화)
      this.invalidateActiveRoutineCache();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('루틴 삭제 실패:', error);
      }
      throw error;
    }
  }

  /**
   * 운동 항목 수정
   */
  async updateExercise(exerciseId: string, updates: Partial<Exercise>): Promise<Exercise> {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.sets) updateData.sets = updates.sets;
      if (updates.reps) updateData.reps = updates.reps;
      if (updates.muscleGroup) updateData.muscle_group = updates.muscleGroup;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { data: exercise, error } = await supabase
        .from('exercises')
        .update(updateData)
        .eq('id', exerciseId)
        .select()
        .single();

      if (error) {
        console.error('운동 수정 오류:', error);
        throw error;
      }

      return {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        muscleGroup: exercise.muscle_group,
        description: exercise.description || undefined,
      };
    } catch (error) {
      console.error('운동 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 운동 항목 추가
   */
  async addExercise(workoutId: string, exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
    try {
      // 현재 워크아웃의 운동 개수 조회 (order_index 계산용)
      const { count, error: countError } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', workoutId);

      if (countError) {
        console.error('운동 개수 조회 오류:', countError);
        throw countError;
      }

      const { data: createdExercise, error } = await supabase
        .from('exercises')
        .insert({
          workout_id: workoutId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          muscle_group: exercise.muscleGroup,
          description: exercise.description,
          order_index: count || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('운동 추가 오류:', error);
        throw error;
      }

      return {
        id: createdExercise.id,
        name: createdExercise.name,
        sets: createdExercise.sets,
        reps: createdExercise.reps,
        muscleGroup: createdExercise.muscle_group,
        description: createdExercise.description || undefined,
      };
    } catch (error) {
      console.error('운동 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 운동 항목 삭제
   */
  async deleteExercise(exerciseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) {
        console.error('운동 삭제 오류:', error);
        throw error;
      }
    } catch (error) {
      console.error('운동 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 운동 순서 변경
   */
  async reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void> {
    try {
      // 각 운동의 order_index 업데이트
      const updates = exerciseIds.map((exerciseId, index) => 
        supabase
          .from('exercises')
          .update({ order_index: index })
          .eq('id', exerciseId)
          .eq('workout_id', workoutId)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('운동 순서 변경 실패:', error);
      throw error;
    }
  }
}

export const routinesService = new RoutinesService();