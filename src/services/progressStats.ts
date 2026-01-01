import { workoutLogService, routineService } from './database';
import type { MuscleGroup } from '../types';

// 진행 상황 통계 인터페이스
export interface WeeklyStats {
  completionRate: number;
  completedWorkouts: number;
  totalWorkouts: number;
  weekDates: string[];
}

export interface MonthlyStats {
  completionRate: number;
  completedWorkouts: number;
  totalWorkouts: number;
  streakDays: number;
  workoutDays: number;
}

export interface MuscleGroupStats {
  muscleGroup: MuscleGroup;
  frequency: number;
  percentage: number;
}

export interface ProgressStats {
  weekly: WeeklyStats;
  monthly: MonthlyStats;
  muscleGroups: MuscleGroupStats[];
  streakDays: number;
}

// 주간 완료율 계산 (요구사항 7.1)
export const calculateWeeklyStats = async (userId: string): Promise<WeeklyStats> => {
  try {
    // 이번 주 월요일부터 일요일까지의 날짜 계산
    const today = new Date();
    const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // 월요일까지의 오프셋
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    // 주간 운동 기록 조회
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const weeklyLogs = await workoutLogService.getWorkoutLogsByDateRange(userId, startDate, endDate);
    
    // 완료된 운동 개수 계산
    const completedWorkouts = weeklyLogs.filter(log => log.is_completed).length;
    const totalWorkouts = weeklyLogs.length;
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
    
    return {
      completionRate,
      completedWorkouts,
      totalWorkouts,
      weekDates
    };
  } catch (error) {
    console.error('Error calculating weekly stats:', error);
    return {
      completionRate: 0,
      completedWorkouts: 0,
      totalWorkouts: 0,
      weekDates: []
    };
  }
};

// 월간 완료율 계산 (요구사항 7.2)
export const calculateMonthlyStats = async (userId: string, year?: number, month?: number): Promise<MonthlyStats> => {
  try {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);
    
    // 월간 운동 기록 조회
    const monthlyLogs = await workoutLogService.getMonthlyLogs(userId, targetYear, targetMonth);
    
    // 완료된 운동 개수 계산
    const completedWorkouts = monthlyLogs.filter(log => log.is_completed).length;
    const totalWorkouts = monthlyLogs.length;
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
    
    // 운동한 날짜 수 계산 (중복 제거)
    const workoutDates = new Set(monthlyLogs.map(log => log.date));
    const workoutDays = workoutDates.size;
    
    // 연속 운동 일수 계산
    const streakDays = await workoutLogService.getStreakDays(userId);
    
    return {
      completionRate,
      completedWorkouts,
      totalWorkouts,
      streakDays,
      workoutDays
    };
  } catch (error) {
    console.error('Error calculating monthly stats:', error);
    return {
      completionRate: 0,
      completedWorkouts: 0,
      totalWorkouts: 0,
      streakDays: 0,
      workoutDays: 0
    };
  }
};

// 연속 운동 일수 계산 (요구사항 7.3)
export const calculateStreakDays = async (userId: string): Promise<number> => {
  try {
    return await workoutLogService.getStreakDays(userId);
  } catch (error) {
    console.error('Error calculating streak days:', error);
    return 0;
  }
};

// 근육 그룹별 운동 빈도 분석 (요구사항 7.3)
export const calculateMuscleGroupStats = async (userId: string, days: number = 30): Promise<MuscleGroupStats[]> => {
  try {
    // 지난 N일간의 운동 기록 조회
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const logs = await workoutLogService.getWorkoutLogsByDateRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    // 활성 루틴 조회하여 운동별 근육 그룹 정보 가져오기
    const activeRoutine = await routineService.getActiveRoutine(userId);
    if (!activeRoutine) {
      return [];
    }
    
    // 근육 그룹별 빈도 계산
    const muscleGroupCount: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      arms: 0,
      abs: 0,
      legs: 0,
      full_body: 0
    };
    
    let totalExercises = 0;
    
    // 완료된 운동 기록에서 근육 그룹 빈도 계산
    logs.forEach(log => {
      if (log.is_completed && log.completed_exercises) {
        const completedExercises = log.completed_exercises as string[];
        
        // 루틴에서 해당 운동의 근육 그룹 정보 찾기
        const routineData = activeRoutine.workouts as any[];
        routineData.forEach(workout => {
          if (workout.id === log.workout_id && workout.exercises) {
            workout.exercises.forEach((exercise: any) => {
              if (completedExercises.includes(exercise.id)) {
                const muscleGroup = exercise.muscleGroup as MuscleGroup;
                if (muscleGroup && muscleGroupCount.hasOwnProperty(muscleGroup)) {
                  muscleGroupCount[muscleGroup]++;
                  totalExercises++;
                }
              }
            });
          }
        });
      }
    });
    
    // 근육 그룹별 통계 생성
    const muscleGroupStats: MuscleGroupStats[] = Object.entries(muscleGroupCount)
      .map(([muscleGroup, frequency]) => ({
        muscleGroup: muscleGroup as MuscleGroup,
        frequency,
        percentage: totalExercises > 0 ? Math.round((frequency / totalExercises) * 100) : 0
      }))
      .filter(stat => stat.frequency > 0) // 빈도가 0인 근육 그룹 제외
      .sort((a, b) => b.frequency - a.frequency); // 빈도 순으로 정렬
    
    return muscleGroupStats;
  } catch (error) {
    console.error('Error calculating muscle group stats:', error);
    return [];
  }
};

