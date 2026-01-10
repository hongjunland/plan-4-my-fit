import { supabase } from './supabase';
import type { RoutineSettings, MuscleGroup } from '../types';
import type { WorkoutWithExercises } from './routines';

// ============================================================================
// 타입 정의
// ============================================================================

export interface ScheduledWorkout {
  id: string;
  routineId: string;
  userId: string;
  scheduledDate: string; // YYYY-MM-DD
  workoutId: string | null;
  isRestDay: boolean;
  notes: string | null;
}

export interface CalendarData {
  routine: {
    id: string;
    name: string;
    settings: RoutineSettings;
  } | null;
  workouts: WorkoutWithExercises[];
  schedules: Map<string, ScheduledWorkout>; // date -> schedule
  logs: Map<string, WorkoutLog>; // date -> log
}

export interface WorkoutLog {
  date: string;
  workoutId: string;
  completedExercises: string[];
  isCompleted: boolean;
}

// ============================================================================
// 통합 캘린더 서비스
// ============================================================================

class ScheduledWorkoutsService {
  /**
   * 캘린더 페이지에 필요한 모든 데이터를 한 번에 조회
   * - 활성 루틴 정보
   * - 워크아웃 목록 (운동 포함)
   * - 날짜별 일정
   * - 완료 기록
   */
  async getCalendarData(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarData> {
    try {
      // 1. 활성 루틴 조회
      const { data: routines, error: routineError } = await supabase
        .from('routines')
        .select('id, name, settings')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (routineError) throw routineError;

      const routine = routines?.[0] || null;

      if (!routine) {
        return {
          routine: null,
          workouts: [],
          schedules: new Map(),
          logs: new Map(),
        };
      }

      // 2. 워크아웃 + 운동 조회 (한 번에)
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          day_number,
          name,
          exercises (
            id,
            name,
            sets,
            reps,
            muscle_group,
            description,
            order_index
          )
        `)
        .eq('routine_id', routine.id)
        .order('day_number', { ascending: true });

      if (workoutsError) throw workoutsError;

      const workouts: WorkoutWithExercises[] = (workoutsData || []).map(w => ({
        id: w.id,
        dayNumber: w.day_number,
        name: w.name,
        exercises: (w.exercises || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(e => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            muscleGroup: e.muscle_group as MuscleGroup,
            description: e.description || undefined,
          })),
      }));

      // 3. 일정 조회
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('routine_id', routine.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);

      if (schedulesError) throw schedulesError;

      const schedules = new Map<string, ScheduledWorkout>();
      (schedulesData || []).forEach(s => {
        schedules.set(s.scheduled_date, {
          id: s.id,
          routineId: s.routine_id,
          userId: s.user_id,
          scheduledDate: s.scheduled_date,
          workoutId: s.workout_id,
          isRestDay: s.is_rest_day,
          notes: s.notes,
        });
      });

      // 4. 완료 기록 조회
      const { data: logsData, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('routine_id', routine.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (logsError) throw logsError;

      const logs = new Map<string, WorkoutLog>();
      (logsData || []).forEach(l => {
        logs.set(l.date, {
          date: l.date,
          workoutId: l.workout_id,
          completedExercises: (l.completed_exercises as string[]) || [],
          isCompleted: l.is_completed,
        });
      });

      return {
        routine: {
          id: routine.id,
          name: routine.name,
          settings: routine.settings as unknown as RoutineSettings,
        },
        workouts,
        schedules,
        logs,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('캘린더 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴 일정 생성 (루틴 활성화 시 호출)
   */
  async generateSchedule(
    routineId: string,
    userId: string,
    startDate: string,
    durationWeeks: number,
    workouts: WorkoutWithExercises[]
  ): Promise<void> {
    try {
      // 기존 일정 삭제
      await supabase
        .from('scheduled_workouts')
        .delete()
        .eq('routine_id', routineId);

      if (workouts.length === 0) return;

      const schedules: {
        routine_id: string;
        user_id: string;
        scheduled_date: string;
        workout_id: string | null;
        is_rest_day: boolean;
      }[] = [];

      const cycleLength = workouts.length + 1; // 워크아웃 수 + 휴식 1일
      const totalDays = durationWeeks * 7;
      const start = new Date(startDate + 'T00:00:00');

      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + dayIndex);
        const dateStr = this.formatDate(currentDate);

        const workoutIndex = dayIndex % cycleLength;

        if (workoutIndex < workouts.length) {
          schedules.push({
            routine_id: routineId,
            user_id: userId,
            scheduled_date: dateStr,
            workout_id: workouts[workoutIndex].id,
            is_rest_day: false,
          });
        } else {
          schedules.push({
            routine_id: routineId,
            user_id: userId,
            scheduled_date: dateStr,
            workout_id: null,
            is_rest_day: true,
          });
        }
      }

      // 배치 삽입 (100개씩)
      const batchSize = 100;
      for (let i = 0; i < schedules.length; i += batchSize) {
        const batch = schedules.slice(i, i + batchSize);
        const { error } = await supabase
          .from('scheduled_workouts')
          .insert(batch);

        if (error) throw error;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('일정 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 일정 수정 (운동 변경 / 휴식일 전환)
   */
  async updateSchedule(
    scheduleId: string,
    updates: {
      workoutId?: string | null;
      isRestDay?: boolean;
      notes?: string | null;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.workoutId !== undefined) {
        updateData.workout_id = updates.workoutId;
      }
      if (updates.isRestDay !== undefined) {
        updateData.is_rest_day = updates.isRestDay;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const { error } = await supabase
        .from('scheduled_workouts')
        .update(updateData)
        .eq('id', scheduleId);

      if (error) throw error;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('일정 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 두 날짜의 일정 교환 (드래그앤드롭)
   */
  async swapSchedules(
    scheduleId1: string,
    scheduleId2: string
  ): Promise<void> {
    try {
      const { data: schedules, error: fetchError } = await supabase
        .from('scheduled_workouts')
        .select('id, workout_id, is_rest_day')
        .in('id', [scheduleId1, scheduleId2]);

      if (fetchError) throw fetchError;
      if (!schedules || schedules.length !== 2) {
        throw new Error('일정을 찾을 수 없습니다.');
      }

      const [s1, s2] = schedules;

      await Promise.all([
        supabase
          .from('scheduled_workouts')
          .update({ workout_id: s2.workout_id, is_rest_day: s2.is_rest_day })
          .eq('id', scheduleId1),
        supabase
          .from('scheduled_workouts')
          .update({ workout_id: s1.workout_id, is_rest_day: s1.is_rest_day })
          .eq('id', scheduleId2),
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('일정 교환 실패:', error);
      throw error;
    }
  }

  /**
   * 루틴의 모든 일정 삭제
   */
  async deleteSchedulesForRoutine(routineId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .delete()
        .eq('routine_id', routineId);

      if (error) throw error;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('일정 삭제 실패:', error);
      throw error;
    }
  }

  // 헬퍼
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const scheduledWorkoutsService = new ScheduledWorkoutsService();
