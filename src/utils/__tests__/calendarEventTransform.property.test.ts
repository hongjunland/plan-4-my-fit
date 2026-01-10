/**
 * Property-Based Tests for Calendar Event Transformation
 *
 * **Property 2: 이벤트 데이터 완전성**
 * - 모든 생성된 캘린더 이벤트는 필수 필드를 포함해야 함
 * - summary (운동 이름), description (운동 목록), start/end dateTime, timeZone
 *
 * **Validates: Requirements 2.2**
 *
 * Feature: google-calendar-integration, Property 2: 이벤트 데이터 완전성
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  workoutToCalendarEvent,
  validateCalendarEvent,
  validateWorkoutData,
  type WorkoutEventData,
  type TransformOptions,
  type CalendarEvent,
} from '../calendarEventTransform';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

// Sample Korean exercise names for realistic testing
const koreanExerciseNames = [
  '벤치프레스', '스쿼트', '데드리프트', '풀업', '푸시업',
  '덤벨 컬', '레그프레스', '숄더프레스', '랫풀다운', '플랭크',
  '런지', '바벨로우', '딥스', '레그컬', '사이드레터럴레이즈',
];

// Sample English exercise names
const englishExerciseNames = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull Up', 'Push Up',
  'Dumbbell Curl', 'Leg Press', 'Shoulder Press', 'Lat Pulldown', 'Plank',
];

// Valid exercise name generator (using predefined names for reliability)
const exerciseNameArb = fc.oneof(
  fc.constantFrom(...koreanExerciseNames),
  fc.constantFrom(...englishExerciseNames)
);

// Valid sets generator (1-10)
const setsArb = fc.integer({ min: 1, max: 10 });

// Valid reps generator (e.g., "8-10", "12", "30초")
const repsArb = fc.oneof(
  fc.integer({ min: 1, max: 30 }).map(n => n.toString()),
  fc.tuple(fc.integer({ min: 5, max: 15 }), fc.integer({ min: 8, max: 20 }))
    .filter(([a, b]) => a < b)
    .map(([a, b]) => `${a}-${b}`),
  fc.integer({ min: 10, max: 60 }).map(n => `${n}초`)
);

// Muscle group generator
const muscleGroupArb = fc.constantFrom(
  'chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'
);

// Exercise generator
const exerciseArb = fc.record({
  name: exerciseNameArb,
  sets: setsArb,
  reps: repsArb,
  muscleGroup: muscleGroupArb,
});

// Non-empty exercise array generator (1-10 exercises)
const exercisesArb = fc.array(exerciseArb, { minLength: 1, maxLength: 10 });

// Sample workout names (Korean and English)
const workoutNamePrefixes = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
const workoutNameSuffixes = [
  '가슴', '등', '하체', '어깨', '팔', '전신', '상체',
  'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Full Body', 'Upper Body',
];

// Workout name generator
const workoutNameArb = fc.tuple(
  fc.constantFrom(...workoutNamePrefixes),
  fc.constantFrom(...workoutNameSuffixes)
).map(([prefix, suffix]) => `${prefix} - ${suffix}`);

// UUID generator
const uuidArb = fc.uuid();

// Valid workout data generator
const workoutEventDataArb: fc.Arbitrary<WorkoutEventData> = fc.record({
  id: uuidArb,
  name: workoutNameArb,
  dayNumber: fc.integer({ min: 1, max: 7 }),
  exercises: exercisesArb,
});

// Sample routine names (Korean and English)
const routineNames = [
  '초보자 루틴', '중급자 루틴', '고급자 루틴',
  '전신 운동', '상하체 분할', 'PPL 루틴',
  '홈트레이닝', '헬스장 루틴', '체중 감량',
  'Beginner Routine', 'Intermediate Routine', 'Advanced Routine',
  'Full Body', 'Upper Lower Split', 'PPL Routine',
];

// Routine name generator
const routineNameArb = fc.constantFrom(...routineNames);

// Date string generator (YYYY-MM-DD format) - using integer-based approach to avoid Invalid time value
const dateStringArb = fc.integer({
  min: 1704067200000, // 2024-01-01
  max: 1924991999000, // 2030-12-31
}).map(timestamp => new Date(timestamp).toISOString().split('T')[0]);

// Time string generator (HH:mm format)
const timeStringArb = fc.tuple(
  fc.integer({ min: 6, max: 22 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

// Duration generator (30-180 minutes)
const durationArb = fc.integer({ min: 30, max: 180 });

// Timezone generator
const timeZoneArb = fc.constantFrom(
  'Asia/Seoul',
  'Asia/Tokyo',
  'America/New_York',
  'Europe/London',
  'UTC'
);

// Transform options generator
const transformOptionsArb = (routineName: string, eventDate: string): fc.Arbitrary<TransformOptions> =>
  fc.record({
    routineName: fc.constant(routineName),
    eventDate: fc.constant(eventDate),
    startTime: fc.option(timeStringArb, { nil: undefined }),
    durationMinutes: fc.option(durationArb, { nil: undefined }),
    timeZone: fc.option(timeZoneArb, { nil: undefined }),
  });

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Calendar Event Transformation - Property 2: 이벤트 데이터 완전성', () => {
  /**
   * Property 2.1: All generated events have required summary field
   *
   * *For any* valid workout data and transform options, the generated
   * calendar event must have a non-empty summary (workout name).
   *
   * **Validates: Requirements 2.2**
   */
  it('should always include non-empty summary (workout name) in generated events', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          // Summary must exist and be non-empty
          expect(event.summary).toBeDefined();
          expect(typeof event.summary).toBe('string');
          expect(event.summary.trim().length).toBeGreaterThan(0);

          // Summary should contain workout name
          expect(event.summary).toContain(workout.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.2: All generated events have required description field
   *
   * *For any* valid workout data with exercises, the generated calendar
   * event must have a non-empty description containing the exercise list.
   *
   * **Validates: Requirements 2.2**
   */
  it('should always include non-empty description (exercise list) in generated events', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          // Description must exist and be non-empty
          expect(event.description).toBeDefined();
          expect(typeof event.description).toBe('string');
          expect(event.description.trim().length).toBeGreaterThan(0);

          // Description should contain exercise information
          workout.exercises.forEach(exercise => {
            expect(event.description).toContain(exercise.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.3: All generated events have valid start/end datetime
   *
   * *For any* valid workout data and transform options, the generated
   * calendar event must have valid start and end datetime with timezone.
   *
   * **Validates: Requirements 2.2**
   */
  it('should always include valid start/end datetime with timezone', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        timeStringArb,
        timeZoneArb,
        (workout, routineName, eventDate, startTime, timeZone) => {
          const options: TransformOptions = { routineName, eventDate, startTime, timeZone };
          const event = workoutToCalendarEvent(workout, options);

          // Start datetime must exist and be valid
          expect(event.start).toBeDefined();
          expect(event.start.dateTime).toBeDefined();
          expect(event.start.timeZone).toBe(timeZone);
          expect(new Date(event.start.dateTime).toString()).not.toBe('Invalid Date');

          // End datetime must exist and be valid
          expect(event.end).toBeDefined();
          expect(event.end.dateTime).toBeDefined();
          expect(event.end.timeZone).toBe(timeZone);
          expect(new Date(event.end.dateTime).toString()).not.toBe('Invalid Date');

          // End must be after start
          const startDate = new Date(event.start.dateTime);
          const endDate = new Date(event.end.dateTime);
          expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.4: Generated events pass validation
   *
   * *For any* valid workout data and transform options, the generated
   * calendar event must pass the validateCalendarEvent function.
   *
   * **Validates: Requirements 2.2**
   */
  it('should generate events that pass validation', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          const validation = validateCalendarEvent(event);

          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.5: Duration is calculated correctly
   *
   * *For any* workout with N exercises, the event duration should be
   * at least N * 5 + 10 minutes (5 min per exercise + 10 min warmup),
   * with a minimum of 30 minutes.
   *
   * **Validates: Requirements 2.2**
   */
  it('should calculate duration based on exercise count', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          const startDate = new Date(event.start.dateTime);
          const endDate = new Date(event.end.dateTime);
          const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

          // Expected minimum duration
          const expectedMinDuration = Math.max(
            workout.exercises.length * 5 + 10,
            30
          );

          expect(durationMinutes).toBeGreaterThanOrEqual(expectedMinDuration);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.6: Custom duration overrides calculated duration
   *
   * *For any* workout and custom duration, the event should use
   * the custom duration when provided.
   *
   * **Validates: Requirements 2.2**
   */
  it('should use custom duration when provided', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        durationArb,
        (workout, routineName, eventDate, customDuration) => {
          const options: TransformOptions = {
            routineName,
            eventDate,
            durationMinutes: customDuration,
          };
          const event = workoutToCalendarEvent(workout, options);

          const startDate = new Date(event.start.dateTime);
          const endDate = new Date(event.end.dateTime);
          const actualDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

          expect(actualDuration).toBe(customDuration);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.7: Validation rejects invalid events
   *
   * *For any* event missing required fields, validation should fail
   * with appropriate error messages.
   *
   * **Validates: Requirements 2.2**
   */
  it('should reject events with missing required fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('summary', 'description', 'start', 'end'),
        (missingField) => {
          // Create a valid event first
          const validEvent: CalendarEvent = {
            summary: 'Test Workout',
            description: 'Exercise list',
            start: { dateTime: '2024-06-15T09:00:00', timeZone: 'Asia/Seoul' },
            end: { dateTime: '2024-06-15T10:00:00', timeZone: 'Asia/Seoul' },
          };

          // Remove the field
          const invalidEvent = { ...validEvent };
          if (missingField === 'summary') {
            invalidEvent.summary = '';
          } else if (missingField === 'description') {
            invalidEvent.description = '';
          } else if (missingField === 'start') {
            invalidEvent.start = { dateTime: '', timeZone: '' };
          } else if (missingField === 'end') {
            invalidEvent.end = { dateTime: '', timeZone: '' };
          }

          const validation = validateCalendarEvent(invalidEvent);

          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.8: Workout validation catches invalid data
   *
   * *For any* workout with invalid data (empty name, no exercises, etc.),
   * validation should fail with appropriate error messages.
   *
   * **Validates: Requirements 2.2**
   */
  it('should reject workouts with invalid data', () => {
    // Test empty name
    const workoutEmptyName: WorkoutEventData = {
      id: '123',
      name: '',
      dayNumber: 1,
      exercises: [{ name: 'Push-up', sets: 3, reps: '10' }],
    };
    expect(validateWorkoutData(workoutEmptyName).valid).toBe(false);

    // Test empty exercises
    const workoutNoExercises: WorkoutEventData = {
      id: '123',
      name: 'Day 1 - Upper',
      dayNumber: 1,
      exercises: [],
    };
    expect(validateWorkoutData(workoutNoExercises).valid).toBe(false);

    // Test invalid exercise (empty name)
    const workoutInvalidExercise: WorkoutEventData = {
      id: '123',
      name: 'Day 1 - Upper',
      dayNumber: 1,
      exercises: [{ name: '', sets: 3, reps: '10' }],
    };
    expect(validateWorkoutData(workoutInvalidExercise).valid).toBe(false);

    // Test invalid sets
    const workoutInvalidSets: WorkoutEventData = {
      id: '123',
      name: 'Day 1 - Upper',
      dayNumber: 1,
      exercises: [{ name: 'Push-up', sets: 0, reps: '10' }],
    };
    expect(validateWorkoutData(workoutInvalidSets).valid).toBe(false);
  });

  /**
   * Property 2.9: Event date is preserved in output
   *
   * *For any* valid workout and event date, the generated event's
   * start datetime should be on the specified date.
   *
   * **Validates: Requirements 2.2**
   */
  it('should preserve event date in generated events', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          // Extract date from start datetime
          const eventStartDate = event.start.dateTime.split('T')[0];

          expect(eventStartDate).toBe(eventDate);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.10: Routine name is included in event
   *
   * *For any* valid workout and routine name, the generated event
   * should include the routine name in summary or description.
   *
   * **Validates: Requirements 2.2**
   */
  it('should include routine name in generated events', () => {
    fc.assert(
      fc.property(
        workoutEventDataArb,
        routineNameArb,
        dateStringArb,
        (workout, routineName, eventDate) => {
          const options: TransformOptions = { routineName, eventDate };
          const event = workoutToCalendarEvent(workout, options);

          // Routine name should appear in summary or description
          const containsRoutineName =
            event.summary.includes(routineName) ||
            event.description.includes(routineName);

          expect(containsRoutineName).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
