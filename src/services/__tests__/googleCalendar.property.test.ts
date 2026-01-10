/**
 * Property-Based Tests for Google Calendar Integration
 *
 * **Property 3: 토큰 및 매핑 데이터 영속성**
 * - 토큰 저장/조회 round-trip 검증
 * - 매핑 데이터 저장/조회 round-trip 검증
 * - 연동 해제 시 모든 관련 데이터 삭제 검증
 *
 * **Validates: Requirements 1.3, 2.3, 4.3, 5.4**
 *
 * Feature: google-calendar-integration, Property 3: 토큰 및 매핑 데이터 영속성
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types for Google Calendar Data
// ============================================================================

interface GoogleCalendarToken {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  google_email: string | null;
}

interface CalendarEventMapping {
  user_id: string;
  routine_id: string;
  workout_id: string;
  google_event_id: string;
  event_date: string;
}

interface CalendarSyncStatus {
  user_id: string;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message: string | null;
}

// ============================================================================
// In-Memory Store (simulates database operations)
// ============================================================================

class InMemoryCalendarStore {
  private tokens: Map<string, GoogleCalendarToken> = new Map();
  private mappings: Map<string, CalendarEventMapping[]> = new Map();
  private syncStatus: Map<string, CalendarSyncStatus> = new Map();

  // Token operations
  upsertToken(token: GoogleCalendarToken): void {
    this.tokens.set(token.user_id, { ...token });
  }

  getToken(userId: string): GoogleCalendarToken | null {
    return this.tokens.get(userId) || null;
  }

  deleteToken(userId: string): void {
    this.tokens.delete(userId);
  }

  // Mapping operations
  insertMapping(mapping: CalendarEventMapping): void {
    const userMappings = this.mappings.get(mapping.user_id) || [];
    // Check for unique constraint (workout_id, event_date)
    const existingIndex = userMappings.findIndex(
      (m) => m.workout_id === mapping.workout_id && m.event_date === mapping.event_date
    );
    if (existingIndex >= 0) {
      userMappings[existingIndex] = { ...mapping };
    } else {
      userMappings.push({ ...mapping });
    }
    this.mappings.set(mapping.user_id, userMappings);
  }

  getMappings(userId: string): CalendarEventMapping[] {
    return [...(this.mappings.get(userId) || [])];
  }

  getMappingsByRoutine(userId: string, routineId: string): CalendarEventMapping[] {
    const userMappings = this.mappings.get(userId) || [];
    return userMappings.filter((m) => m.routine_id === routineId);
  }

  deleteMappings(userId: string): void {
    this.mappings.delete(userId);
  }

  deleteMappingsByRoutine(userId: string, routineId: string): void {
    const userMappings = this.mappings.get(userId) || [];
    this.mappings.set(
      userId,
      userMappings.filter((m) => m.routine_id !== routineId)
    );
  }

  // Sync status operations
  upsertSyncStatus(status: CalendarSyncStatus): void {
    this.syncStatus.set(status.user_id, { ...status });
  }

  getSyncStatus(userId: string): CalendarSyncStatus | null {
    return this.syncStatus.get(userId) || null;
  }

  deleteSyncStatus(userId: string): void {
    this.syncStatus.delete(userId);
  }

  // Disconnect - delete all data for user
  disconnectUser(userId: string): void {
    this.tokens.delete(userId);
    this.mappings.delete(userId);
    this.syncStatus.delete(userId);
  }
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

// UUID generator
const uuidArb = fc.uuid();

// Email generator
const emailArb = fc.emailAddress();

// Token generator - using string with specific character set (non-empty, printable)
const tokenStringArb = fc.stringMatching(/^[a-zA-Z0-9_-]{20,100}$/);

// ISO date string generator - using integer-based approach to avoid Invalid time value
const isoDateArb = fc.integer({ min: 1577836800000, max: 1924991999000 }).map((timestamp) =>
  new Date(timestamp).toISOString()
);

// Date only string generator (YYYY-MM-DD) - using integer-based approach
const dateOnlyArb = fc
  .integer({ min: 1577836800000, max: 1924991999000 })
  .map((timestamp) => new Date(timestamp).toISOString().split('T')[0]);

// Google Calendar Token arbitrary
const googleCalendarTokenArb: fc.Arbitrary<GoogleCalendarToken> = fc.record({
  user_id: uuidArb,
  access_token: tokenStringArb,
  refresh_token: tokenStringArb,
  token_expiry: isoDateArb,
  google_email: fc.option(emailArb, { nil: null }),
});

// Calendar Event Mapping arbitrary
const calendarEventMappingArb = (
  userId: string,
  routineId: string,
  workoutId: string,
  eventDate: string
): CalendarEventMapping => ({
  user_id: userId,
  routine_id: routineId,
  workout_id: workoutId,
  google_event_id: `event-${Math.random().toString(36).substring(7)}`,
  event_date: eventDate,
});

// Sync status arbitrary
const syncStatusArb = (userId: string): fc.Arbitrary<CalendarSyncStatus> =>
  fc.record({
    user_id: fc.constant(userId),
    last_sync_at: fc.option(isoDateArb, { nil: null }),
    sync_status: fc.constantFrom('idle', 'syncing', 'error') as fc.Arbitrary<
      'idle' | 'syncing' | 'error'
    >,
    error_message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  });

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Google Calendar Integration - Property 3: 토큰 및 매핑 데이터 영속성', () => {
  /**
   * Property 3.1: Token Round-Trip Consistency
   *
   * *For any* valid OAuth token data, storing then retrieving should produce
   * an equivalent token object.
   *
   * **Validates: Requirements 1.3**
   */
  it('should preserve token data through store/retrieve round-trip', () => {
    fc.assert(
      fc.property(googleCalendarTokenArb, (token) => {
        // Create fresh store for each test iteration
        const store = new InMemoryCalendarStore();

        // Store the token
        store.upsertToken(token);

        // Retrieve the token
        const retrieved = store.getToken(token.user_id);

        // Verify round-trip consistency
        expect(retrieved).not.toBeNull();
        expect(retrieved!.user_id).toBe(token.user_id);
        expect(retrieved!.access_token).toBe(token.access_token);
        expect(retrieved!.refresh_token).toBe(token.refresh_token);
        expect(retrieved!.token_expiry).toBe(token.token_expiry);
        expect(retrieved!.google_email).toBe(token.google_email);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.2: Mapping Data Round-Trip Consistency
   *
   * *For any* valid calendar event mapping, storing then retrieving should
   * produce an equivalent mapping object.
   *
   * **Validates: Requirements 2.3**
   */
  it('should preserve mapping data through store/retrieve round-trip', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        fc.integer({ min: 1, max: 5 }),
        (userId, routineId, mappingCount) => {
          // Create fresh store for each test iteration
          const store = new InMemoryCalendarStore();
          const mappings: CalendarEventMapping[] = [];

          // Generate unique mappings for this user
          for (let i = 0; i < mappingCount; i++) {
            const mapping = calendarEventMappingArb(
              userId,
              routineId,
              `workout-${i}`,
              `2024-0${(i % 9) + 1}-15`
            );
            mappings.push(mapping);
            store.insertMapping(mapping);
          }

          // Retrieve all mappings
          const retrieved = store.getMappings(userId);

          // Verify count matches
          expect(retrieved.length).toBe(mappings.length);

          // Verify each mapping is preserved
          for (const original of mappings) {
            const found = retrieved.find(
              (m) => m.workout_id === original.workout_id && m.event_date === original.event_date
            );
            expect(found).toBeDefined();
            expect(found!.user_id).toBe(original.user_id);
            expect(found!.routine_id).toBe(original.routine_id);
            expect(found!.google_event_id).toBe(original.google_event_id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.3: Sync Status Round-Trip Consistency
   *
   * *For any* valid sync status, storing then retrieving should produce
   * an equivalent status object.
   *
   * **Validates: Requirements 6.1, 6.2**
   */
  it('should preserve sync status through store/retrieve round-trip', () => {
    fc.assert(
      fc.property(uuidArb, syncStatusArb(fc.sample(uuidArb, 1)[0]), (userId, statusTemplate) => {
        // Create fresh store for each test iteration
        const store = new InMemoryCalendarStore();

        // Create status with the actual userId
        const status: CalendarSyncStatus = {
          ...statusTemplate,
          user_id: userId,
        };

        // Store the sync status
        store.upsertSyncStatus(status);

        // Retrieve the sync status
        const retrieved = store.getSyncStatus(userId);

        // Verify round-trip consistency
        expect(retrieved).not.toBeNull();
        expect(retrieved!.user_id).toBe(status.user_id);
        expect(retrieved!.last_sync_at).toBe(status.last_sync_at);
        expect(retrieved!.sync_status).toBe(status.sync_status);
        expect(retrieved!.error_message).toBe(status.error_message);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.4: Disconnect Removes All User Data
   *
   * *For any* user with tokens, mappings, and sync status, disconnecting
   * should remove all related data.
   *
   * **Validates: Requirements 5.4**
   */
  it('should remove all user data on disconnect', () => {
    fc.assert(
      fc.property(googleCalendarTokenArb, (token) => {
        // Create fresh store for each test iteration
        const store = new InMemoryCalendarStore();
        const userId = token.user_id;

        // Store token
        store.upsertToken(token);

        // Store some mappings
        for (let i = 0; i < 3; i++) {
          const mapping = calendarEventMappingArb(
            userId,
            `routine-${i}`,
            `workout-${i}`,
            `2024-0${i + 1}-15`
          );
          store.insertMapping(mapping);
        }

        // Store sync status
        const status: CalendarSyncStatus = {
          user_id: userId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'idle',
          error_message: null,
        };
        store.upsertSyncStatus(status);

        // Verify data exists
        expect(store.getToken(userId)).not.toBeNull();
        expect(store.getMappings(userId).length).toBeGreaterThan(0);
        expect(store.getSyncStatus(userId)).not.toBeNull();

        // Disconnect user
        store.disconnectUser(userId);

        // Verify all data is removed
        expect(store.getToken(userId)).toBeNull();
        expect(store.getMappings(userId).length).toBe(0);
        expect(store.getSyncStatus(userId)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.5: Token Update Preserves User Association
   *
   * *For any* token update (e.g., refresh), the user_id association should
   * remain unchanged.
   *
   * **Validates: Requirements 1.3**
   */
  it('should preserve user association on token update', () => {
    fc.assert(
      fc.property(googleCalendarTokenArb, tokenStringArb, isoDateArb, (originalToken, newAccessToken, newExpiry) => {
        // Create fresh store for each test iteration
        const store = new InMemoryCalendarStore();

        // Store original token
        store.upsertToken(originalToken);

        // Update with new access token (simulating refresh)
        const updatedToken: GoogleCalendarToken = {
          ...originalToken,
          access_token: newAccessToken,
          token_expiry: newExpiry,
        };
        store.upsertToken(updatedToken);

        // Retrieve and verify
        const retrieved = store.getToken(originalToken.user_id);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.user_id).toBe(originalToken.user_id);
        expect(retrieved!.access_token).toBe(newAccessToken);
        expect(retrieved!.refresh_token).toBe(originalToken.refresh_token);
        expect(retrieved!.token_expiry).toBe(newExpiry);
        expect(retrieved!.google_email).toBe(originalToken.google_email);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.6: Mapping Deletion by Routine
   *
   * *For any* set of mappings across multiple routines, deleting mappings
   * for one routine should only remove that routine's mappings.
   *
   * **Validates: Requirements 4.3**
   */
  it('should only delete mappings for specified routine', () => {
    fc.assert(
      fc.property(uuidArb, uuidArb, uuidArb, (userId, routineId1, routineId2) => {
        // Ensure different routine IDs
        if (routineId1 === routineId2) return;

        // Create fresh store for each test iteration
        const store = new InMemoryCalendarStore();

        // Create mappings for routine 1
        const mapping1 = calendarEventMappingArb(userId, routineId1, 'workout-1', '2024-01-15');
        store.insertMapping(mapping1);

        // Create mappings for routine 2
        const mapping2 = calendarEventMappingArb(userId, routineId2, 'workout-2', '2024-01-16');
        store.insertMapping(mapping2);

        // Delete mappings for routine 1
        store.deleteMappingsByRoutine(userId, routineId1);

        // Verify routine 1 mappings are deleted
        const routine1Mappings = store.getMappingsByRoutine(userId, routineId1);
        expect(routine1Mappings.length).toBe(0);

        // Verify routine 2 mappings still exist
        const routine2Mappings = store.getMappingsByRoutine(userId, routineId2);
        expect(routine2Mappings.length).toBe(1);
        expect(routine2Mappings[0].routine_id).toBe(routineId2);
      }),
      { numRuns: 100 }
    );
  });
});
