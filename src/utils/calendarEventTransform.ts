/**
 * Calendar Event Transformation Utilities
 * 
 * Converts workout/routine data to Google Calendar event format.
 * Requirements: 2.2 - Calendar events must include workout name, exercise list, and duration.
 * 
 * **Validates: Requirements 2.2**
 */

import type { Workout, Exercise } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CalendarEvent {
  id?: string;
  summary: string;        // 운동 이름 (예: "Day 1: 가슴/삼두")
  description: string;    // 운동 목록
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;       // 캘린더 색상
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export interface WorkoutEventData {
  id: string;
  name: string;
  dayNumber: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    muscleGroup?: string;
  }>;
}

export interface TransformOptions {
  routineName: string;
  eventDate: string;      // YYYY-MM-DD format
  startTime?: string;     // HH:mm format, default "09:00"
  durationMinutes?: number; // default calculated from exercises
  timeZone?: string;      // default "Asia/Seoul"
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_START_TIME = '09:00';
const DEFAULT_TIME_ZONE = 'Asia/Seoul';
const MINUTES_PER_EXERCISE = 5;
const WARMUP_MINUTES = 10;
const MIN_WORKOUT_DURATION = 30;
const CALENDAR_COLOR_FITNESS = '9'; // Blue

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Converts a Workout object to a Google Calendar event format.
 * 
 * @param workout - The workout data to convert
 * @param options - Transformation options including routine name, date, time
 * @returns CalendarEvent object ready for Google Calendar API
 * 
 * Requirements: 2.2 - Event includes workout name, exercise list, and duration
 */
export function workoutToCalendarEvent(
  workout: WorkoutEventData,
  options: TransformOptions
): CalendarEvent {
  const {
    routineName,
    eventDate,
    startTime = DEFAULT_START_TIME,
    durationMinutes,
    timeZone = DEFAULT_TIME_ZONE,
  } = options;

  // Build exercise list for description
  const exerciseList = formatExerciseList(workout.exercises);

  // Calculate duration
  const calculatedDuration = calculateWorkoutDuration(workout.exercises.length, durationMinutes);

  // Build datetime strings
  const { startDateTime, endDateTime } = buildDateTimeRange(
    eventDate,
    startTime,
    calculatedDuration
  );

  // Build summary (title)
  const summary = formatEventSummary(workout.name, routineName);

  // Build description
  const description = formatEventDescription(exerciseList, calculatedDuration, routineName);

  return {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    colorId: CALENDAR_COLOR_FITNESS,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
  };
}

/**
 * Converts a Workout type from the app to WorkoutEventData format
 */
export function convertWorkoutToEventData(workout: Workout): WorkoutEventData {
  return {
    id: workout.id,
    name: workout.name,
    dayNumber: workout.dayNumber,
    exercises: workout.exercises.map((ex: Exercise) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      muscleGroup: ex.muscleGroup,
    })),
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a CalendarEvent has all required fields.
 * 
 * Property 2: 이벤트 데이터 완전성
 * - summary (운동 이름) must be present and non-empty
 * - description (운동 목록) must be present and non-empty
 * - start/end dateTime must be present
 * - timeZone must be present
 * 
 * @param event - The calendar event to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validateCalendarEvent(event: CalendarEvent): ValidationResult {
  const errors: string[] = [];

  // Validate summary (workout name)
  if (!event.summary || event.summary.trim() === '') {
    errors.push('summary (운동 이름) is required');
  }

  // Validate description (exercise list)
  if (!event.description || event.description.trim() === '') {
    errors.push('description (운동 목록) is required');
  }

  // Validate start datetime
  if (!event.start?.dateTime) {
    errors.push('start.dateTime is required');
  }

  // Validate end datetime
  if (!event.end?.dateTime) {
    errors.push('end.dateTime is required');
  }

  // Validate start timezone
  if (!event.start?.timeZone) {
    errors.push('start.timeZone is required');
  }

  // Validate end timezone
  if (!event.end?.timeZone) {
    errors.push('end.timeZone is required');
  }

  // Validate datetime format (ISO 8601)
  if (event.start?.dateTime && !isValidDateTime(event.start.dateTime)) {
    errors.push('start.dateTime must be in ISO 8601 format');
  }

  if (event.end?.dateTime && !isValidDateTime(event.end.dateTime)) {
    errors.push('end.dateTime must be in ISO 8601 format');
  }

  // Validate end is after start
  if (event.start?.dateTime && event.end?.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    if (end <= start) {
      errors.push('end.dateTime must be after start.dateTime');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates workout data before transformation
 */
export function validateWorkoutData(workout: WorkoutEventData): ValidationResult {
  const errors: string[] = [];

  if (!workout.id) {
    errors.push('workout.id is required');
  }

  if (!workout.name || workout.name.trim() === '') {
    errors.push('workout.name is required');
  }

  if (!Array.isArray(workout.exercises)) {
    errors.push('workout.exercises must be an array');
  } else if (workout.exercises.length === 0) {
    errors.push('workout.exercises must not be empty');
  } else {
    // Validate each exercise
    workout.exercises.forEach((ex, idx) => {
      if (!ex.name || ex.name.trim() === '') {
        errors.push(`exercise[${idx}].name is required`);
      }
      if (typeof ex.sets !== 'number' || ex.sets < 1) {
        errors.push(`exercise[${idx}].sets must be a positive number`);
      }
      if (!ex.reps || ex.reps.trim() === '') {
        errors.push(`exercise[${idx}].reps is required`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats the exercise list for the event description
 */
function formatExerciseList(
  exercises: Array<{ name: string; sets: number; reps: string; muscleGroup?: string }>
): string {
  return exercises
    .map((ex, idx) => `${idx + 1}. ${ex.name} - ${ex.sets}세트 x ${ex.reps}`)
    .join('\n');
}

/**
 * Calculates workout duration based on number of exercises
 */
function calculateWorkoutDuration(exerciseCount: number, overrideDuration?: number): number {
  if (overrideDuration && overrideDuration > 0) {
    return overrideDuration;
  }
  
  const calculated = exerciseCount * MINUTES_PER_EXERCISE + WARMUP_MINUTES;
  return Math.max(calculated, MIN_WORKOUT_DURATION);
}

/**
 * Builds start and end datetime strings
 * Note: Uses local time format without UTC conversion to preserve timezone
 */
function buildDateTimeRange(
  eventDate: string,
  startTime: string,
  durationMinutes: number
): { startDateTime: string; endDateTime: string } {
  const startDateTime = `${eventDate}T${startTime}:00`;
  
  // Parse the start time components
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Calculate end time by adding duration
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  // Handle day overflow (if workout goes past midnight)
  const daysToAdd = Math.floor(totalMinutes / (24 * 60));
  let endDate = eventDate;
  
  if (daysToAdd > 0) {
    const date = new Date(eventDate);
    date.setDate(date.getDate() + daysToAdd);
    endDate = date.toISOString().split('T')[0];
  }
  
  // Format end time as HH:mm:ss
  const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
  const endDateTime = `${endDate}T${endTimeStr}`;

  return { startDateTime, endDateTime };
}

/**
 * Formats the event summary (title)
 */
function formatEventSummary(workoutName: string, routineName: string): string {
  return `🏋️ ${workoutName} (${routineName})`;
}

/**
 * Formats the event description
 */
function formatEventDescription(
  exerciseList: string,
  durationMinutes: number,
  routineName: string
): string {
  return `📋 운동 목록:\n${exerciseList}\n\n⏱️ 예상 소요 시간: ${durationMinutes}분\n\n🎯 루틴: ${routineName}`;
}

/**
 * Validates ISO 8601 datetime format
 */
function isValidDateTime(dateTimeStr: string): boolean {
  const date = new Date(dateTimeStr);
  return !isNaN(date.getTime());
}

/**
 * Extracts exercise summary for quick display
 */
export function getExerciseSummary(exercises: Array<{ name: string }>): string {
  if (exercises.length === 0) return '운동 없음';
  if (exercises.length <= 3) {
    return exercises.map(e => e.name).join(', ');
  }
  return `${exercises.slice(0, 3).map(e => e.name).join(', ')} 외 ${exercises.length - 3}개`;
}

/**
 * Formats duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${remainingMinutes}분`;
}
