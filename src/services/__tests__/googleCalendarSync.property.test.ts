/**
 * Property-Based Tests for Google Calendar Sync
 *
 * **Property 1: 캘린더 동기화 일관성**
 * - 활성화된 루틴의 모든 운동 일정이 구글 캘린더에 존재해야 함
 * - 루틴 비활성화/삭제 시 모든 관련 이벤트가 삭제되어야 함
 *
 * **Validates: Requirements 2.1, 3.1, 3.2, 4.1, 4.2, 5.3, 6.4**
 *
 * Feature: google-calendar-integration, Property 1: 캘린더 동기화 일관성
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types for Sync Testing
// ============================================================================

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscleGroup: string;
}

interface Workout {
  id: string;
  name: string;
  dayNumber: number;
  exercises: Exercise[];
}

interface Routine {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  settings: {
    durationWeeks: number;
    workoutsPerWeek: number;
  };
  workouts: Workout[];
}

interface CalendarEvent {
  id: string;
  routineId: string;
  workoutId: string;
  eventDate: string;
  summary: string;
  description: string;
}

interface EventMapping {
  userId: string;
  routineId: string;
  workoutId: string;
  googleEventId: string;
  eventDate: string;
}

interface SyncResult {
  success: boolean;
  createdCount: number;
  deletedCount: number;
  errors: string[];
}

// ============================================================================
// In-Memory Sync Store (simulates database + Google Calendar)
// ============================================================================

class InMemorySyncStore {
  private routines: Map<string, Routine> = new Map();
  private calendarEvents: Map<string, CalendarEvent> = new Map();
  private eventMappings: Map<string, EventMapping[]> = new Map();

  // Routine operations
  addRoutine(routine: Routine): void {
    this.routines.set(routine.id, { ...routine });
  }

  getRoutine(routineId: string): Routine | null {
    return this.routines.get(routineId) || null;
  }

  getActiveRoutines(userId: string): Routine[] {
    return Array.from(this.routines.values())
      .filter(r => r.userId === userId && r.isActive);
  }

  updateRoutineStatus(routineId: string, isActive: boolean): void {
    const routine = this.routines.get(routineId);
    if (routine) {
      routine.isActive = isActive;
      this.routines.set(routineId, routine);
    }
  }

  deleteRoutine(routineId: string): void {
    this.routines.delete(routineId);
  }

  // Calendar event operations (simulates Google Calendar)
  createCalendarEvent(event: CalendarEvent): string {
    const eventId = `gcal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.calendarEvents.set(eventId, { ...event, id: eventId });
    return eventId;
  }

  getCalendarEvent(eventId: string): CalendarEvent | null {
    return this.calendarEvents.get(eventId) || null;
  }

  deleteCalendarEvent(eventId: string): boolean {
    return this.calendarEvents.delete(eventId);
  }

  getCalendarEventsForRoutine(routineId: string): CalendarEvent[] {
    return Array.from(this.calendarEvents.values())
      .filter(e => e.routineId === routineId);
  }

  // Event mapping operations
  addEventMapping(mapping: EventMapping): void {
    const userMappings = this.eventMappings.get(mapping.userId) || [];
    userMappings.push({ ...mapping });
    this.eventMappings.set(mapping.userId, userMappings);
  }

  getEventMappings(userId: string): EventMapping[] {
    return [...(this.eventMappings.get(userId) || [])];
  }

  getEventMappingsForRoutine(userId: string, routineId: string): EventMapping[] {
    const userMappings = this.eventMappings.get(userId) || [];
    return userMappings.filter(m => m.routineId === routineId);
  }

  deleteEventMappingsForRoutine(userId: string, routineId: string): void {
    const userMappings = this.eventMappings.get(userId) || [];
    this.eventMappings.set(
      userId,
      userMappings.filter(m => m.routineId !== routineId)
    );
  }

  // Sync operations
  syncRoutine(routine: Routine, startDate: string): SyncResult {
    const errors: string[] = [];
    let createdCount = 0;
    let deletedCount = 0;

    // Delete existing events for this routine
    const existingMappings = this.getEventMappingsForRoutine(routine.userId, routine.id);
    for (const mapping of existingMappings) {
      if (this.deleteCalendarEvent(mapping.googleEventId)) {
        deletedCount++;
      }
    }
    this.deleteEventMappingsForRoutine(routine.userId, routine.id);

    // Only create events if routine is active
    if (!routine.isActive) {
      return { success: true, createdCount: 0, deletedCount, errors: [] };
    }

    // Create new events for each workout
    const totalDays = routine.settings.durationWeeks * 7;
    const workoutsPerWeek = routine.settings.workoutsPerWeek;
    const currentDate = new Date(startDate);
    let workoutIndex = 0;
    let weekWorkoutCount = 0;

    for (let day = 0; day < totalDays && routine.workouts.length > 0; day++) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends and respect workouts per week limit
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && weekWorkoutCount < workoutsPerWeek) {
        const workout = routine.workouts[workoutIndex % routine.workouts.length];
        const eventDate = currentDate.toISOString().split('T')[0];

        try {
          const event: CalendarEvent = {
            id: '',
            routineId: routine.id,
            workoutId: workout.id,
            eventDate,
            summary: `🏋️ ${workout.name} (${routine.name})`,
            description: workout.exercises.map((ex, i) => 
              `${i + 1}. ${ex.name} - ${ex.sets}세트 x ${ex.reps}`
            ).join('\n'),
          };

          const eventId = this.createCalendarEvent(event);

          this.addEventMapping({
            userId: routine.userId,
            routineId: routine.id,
            workoutId: workout.id,
            googleEventId: eventId,
            eventDate,
          });

          createdCount++;
          workoutIndex++;
          weekWorkoutCount++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Failed to create event for ${workout.name}: ${errorMessage}`);
        }
      }

      // Reset weekly count on Sunday
      if (dayOfWeek === 0) {
        weekWorkoutCount = 0;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: errors.length === 0,
      createdCount,
      deletedCount,
      errors,
    };
  }

  syncAllRoutines(userId: string, startDate: string): SyncResult {
    const activeRoutines = this.getActiveRoutines(userId);
    let totalCreated = 0;
    let totalDeleted = 0;
    const allErrors: string[] = [];

    for (const routine of activeRoutines) {
      const result = this.syncRoutine(routine, startDate);
      totalCreated += result.createdCount;
      totalDeleted += result.deletedCount;
      allErrors.push(...result.errors);
    }

    return {
      success: allErrors.length === 0,
      createdCount: totalCreated,
      deletedCount: totalDeleted,
      errors: allErrors,
    };
  }
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

const uuidArb = fc.uuid();

const exerciseNameArb = fc.constantFrom(
  '벤치프레스', '스쿼트', '데드리프트', '풀업', '푸시업',
  '덤벨 컬', '레그프레스', '숄더프레스', '랫풀다운', '플랭크'
);

const muscleGroupArb = fc.constantFrom(
  'chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'
);

const exerciseArb: fc.Arbitrary<Exercise> = fc.record({
  id: uuidArb,
  name: exerciseNameArb,
  sets: fc.integer({ min: 1, max: 5 }),
  reps: fc.oneof(
    fc.integer({ min: 5, max: 15 }).map(n => n.toString()),
    fc.tuple(fc.integer({ min: 5, max: 10 }), fc.integer({ min: 10, max: 15 }))
      .filter(([a, b]) => a < b)
      .map(([a, b]) => `${a}-${b}`)
  ),
  muscleGroup: muscleGroupArb,
});

const workoutNameArb = fc.tuple(
  fc.constantFrom('Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'),
  fc.constantFrom('가슴', '등', '하체', '어깨', '팔', '전신')
).map(([day, muscle]) => `${day} - ${muscle}`);

const workoutArb: fc.Arbitrary<Workout> = fc.record({
  id: uuidArb,
  name: workoutNameArb,
  dayNumber: fc.integer({ min: 1, max: 7 }),
  exercises: fc.array(exerciseArb, { minLength: 1, maxLength: 6 }),
});

const routineNameArb = fc.constantFrom(
  '초보자 루틴', '중급자 루틴', '고급자 루틴',
  '전신 운동', '상하체 분할', 'PPL 루틴'
);

const routineArb = (userId: string): fc.Arbitrary<Routine> => fc.record({
  id: uuidArb,
  userId: fc.constant(userId),
  name: routineNameArb,
  isActive: fc.boolean(),
  settings: fc.record({
    durationWeeks: fc.integer({ min: 1, max: 8 }),
    workoutsPerWeek: fc.integer({ min: 2, max: 5 }),
  }),
  workouts: fc.array(workoutArb, { minLength: 1, maxLength: 5 }),
});

// Generate valid date strings in YYYY-MM-DD format
const dateStringArb = fc.tuple(
  fc.integer({ min: 2024, max: 2025 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }) // Use 28 to avoid invalid dates
).map(([year, month, day]) => 
  `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
);

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Google Calendar Sync - Property 1: 캘린더 동기화 일관성', () => {
  /**
   * Property 1.1: Active routine sync creates events for all workouts
   *
   * *For any* active routine with workouts, syncing should create
   * calendar events for each scheduled workout day.
   *
   * **Validates: Requirements 2.1, 6.4**
   */
  it('should create calendar events for all workouts in active routine', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        (userId, startDate) => {
          const store = new InMemorySyncStore();

          // Create an active routine with workouts
          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '테스트 루틴',
            isActive: true,
            settings: {
              durationWeeks: 2,
              workoutsPerWeek: 3,
            },
            workouts: [
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 1 - 가슴',
                dayNumber: 1,
                exercises: [{ id: '1', name: '벤치프레스', sets: 3, reps: '10', muscleGroup: 'chest' }],
              },
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 2 - 등',
                dayNumber: 2,
                exercises: [{ id: '2', name: '풀업', sets: 3, reps: '8', muscleGroup: 'back' }],
              },
            ],
          };

          store.addRoutine(routine);
          const result = store.syncRoutine(routine, startDate);

          // Should create events
          expect(result.success).toBe(true);
          expect(result.createdCount).toBeGreaterThan(0);

          // All created events should have mappings
          const mappings = store.getEventMappingsForRoutine(userId, routine.id);
          expect(mappings.length).toBe(result.createdCount);

          // Each mapping should have a corresponding calendar event
          for (const mapping of mappings) {
            const event = store.getCalendarEvent(mapping.googleEventId);
            expect(event).not.toBeNull();
            expect(event!.routineId).toBe(routine.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.2: Inactive routine sync creates no events
   *
   * *For any* inactive routine, syncing should not create any
   * calendar events.
   *
   * **Validates: Requirements 4.1**
   */
  it('should not create events for inactive routines', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        (userId, startDate) => {
          const store = new InMemorySyncStore();

          // Create an inactive routine
          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '비활성 루틴',
            isActive: false,
            settings: {
              durationWeeks: 4,
              workoutsPerWeek: 3,
            },
            workouts: [
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 1',
                dayNumber: 1,
                exercises: [{ id: '1', name: '스쿼트', sets: 4, reps: '8', muscleGroup: 'legs' }],
              },
            ],
          };

          store.addRoutine(routine);
          const result = store.syncRoutine(routine, startDate);

          // Should not create any events
          expect(result.success).toBe(true);
          expect(result.createdCount).toBe(0);

          // No mappings should exist
          const mappings = store.getEventMappingsForRoutine(userId, routine.id);
          expect(mappings.length).toBe(0);

          // No calendar events for this routine
          const events = store.getCalendarEventsForRoutine(routine.id);
          expect(events.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.3: Deactivating routine removes all events
   *
   * *For any* routine that is deactivated, all its calendar events
   * should be deleted.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  it('should delete all events when routine is deactivated', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        (userId, startDate) => {
          const store = new InMemorySyncStore();

          // Create and sync an active routine
          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '활성 루틴',
            isActive: true,
            settings: {
              durationWeeks: 2,
              workoutsPerWeek: 3,
            },
            workouts: [
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 1',
                dayNumber: 1,
                exercises: [{ id: '1', name: '데드리프트', sets: 3, reps: '5', muscleGroup: 'back' }],
              },
            ],
          };

          store.addRoutine(routine);
          const initialResult = store.syncRoutine(routine, startDate);
          
          // Verify events were created
          expect(initialResult.createdCount).toBeGreaterThan(0);
          const initialMappings = store.getEventMappingsForRoutine(userId, routine.id);
          expect(initialMappings.length).toBeGreaterThan(0);

          // Deactivate the routine
          store.updateRoutineStatus(routine.id, false);
          const updatedRoutine = store.getRoutine(routine.id)!;
          
          // Sync again (should delete events)
          const deactivateResult = store.syncRoutine(updatedRoutine, startDate);

          // Should have deleted events
          expect(deactivateResult.deletedCount).toBe(initialResult.createdCount);
          expect(deactivateResult.createdCount).toBe(0);

          // No mappings should remain
          const finalMappings = store.getEventMappingsForRoutine(userId, routine.id);
          expect(finalMappings.length).toBe(0);

          // No calendar events should remain
          const finalEvents = store.getCalendarEventsForRoutine(routine.id);
          expect(finalEvents.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.4: Re-sync replaces old events with new ones
   *
   * *For any* routine that is synced multiple times, old events
   * should be deleted and new events created.
   *
   * **Validates: Requirements 3.1, 3.2, 6.4**
   */
  it('should replace old events when re-syncing', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        dateStringArb,
        (userId, startDate1, startDate2) => {
          const store = new InMemorySyncStore();

          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '재동기화 루틴',
            isActive: true,
            settings: {
              durationWeeks: 1,
              workoutsPerWeek: 2,
            },
            workouts: [
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 1',
                dayNumber: 1,
                exercises: [{ id: '1', name: '푸시업', sets: 3, reps: '15', muscleGroup: 'chest' }],
              },
            ],
          };

          store.addRoutine(routine);

          // First sync
          const firstResult = store.syncRoutine(routine, startDate1);
          const firstMappings = store.getEventMappingsForRoutine(userId, routine.id);
          const firstEventIds = firstMappings.map(m => m.googleEventId);

          // Second sync with different start date
          const secondResult = store.syncRoutine(routine, startDate2);
          const secondMappings = store.getEventMappingsForRoutine(userId, routine.id);
          const secondEventIds = secondMappings.map(m => m.googleEventId);

          // Old events should be deleted
          expect(secondResult.deletedCount).toBe(firstResult.createdCount);

          // New events should be created
          expect(secondResult.createdCount).toBeGreaterThan(0);

          // Event IDs should be different
          for (const oldId of firstEventIds) {
            expect(secondEventIds).not.toContain(oldId);
          }

          // Old events should no longer exist
          for (const oldId of firstEventIds) {
            expect(store.getCalendarEvent(oldId)).toBeNull();
          }

          // New events should exist
          for (const newId of secondEventIds) {
            expect(store.getCalendarEvent(newId)).not.toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.5: Sync all syncs only active routines
   *
   * *For any* user with multiple routines (active and inactive),
   * sync-all should only create events for active routines.
   *
   * **Validates: Requirements 6.4**
   */
  it('should only sync active routines when syncing all', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        (userId, startDate, activeCount, inactiveCount) => {
          const store = new InMemorySyncStore();

          // Create active routines
          const activeRoutines: Routine[] = [];
          for (let i = 0; i < activeCount; i++) {
            const routine: Routine = {
              id: fc.sample(uuidArb, 1)[0],
              userId,
              name: `활성 루틴 ${i + 1}`,
              isActive: true,
              settings: { durationWeeks: 1, workoutsPerWeek: 2 },
              workouts: [{
                id: fc.sample(uuidArb, 1)[0],
                name: `Workout ${i + 1}`,
                dayNumber: 1,
                exercises: [{ id: '1', name: '스쿼트', sets: 3, reps: '10', muscleGroup: 'legs' }],
              }],
            };
            store.addRoutine(routine);
            activeRoutines.push(routine);
          }

          // Create inactive routines
          for (let i = 0; i < inactiveCount; i++) {
            const routine: Routine = {
              id: fc.sample(uuidArb, 1)[0],
              userId,
              name: `비활성 루틴 ${i + 1}`,
              isActive: false,
              settings: { durationWeeks: 1, workoutsPerWeek: 2 },
              workouts: [{
                id: fc.sample(uuidArb, 1)[0],
                name: `Inactive Workout ${i + 1}`,
                dayNumber: 1,
                exercises: [{ id: '1', name: '플랭크', sets: 3, reps: '30초', muscleGroup: 'abs' }],
              }],
            };
            store.addRoutine(routine);
          }

          // Sync all
          const result = store.syncAllRoutines(userId, startDate);

          // Should have created events
          expect(result.success).toBe(true);
          expect(result.createdCount).toBeGreaterThan(0);

          // Only active routines should have mappings
          const allMappings = store.getEventMappings(userId);
          const routineIdsWithMappings = new Set(allMappings.map(m => m.routineId));

          for (const activeRoutine of activeRoutines) {
            expect(routineIdsWithMappings.has(activeRoutine.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.6: Event data matches workout data
   *
   * *For any* synced routine, the calendar event data should
   * accurately reflect the workout information.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('should create events with accurate workout data', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        (userId, startDate) => {
          const store = new InMemorySyncStore();

          const workout: Workout = {
            id: fc.sample(uuidArb, 1)[0],
            name: 'Day 1 - 가슴/삼두',
            dayNumber: 1,
            exercises: [
              { id: '1', name: '벤치프레스', sets: 4, reps: '8-10', muscleGroup: 'chest' },
              { id: '2', name: '덤벨 플라이', sets: 3, reps: '12', muscleGroup: 'chest' },
            ],
          };

          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '테스트 루틴',
            isActive: true,
            settings: { durationWeeks: 1, workoutsPerWeek: 3 },
            workouts: [workout],
          };

          store.addRoutine(routine);
          store.syncRoutine(routine, startDate);

          // Get created events
          const events = store.getCalendarEventsForRoutine(routine.id);
          expect(events.length).toBeGreaterThan(0);

          // Verify event data
          for (const event of events) {
            // Summary should contain workout name and routine name
            expect(event.summary).toContain(workout.name);
            expect(event.summary).toContain(routine.name);

            // Description should contain exercise information
            for (const exercise of workout.exercises) {
              expect(event.description).toContain(exercise.name);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.7: Mapping count equals event count
   *
   * *For any* synced routine, the number of event mappings should
   * equal the number of calendar events created.
   *
   * **Validates: Requirements 2.3**
   */
  it('should maintain consistent mapping and event counts', () => {
    fc.assert(
      fc.property(
        uuidArb,
        dateStringArb,
        (userId, startDate) => {
          const store = new InMemorySyncStore();

          const routine: Routine = {
            id: fc.sample(uuidArb, 1)[0],
            userId,
            name: '일관성 테스트 루틴',
            isActive: true,
            settings: { durationWeeks: 2, workoutsPerWeek: 3 },
            workouts: [
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 1',
                dayNumber: 1,
                exercises: [{ id: '1', name: '레그프레스', sets: 4, reps: '12', muscleGroup: 'legs' }],
              },
              {
                id: fc.sample(uuidArb, 1)[0],
                name: 'Day 2',
                dayNumber: 2,
                exercises: [{ id: '2', name: '숄더프레스', sets: 3, reps: '10', muscleGroup: 'shoulders' }],
              },
            ],
          };

          store.addRoutine(routine);
          const result = store.syncRoutine(routine, startDate);

          // Get mappings and events
          const mappings = store.getEventMappingsForRoutine(userId, routine.id);
          const events = store.getCalendarEventsForRoutine(routine.id);

          // Counts should match
          expect(mappings.length).toBe(result.createdCount);
          expect(events.length).toBe(result.createdCount);
          expect(mappings.length).toBe(events.length);

          // Each mapping should reference a valid event
          for (const mapping of mappings) {
            const event = store.getCalendarEvent(mapping.googleEventId);
            expect(event).not.toBeNull();
            expect(event!.routineId).toBe(mapping.routineId);
            expect(event!.workoutId).toBe(mapping.workoutId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
