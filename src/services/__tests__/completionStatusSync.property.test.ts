/**
 * Property-Based Tests for Completion Status Sync
 *
 * **Property 4: 완료 상태 동기화 일관성**
 * - 완료 체크 → 이벤트에 ✅ + 녹색 반영 검증
 * - 완료 해제 → 이벤트 원래 상태 복원 검증
 * - 앱의 완료 상태와 구글 캘린더 이벤트의 완료 표시가 일치해야 함
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 *
 * Feature: google-calendar-integration, Property 4: 완료 상태 동기화 일관성
 * 
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types for Completion Status Testing
// ============================================================================

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  colorId: string | null;
  eventDate: string;
}

interface EventMapping {
  userId: string;
  routineId: string;
  workoutId: string;
  googleEventId: string;
  eventDate: string;
}

interface WorkoutLog {
  userId: string;
  routineId: string;
  workoutId: string;
  date: string;
  isCompleted: boolean;
}

interface CompletionSyncResult {
  success: boolean;
  eventId: string;
  summary: string;
  colorId: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const COMPLETED_PREFIX = '✅ ';
const COMPLETED_COLOR_ID = '10'; // Green (Basil) in Google Calendar
const DEFAULT_COLOR_ID = null; // Default calendar color

// ============================================================================
// In-Memory Store (simulates database + Google Calendar)
// ============================================================================

class InMemoryCompletionStore {
  private calendarEvents: Map<string, CalendarEvent> = new Map();
  private eventMappings: Map<string, EventMapping[]> = new Map();
  private workoutLogs: Map<string, WorkoutLog[]> = new Map();

  // Calendar event operations (simulates Google Calendar API)
  createCalendarEvent(event: Omit<CalendarEvent, 'id'>): string {
    const eventId = `gcal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.calendarEvents.set(eventId, { ...event, id: eventId });
    return eventId;
  }

  getCalendarEvent(eventId: string): CalendarEvent | null {
    return this.calendarEvents.get(eventId) || null;
  }

  updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const event = this.calendarEvents.get(eventId);
    if (!event) return null;
    
    const updatedEvent = { ...event, ...updates };
    this.calendarEvents.set(eventId, updatedEvent);
    return updatedEvent;
  }

  // Event mapping operations
  addEventMapping(mapping: EventMapping): void {
    const key = `${mapping.userId}:${mapping.routineId}:${mapping.workoutId}:${mapping.eventDate}`;
    const userMappings = this.eventMappings.get(mapping.userId) || [];
    userMappings.push({ ...mapping });
    this.eventMappings.set(mapping.userId, userMappings);
  }

  getEventMapping(
    userId: string,
    routineId: string,
    workoutId: string,
    date: string
  ): EventMapping | null {
    const userMappings = this.eventMappings.get(userId) || [];
    return userMappings.find(
      m => m.routineId === routineId && 
           m.workoutId === workoutId && 
           m.eventDate === date
    ) || null;
  }

  // Workout log operations
  setWorkoutCompletion(log: WorkoutLog): void {
    const userLogs = this.workoutLogs.get(log.userId) || [];
    const existingIndex = userLogs.findIndex(
      l => l.routineId === log.routineId && 
           l.workoutId === log.workoutId && 
           l.date === log.date
    );
    
    if (existingIndex >= 0) {
      userLogs[existingIndex] = { ...log };
    } else {
      userLogs.push({ ...log });
    }
    this.workoutLogs.set(log.userId, userLogs);
  }

  getWorkoutLog(
    userId: string,
    routineId: string,
    workoutId: string,
    date: string
  ): WorkoutLog | null {
    const userLogs = this.workoutLogs.get(userId) || [];
    return userLogs.find(
      l => l.routineId === routineId && 
           l.workoutId === workoutId && 
           l.date === date
    ) || null;
  }

  // Completion status sync operations
  markEventCompleted(eventId: string): CompletionSyncResult {
    const event = this.calendarEvents.get(eventId);
    if (!event) {
      return { success: false, eventId, summary: '', colorId: null };
    }

    // Add ✅ prefix if not already present
    const newSummary = event.summary.startsWith(COMPLETED_PREFIX)
      ? event.summary
      : `${COMPLETED_PREFIX}${event.summary}`;

    const updatedEvent = this.updateCalendarEvent(eventId, {
      summary: newSummary,
      colorId: COMPLETED_COLOR_ID,
    });

    return {
      success: true,
      eventId,
      summary: updatedEvent!.summary,
      colorId: updatedEvent!.colorId,
    };
  }

  markEventIncomplete(eventId: string): CompletionSyncResult {
    const event = this.calendarEvents.get(eventId);
    if (!event) {
      return { success: false, eventId, summary: '', colorId: null };
    }

    // Remove ✅ prefix if present
    const newSummary = event.summary.startsWith(COMPLETED_PREFIX)
      ? event.summary.substring(COMPLETED_PREFIX.length)
      : event.summary;

    const updatedEvent = this.updateCalendarEvent(eventId, {
      summary: newSummary,
      colorId: DEFAULT_COLOR_ID,
    });

    return {
      success: true,
      eventId,
      summary: updatedEvent!.summary,
      colorId: updatedEvent!.colorId,
    };
  }

  // Combined operation: toggle completion and sync to calendar
  toggleWorkoutCompletion(
    userId: string,
    routineId: string,
    workoutId: string,
    date: string,
    isCompleted: boolean
  ): { logUpdated: boolean; calendarSynced: boolean; syncResult?: CompletionSyncResult } {
    // Update workout log
    this.setWorkoutCompletion({
      userId,
      routineId,
      workoutId,
      date,
      isCompleted,
    });

    // Find event mapping
    const mapping = this.getEventMapping(userId, routineId, workoutId, date);
    if (!mapping) {
      return { logUpdated: true, calendarSynced: false };
    }

    // Sync to calendar
    const syncResult = isCompleted
      ? this.markEventCompleted(mapping.googleEventId)
      : this.markEventIncomplete(mapping.googleEventId);

    return {
      logUpdated: true,
      calendarSynced: syncResult.success,
      syncResult,
    };
  }
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

const uuidArb = fc.uuid();

// Sample workout names
const workoutNameArb = fc.tuple(
  fc.constantFrom('Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'),
  fc.constantFrom('가슴', '등', '하체', '어깨', '팔', '전신')
).map(([day, muscle]) => `${day} - ${muscle}`);

// Sample routine names
const routineNameArb = fc.constantFrom(
  '초보자 루틴', '중급자 루틴', '고급자 루틴',
  '전신 운동', '상하체 분할', 'PPL 루틴'
);

// Date string generator (YYYY-MM-DD format)
const dateStringArb = fc.integer({
  min: 1704067200000, // 2024-01-01
  max: 1924991999000, // 2030-12-31
}).map(timestamp => new Date(timestamp).toISOString().split('T')[0]);

// Exercise description generator
const exerciseDescriptionArb = fc.array(
  fc.tuple(
    fc.constantFrom('벤치프레스', '스쿼트', '데드리프트', '풀업', '푸시업'),
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 5, max: 15 })
  ).map(([name, sets, reps]) => `${name} - ${sets}세트 x ${reps}회`),
  { minLength: 1, maxLength: 6 }
).map(exercises => exercises.join('\n'));

// Calendar event generator (without completion markers)
const calendarEventArb = (eventDate: string): fc.Arbitrary<Omit<CalendarEvent, 'id'>> =>
  fc.record({
    summary: fc.tuple(workoutNameArb, routineNameArb)
      .map(([workout, routine]) => `🏋️ ${workout} (${routine})`),
    description: exerciseDescriptionArb,
    colorId: fc.constant(DEFAULT_COLOR_ID),
    eventDate: fc.constant(eventDate),
  });

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Completion Status Sync - Property 4: 완료 상태 동기화 일관성', () => {
  /**
   * Property 4.1: Marking event completed adds ✅ prefix
   *
   * *For any* calendar event, marking it as completed should add
   * the ✅ prefix to the summary.
   *
   * **Validates: Requirements 7.1**
   */
  it('should add ✅ prefix when marking event as completed', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        (eventDate) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);
          const originalSummary = eventData.summary;

          // Mark as completed
          const result = store.markEventCompleted(eventId);

          // Verify ✅ prefix is added
          expect(result.success).toBe(true);
          expect(result.summary.startsWith(COMPLETED_PREFIX)).toBe(true);
          expect(result.summary).toBe(`${COMPLETED_PREFIX}${originalSummary}`);

          // Verify event in store is updated
          const updatedEvent = store.getCalendarEvent(eventId);
          expect(updatedEvent?.summary.startsWith(COMPLETED_PREFIX)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.2: Marking event completed changes color to green
   *
   * *For any* calendar event, marking it as completed should change
   * the colorId to 10 (green/Basil).
   *
   * **Validates: Requirements 7.2**
   */
  it('should change color to green when marking event as completed', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        (eventDate) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);

          // Mark as completed
          const result = store.markEventCompleted(eventId);

          // Verify color is changed to green
          expect(result.success).toBe(true);
          expect(result.colorId).toBe(COMPLETED_COLOR_ID);

          // Verify event in store is updated
          const updatedEvent = store.getCalendarEvent(eventId);
          expect(updatedEvent?.colorId).toBe(COMPLETED_COLOR_ID);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.3: Marking event incomplete removes ✅ prefix
   *
   * *For any* completed calendar event, marking it as incomplete should
   * remove the ✅ prefix from the summary.
   *
   * **Validates: Requirements 7.3**
   */
  it('should remove ✅ prefix when marking event as incomplete', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        (eventDate) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);
          const originalSummary = eventData.summary;

          // Mark as completed first
          store.markEventCompleted(eventId);

          // Then mark as incomplete
          const result = store.markEventIncomplete(eventId);

          // Verify ✅ prefix is removed
          expect(result.success).toBe(true);
          expect(result.summary.startsWith(COMPLETED_PREFIX)).toBe(false);
          expect(result.summary).toBe(originalSummary);

          // Verify event in store is updated
          const updatedEvent = store.getCalendarEvent(eventId);
          expect(updatedEvent?.summary.startsWith(COMPLETED_PREFIX)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.4: Marking event incomplete restores default color
   *
   * *For any* completed calendar event, marking it as incomplete should
   * restore the default color (null).
   *
   * **Validates: Requirements 7.4**
   */
  it('should restore default color when marking event as incomplete', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        (eventDate) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);

          // Mark as completed first
          store.markEventCompleted(eventId);

          // Then mark as incomplete
          const result = store.markEventIncomplete(eventId);

          // Verify color is restored to default
          expect(result.success).toBe(true);
          expect(result.colorId).toBe(DEFAULT_COLOR_ID);

          // Verify event in store is updated
          const updatedEvent = store.getCalendarEvent(eventId);
          expect(updatedEvent?.colorId).toBe(DEFAULT_COLOR_ID);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.5: Completion toggle is idempotent for completed state
   *
   * *For any* calendar event, marking it as completed multiple times
   * should not add multiple ✅ prefixes.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  it('should be idempotent when marking event as completed multiple times', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        fc.integer({ min: 2, max: 5 }),
        (eventDate, repeatCount) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);
          const originalSummary = eventData.summary;

          // Mark as completed multiple times
          let lastResult: CompletionSyncResult | null = null;
          for (let i = 0; i < repeatCount; i++) {
            lastResult = store.markEventCompleted(eventId);
          }

          // Verify only one ✅ prefix exists
          expect(lastResult!.success).toBe(true);
          expect(lastResult!.summary).toBe(`${COMPLETED_PREFIX}${originalSummary}`);
          expect(lastResult!.colorId).toBe(COMPLETED_COLOR_ID);

          // Count ✅ occurrences - should be exactly 1
          const checkmarkCount = (lastResult!.summary.match(/✅/g) || []).length;
          expect(checkmarkCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.6: Completion toggle is idempotent for incomplete state
   *
   * *For any* calendar event, marking it as incomplete multiple times
   * should not cause issues.
   *
   * **Validates: Requirements 7.3, 7.4**
   */
  it('should be idempotent when marking event as incomplete multiple times', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        fc.integer({ min: 2, max: 5 }),
        (eventDate, repeatCount) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event and mark as completed
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);
          const originalSummary = eventData.summary;
          store.markEventCompleted(eventId);

          // Mark as incomplete multiple times
          let lastResult: CompletionSyncResult | null = null;
          for (let i = 0; i < repeatCount; i++) {
            lastResult = store.markEventIncomplete(eventId);
          }

          // Verify summary is restored to original
          expect(lastResult!.success).toBe(true);
          expect(lastResult!.summary).toBe(originalSummary);
          expect(lastResult!.colorId).toBe(DEFAULT_COLOR_ID);

          // Verify no ✅ prefix
          expect(lastResult!.summary.startsWith(COMPLETED_PREFIX)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.7: Workout log and calendar event stay in sync
   *
   * *For any* workout completion toggle, the workout log's isCompleted
   * state should match the calendar event's completion markers.
   *
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   */
  it('should keep workout log and calendar event in sync', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        uuidArb,
        dateStringArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (userId, routineId, workoutId, eventDate, completionSequence) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);

          // Create event mapping
          store.addEventMapping({
            userId,
            routineId,
            workoutId,
            googleEventId: eventId,
            eventDate,
          });

          // Apply completion sequence
          for (const isCompleted of completionSequence) {
            store.toggleWorkoutCompletion(userId, routineId, workoutId, eventDate, isCompleted);
          }

          // Get final states
          const finalLog = store.getWorkoutLog(userId, routineId, workoutId, eventDate);
          const finalEvent = store.getCalendarEvent(eventId);
          const expectedCompleted = completionSequence[completionSequence.length - 1];

          // Verify workout log state
          expect(finalLog?.isCompleted).toBe(expectedCompleted);

          // Verify calendar event state matches
          if (expectedCompleted) {
            expect(finalEvent?.summary.startsWith(COMPLETED_PREFIX)).toBe(true);
            expect(finalEvent?.colorId).toBe(COMPLETED_COLOR_ID);
          } else {
            expect(finalEvent?.summary.startsWith(COMPLETED_PREFIX)).toBe(false);
            expect(finalEvent?.colorId).toBe(DEFAULT_COLOR_ID);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.8: Toggle without mapping only updates local state
   *
   * *For any* workout without a calendar event mapping, toggling
   * completion should only update the local workout log.
   *
   * **Validates: Requirements 7.1, 7.3**
   */
  it('should only update local state when no calendar mapping exists', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        uuidArb,
        dateStringArb,
        fc.boolean(),
        (userId, routineId, workoutId, eventDate, isCompleted) => {
          const store = new InMemoryCompletionStore();

          // Toggle completion without creating event mapping
          const result = store.toggleWorkoutCompletion(
            userId, routineId, workoutId, eventDate, isCompleted
          );

          // Verify local state is updated
          expect(result.logUpdated).toBe(true);
          expect(result.calendarSynced).toBe(false);
          expect(result.syncResult).toBeUndefined();

          // Verify workout log is updated
          const log = store.getWorkoutLog(userId, routineId, workoutId, eventDate);
          expect(log?.isCompleted).toBe(isCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.9: Original summary is preserved after complete/incomplete cycle
   *
   * *For any* calendar event, completing then uncompleting should
   * restore the exact original summary.
   *
   * **Validates: Requirements 7.1, 7.3**
   */
  it('should preserve original summary after complete/incomplete cycle', () => {
    fc.assert(
      fc.property(
        dateStringArb,
        fc.integer({ min: 1, max: 5 }),
        (eventDate, cycleCount) => {
          const store = new InMemoryCompletionStore();

          // Create a calendar event
          const eventData = fc.sample(calendarEventArb(eventDate), 1)[0];
          const eventId = store.createCalendarEvent(eventData);
          const originalSummary = eventData.summary;

          // Perform complete/incomplete cycles
          for (let i = 0; i < cycleCount; i++) {
            store.markEventCompleted(eventId);
            store.markEventIncomplete(eventId);
          }

          // Verify summary is exactly the original
          const finalEvent = store.getCalendarEvent(eventId);
          expect(finalEvent?.summary).toBe(originalSummary);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.10: Non-existent event returns failure
   *
   * *For any* non-existent event ID, marking as completed or incomplete
   * should return a failure result.
   *
   * **Validates: Requirements 7.1, 7.3**
   */
  it('should return failure for non-existent events', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.boolean(),
        (fakeEventId, markCompleted) => {
          const store = new InMemoryCompletionStore();

          // Try to mark non-existent event
          const result = markCompleted
            ? store.markEventCompleted(fakeEventId)
            : store.markEventIncomplete(fakeEventId);

          // Verify failure
          expect(result.success).toBe(false);
          expect(result.eventId).toBe(fakeEventId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