// 전체 진행 상황 통계 계산
export const calculateProgressStats = async (userId: string): Promise<ProgressStats> => {
  try {
    const [weekly, monthly, muscleGroups, streakDays] = await Promise.all([
      calculateWeeklyStats(userId),
      calculateMonthlyStats(userId),
      calculateMuscleGroupStats(userId),
      calculateStreakDays(userId)
    ]);
    
    return {
      weekly,
      monthly,
      muscleGroups,
      streakDays
    };
  } catch (error) {
    console.error('Error calculating progress stats:', error);
    return {
      weekly: {
        completionRate: 0,
        completedWorkouts: 0,
        totalWorkouts: 0,
        weekDates: []
      },
      monthly: {
        completionRate: 0,
        completedWorkouts: 0,
        totalWorkouts: 0,
        streakDays: 0,
        workoutDays: 0
      },
      muscleGroups: [],
      streakDays: 0
    };
  }
};

// 루틴 전체 진행률 계산
export const calculateRoutineProgress = async (userId: string): Promise<{
  completionRate: number;
  completedDays: number;
  totalDays: number;
  remainingDays: number;
}> => {
  try {
    const activeRoutine = await routineService.getActiveRoutine(userId);
    if (!activeRoutine) {
      return {
        completionRate: 0,
        completedDays: 0,
        totalDays: 0,
        remainingDays: 0
      };
    }
    
    const routineSettings = activeRoutine.settings as any;
    const durationWeeks = routineSettings?.durationWeeks || 4;
    const workoutsPerWeek = routineSettings?.workoutsPerWeek || 3;
    const totalDays = durationWeeks * workoutsPerWeek;
    
    // 루틴 시작일부터 현재까지의 완료된 운동 개수 계산
    const routineStartDate = new Date(activeRoutine.created_at);
    const today = new Date();
    
    const logs = await workoutLogService.getWorkoutLogsByDateRange(
      userId,
      routineStartDate.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );
    
    const completedDays = logs.filter(log => 
      log.routine_id === activeRoutine.id && log.is_completed
    ).length;
    
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const remainingDays = Math.max(0, totalDays - completedDays);
    
    return {
      completionRate,
      completedDays,
      totalDays,
      remainingDays
    };
  } catch (error) {
    console.error('Error calculating routine progress:', error);
    return {
      completionRate: 0,
      completedDays: 0,
      totalDays: 0,
      remainingDays: 0
    };
  }
};

// 동기부여 메시지 생성
export const generateMotivationMessage = (stats: ProgressStats): string => {
  const { weekly, monthly, streakDays } = stats;
  
  // 연속 운동 일수 기반 메시지
  if (streakDays >= 30) {
    return `🔥 대단해요! ${streakDays}일 연속 운동 중이에요!`;
  } else if (streakDays >= 14) {
    return `💪 훌륭해요! ${streakDays}일 연속으로 꾸준히 하고 있어요!`;
  } else if (streakDays >= 7) {
    return `⭐ 좋아요! ${streakDays}일 연속 운동하고 있어요!`;
  } else if (streakDays >= 3) {
    return `👍 잘하고 있어요! ${streakDays}일 연속이에요!`;
  }
  
  // 주간 완료율 기반 메시지
  if (weekly.completionRate >= 80) {
    return `🎉 이번 주 ${weekly.completionRate}% 달성! 정말 잘하고 있어요!`;
  } else if (weekly.completionRate >= 60) {
    return `👏 이번 주 ${weekly.completionRate}% 완료! 조금만 더 힘내요!`;
  } else if (weekly.completionRate >= 40) {
    return `💪 이번 주 ${weekly.completionRate}% 진행 중! 꾸준히 해봐요!`;
  }
  
  // 월간 완료율 기반 메시지
  if (monthly.completionRate >= 70) {
    return `🌟 이번 달 ${monthly.completionRate}% 달성! 멋져요!`;
  } else if (monthly.completionRate >= 50) {
    return `🚀 이번 달 ${monthly.completionRate}% 진행! 계속 화이팅!`;
  }
  
  // 기본 격려 메시지
  return '💪 오늘도 운동으로 건강한 하루 만들어요!';
};

export default {
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateStreakDays,
  calculateMuscleGroupStats,
  calculateProgressStats,
  calculateRoutineProgress,
  generateMotivationMessage
};