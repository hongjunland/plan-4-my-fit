// TypeScript type definitions

// Re-export database types
export type { Database } from './database';

// 사용자
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
  isFirstLogin: boolean;
  createdAt: Date;
}

// 프로필 (확장된 정보)
export interface Profile {
  userId: string;
  // 기본 정보
  age: number;                   // 15-80
  gender: 'male' | 'female' | 'other';
  height: number;                // cm (100-250)
  weight: number;                // kg (30-300)
  
  // 운동 환경
  workoutLocation: WorkoutLocation;
  weeklyWorkouts: number;        // 1-7회
  
  // 목표 및 초점
  goal: Goal;
  focus: Focus;
  
  // 신체 조건
  fitnessLevel: FitnessLevel;
  uncomfortableAreas: UncomfortableArea[];
  
  // 운동 경력
  experienceLevel: ExperienceLevel;
  exerciseHistory?: ExerciseHistory[];
  
  // 플랜 설정
  planDuration: number;          // 4, 8, 12, 16주
  
  createdAt: Date;
  updatedAt: Date;
}

export type WorkoutLocation = 'gym' | 'home' | 'outdoor' | 'mixed';
export type Goal = 'strength' | 'weight_loss' | 'endurance' | 'muscle_gain' | 'body_correction';
export type Focus = 'upper_body' | 'lower_body' | 'full_body' | 'core';
export type FitnessLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced';
export type UncomfortableArea = 'neck' | 'shoulder' | 'back' | 'knee' | 'ankle' | 'wrist';
export type ExperienceLevel = 'none' | 'under_6months' | '6months_1year' | '1year_3years' | 'over_3years';

export interface ExerciseHistory {
  exerciseName: string;          // "벤치프레스", "스쿼트", "데드리프트" 등
  maxWeight: number;             // kg
  reps: number;                  // 반복 횟수
}

// 루틴 설정
export interface RoutineSettings {
  durationWeeks: number;     // 2, 4, 6, 8, 12
  workoutsPerWeek: number;   // 2-6
  splitType: SplitType;
  additionalRequest?: string;
}

export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs';

// 루틴
export interface Routine {
  id: string;
  userId: string;
  name: string;
  settings: RoutineSettings;
  workouts: Workout[];
  isActive: boolean;         // 1개만 true 가능
  createdAt: Date;
  updatedAt: Date;
}

// 운동일
export interface Workout {
  id: string;
  dayNumber: number;
  name: string;              // "Day 1 - 상체"
  exercises: Exercise[];
}

// 근육 그룹
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'abs' | 'legs' | 'full_body';

// 운동 항목 (근육 그룹 정보 추가)
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;              // "8-10" 또는 "30초"
  muscleGroup: MuscleGroup;  // 주요 타겟 근육
  description?: string;      // 운동 설명 (선택)
}

// 운동 기록
export interface WorkoutLog {
  id: string;
  userId: string;
  routineId: string;
  workoutId: string;
  date: string;              // "2024-12-24"
  completedExercises: string[];  // exercise id 배열
  isCompleted: boolean;
}