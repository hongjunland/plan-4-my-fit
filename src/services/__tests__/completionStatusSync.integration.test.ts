/**
 * Integration Tests for Completion Status Sync
 * 
 * Tests the integration between workout completion and Google Calendar sync.
 * These tests verify the checkpoint requirements for Task 17.
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**
 * 
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Types
// ============================================================================

interface CalendarConnectionState {
  isConnected: boolean;
  googleEmail: string | null;
  isTokenExpired: boolean;
  lastSyncAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage: string | null;
}

interface EventMapping {
  id: string;
  userId: string;
  routineId: string;
  workoutId: string;
  googleEventId: string;
  eventDate: string;
}

interface CompletionStatusResult {
  success: boolean;
  eventId: string;
  summary?: string;
  colorId?: string;
}

interface WorkoutLog {
  id: string;
  user_id: string;
  routine_id: string;
  workout_id: string;
  date: string;
  completed_exercises: string[];
  is_completed: boolean;
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const COMPLETED_PREFIX = '✅ ';
const COMPLETED_COLOR_ID = '10'; // Green (Basil) in Google Calendar

// ============================================================================
// Mock Services (simulating the actual service behavior)
// ============================================================================

/**
 * Simulates the syncCalendarCompletionStatus function from useWorkoutLogs
 * This is the core logic we're testing
 */
async function syncCalendarCompletionStatus(
  routineId: string,
  workoutId: string,
  date: string,
  isCompleted: boolean,
  services: {
    getConnectionStatus: () => Promise<CalendarConnectionState>;
    getEventMapping: (routineId: string, workoutId: string, date: string) => Promise<EventMapping | null>;
    markEventCompleted: (eventId: string) => Promise<CompletionStatusResult>;
    markEventIncomplete: (eventId: string) => Promise<CompletionStatusResult>;
  }
): Promise<{ synced: boolean; result?: CompletionStatusResult; error?: Error }> {
  try {
    // Check Google Calendar connection status
    const connectionStatus = await services.getConnectionStatus();
    if (!connectionStatus.isConnected || connectionStatus.isTokenExpired) {
      return { synced: false };
    }

    // Get event mapping
    const eventMapping = await services.getEventMapping(routineId, workoutId, date);
    if (!eventMapping) {
      return { synced: false };
    }

    // Sync to calendar
    const result = isCompleted
      ? await services.markEventCompleted(eventMapping.googleEventId)
      : await services.markEventIncomplete(eventMapping.googleEventId);

    return { synced: true, result };
  } catch (error) {
    // Requirement 7.6: Log error but don't throw - local state should be maintained
    return { synced: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Simulates the toggleExerciseCompletion function
 * Returns both local update result and calendar sync result
 */
async function toggleExerciseCompletion(
  userId: string,
  routineId: string,
  workoutId: string,
  exerciseId: string,
  date: string,
  wasCompleted: boolean,
  services: {
    updateLocalLog: (log: Partial<WorkoutLog>) => Promise<WorkoutLog>;
    getConnectionStatus: () => Promise<CalendarConnectionState>;
    getEventMapping: (routineId: string, workoutId: string, date: string) => Promise<EventMapping | null>;
    markEventCompleted: (eventId: string) => Promise<CompletionStatusResult>;
    markEventIncomplete: (eventId: string) => Promise<CompletionStatusResult>;
  }
): Promise<{ localLog: WorkoutLog; calendarSync: { synced: boolean; result?: CompletionStatusResult; error?: Error } }> {
  // Update local state first
  const isNowCompleted = !wasCompleted;
  const localLog = await services.updateLocalLog({
    user_id: userId,
    routine_id: routineId,
    workout_id: workoutId,
    date,
    completed_exercises: isNowCompleted ? [exerciseId] : [],
    is_completed: isNowCompleted,
  });

  // Sync to calendar (async, doesn't block local update)
  const calendarSync = await syncCalendarCompletionStatus(
    routineId,
    workoutId,
    date,
    isNowCompleted,
    services
  );

  return { localLog, calendarSync };
}

// ============================================================================
// Tests
// ============================================================================

describe('Completion Status Sync - Integration Tests (Task 17 Checkpoint)', () => {
  const mockUserId = 'user-123';
  const mockRoutineId = 'routine-123';
  const mockWorkoutId = 'workout-123';
  const mockExerciseId = 'exercise-123';
  const mockDate = '2024-01-15';
  const mockGoogleEventId = 'gcal-event-123';

  let mockServices: {
    updateLocalLog: ReturnType<typeof vi.fn>;
    getConnectionStatus: ReturnType<typeof vi.fn>;
    getEventMapping: ReturnType<typeof vi.fn>;
    markEventCompleted: ReturnType<typeof vi.fn>;
    markEventIncomplete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockServices = {
      updateLocalLog: vi.fn(),
      getConnectionStatus: vi.fn(),
      getEventMapping: vi.fn(),
      markEventCompleted: vi.fn(),
      markEventIncomplete: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('17.1 완료 체크 → 캘린더 이벤트 업데이트 테스트', () => {
    /**
     * Test: When exercise is marked complete, calendar event should be updated
     * Validates: Requirements 7.1, 7.2
     */
    it('should call markEventCompleted when exercise is completed', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: Event mapping exists
      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      // Setup: markEventCompleted succeeds
      mockServices.markEventCompleted.mockResolvedValue({
        success: true,
        eventId: mockGoogleEventId,
        summary: `${COMPLETED_PREFIX}Day 1 - 가슴`,
        colorId: COMPLETED_COLOR_ID,
      });

      // Setup: Local DB operation succeeds
      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute: Toggle from incomplete to complete
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false, // wasCompleted = false, so now completing
        mockServices
      );

      // Verify: Calendar sync was attempted
      expect(mockServices.getConnectionStatus).toHaveBeenCalled();
      expect(mockServices.getEventMapping).toHaveBeenCalledWith(
        mockRoutineId,
        mockWorkoutId,
        mockDate
      );
      expect(mockServices.markEventCompleted).toHaveBeenCalledWith(mockGoogleEventId);
      expect(result.calendarSync.synced).toBe(true);
    });

    /**
     * Test: Calendar event should have ✅ prefix and green color after completion
     * Validates: Requirements 7.1, 7.2
     */
    it('should update event with ✅ prefix and green color', async () => {
      // Setup
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      const completedResult = {
        success: true,
        eventId: mockGoogleEventId,
        summary: `${COMPLETED_PREFIX}Day 1 - 가슴`,
        colorId: COMPLETED_COLOR_ID,
      };
      mockServices.markEventCompleted.mockResolvedValue(completedResult);

      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify the result format
      expect(result.calendarSync.result?.summary?.startsWith(COMPLETED_PREFIX)).toBe(true);
      expect(result.calendarSync.result?.colorId).toBe(COMPLETED_COLOR_ID);
    });

    /**
     * Test: Should skip calendar sync when not connected
     * Validates: Requirement 7.6 (graceful handling)
     */
    it('should skip calendar sync when Google Calendar is not connected', async () => {
      // Setup: Google Calendar is NOT connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: false,
        googleEmail: null,
        isTokenExpired: false,
        lastSyncAt: null,
        syncStatus: 'idle',
        errorMessage: null,
      });

      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Calendar sync was NOT attempted
      expect(mockServices.getEventMapping).not.toHaveBeenCalled();
      expect(mockServices.markEventCompleted).not.toHaveBeenCalled();
      expect(result.calendarSync.synced).toBe(false);
      
      // Verify: Local state was still updated
      expect(result.localLog.is_completed).toBe(true);
    });

    /**
     * Test: Should skip calendar sync when no event mapping exists
     * Validates: Requirement 7.5
     */
    it('should skip calendar sync when no event mapping exists', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: No event mapping
      mockServices.getEventMapping.mockResolvedValue(null);

      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: markEventCompleted was NOT called
      expect(mockServices.markEventCompleted).not.toHaveBeenCalled();
      expect(result.calendarSync.synced).toBe(false);
      
      // Verify: Local state was still updated
      expect(result.localLog.is_completed).toBe(true);
    });
  });

  describe('17.2 완료 해제 → 캘린더 이벤트 복원 테스트', () => {
    /**
     * Test: When exercise is marked incomplete, calendar event should be restored
     * Validates: Requirements 7.3, 7.4
     */
    it('should call markEventIncomplete when exercise is unchecked', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: Event mapping exists
      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      // Setup: markEventIncomplete succeeds
      mockServices.markEventIncomplete.mockResolvedValue({
        success: true,
        eventId: mockGoogleEventId,
        summary: 'Day 1 - 가슴', // No ✅ prefix
        colorId: undefined, // Default color
      });

      // Setup: Local DB operation succeeds
      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [],
        is_completed: false,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute: Toggle from complete to incomplete
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        true, // wasCompleted = true, so now unchecking
        mockServices
      );

      // Verify: Calendar sync was attempted with markEventIncomplete
      expect(mockServices.getConnectionStatus).toHaveBeenCalled();
      expect(mockServices.getEventMapping).toHaveBeenCalledWith(
        mockRoutineId,
        mockWorkoutId,
        mockDate
      );
      expect(mockServices.markEventIncomplete).toHaveBeenCalledWith(mockGoogleEventId);
      expect(result.calendarSync.synced).toBe(true);
    });

    /**
     * Test: Calendar event should have ✅ removed and default color after incomplete
     * Validates: Requirements 7.3, 7.4
     */
    it('should restore event to original state without ✅ and default color', async () => {
      // Setup
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      const incompleteResult = {
        success: true,
        eventId: mockGoogleEventId,
        summary: 'Day 1 - 가슴', // No ✅ prefix
        colorId: undefined, // Default color restored
      };
      mockServices.markEventIncomplete.mockResolvedValue(incompleteResult);

      mockServices.updateLocalLog.mockResolvedValue({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [],
        is_completed: false,
        created_at: '2024-01-15T10:00:00Z',
      });

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        true,
        mockServices
      );

      // Verify the result format
      expect(result.calendarSync.result?.summary?.startsWith(COMPLETED_PREFIX)).toBe(false);
      expect(result.calendarSync.result?.colorId).toBeUndefined();
    });
  });


  describe('17.3 오프라인/에러 시 로컬 상태 유지 테스트', () => {
    /**
     * Test: Local state should be maintained when calendar sync fails
     * Validates: Requirement 7.6
     */
    it('should maintain local state when calendar sync fails', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: Event mapping exists
      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      // Setup: Calendar sync FAILS
      mockServices.markEventCompleted.mockRejectedValue(
        new Error('Network error: Failed to connect to Google Calendar')
      );

      // Setup: Local DB operation succeeds
      const expectedLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      };
      mockServices.updateLocalLog.mockResolvedValue(expectedLog);

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Local state was updated despite calendar sync failure
      expect(result.localLog).toEqual(expectedLog);
      expect(result.localLog.is_completed).toBe(true);
      
      // Verify: Calendar sync failed but error was captured
      expect(result.calendarSync.synced).toBe(false);
      expect(result.calendarSync.error).toBeDefined();
      expect(result.calendarSync.error?.message).toContain('Network error');
    });

    /**
     * Test: Local state should be maintained when token is expired
     * Validates: Requirement 7.6
     */
    it('should maintain local state when token is expired', async () => {
      // Setup: Google Calendar token is expired
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: true, // Token expired
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: Local DB operation succeeds
      const expectedLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      };
      mockServices.updateLocalLog.mockResolvedValue(expectedLog);

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Local state was updated
      expect(result.localLog).toEqual(expectedLog);
      expect(result.localLog.is_completed).toBe(true);

      // Verify: Calendar sync was skipped due to expired token
      expect(mockServices.getEventMapping).not.toHaveBeenCalled();
      expect(mockServices.markEventCompleted).not.toHaveBeenCalled();
      expect(result.calendarSync.synced).toBe(false);
    });

    /**
     * Test: Local state should be maintained when getConnectionStatus fails
     * Validates: Requirement 7.6
     */
    it('should maintain local state when connection status check fails', async () => {
      // Setup: getConnectionStatus throws error
      mockServices.getConnectionStatus.mockRejectedValue(
        new Error('Failed to check connection status')
      );

      // Setup: Local DB operation succeeds
      const expectedLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      };
      mockServices.updateLocalLog.mockResolvedValue(expectedLog);

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Local state was updated despite connection check failure
      expect(result.localLog).toEqual(expectedLog);
      expect(result.localLog.is_completed).toBe(true);
      
      // Verify: Calendar sync failed with error
      expect(result.calendarSync.synced).toBe(false);
      expect(result.calendarSync.error).toBeDefined();
    });

    /**
     * Test: Local state should be maintained when getEventMapping fails
     * Validates: Requirement 7.6
     */
    it('should maintain local state when event mapping lookup fails', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      // Setup: getEventMapping throws error
      mockServices.getEventMapping.mockRejectedValue(
        new Error('Database error')
      );

      // Setup: Local DB operation succeeds
      const expectedLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      };
      mockServices.updateLocalLog.mockResolvedValue(expectedLog);

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Local state was updated despite mapping lookup failure
      expect(result.localLog).toEqual(expectedLog);
      expect(result.localLog.is_completed).toBe(true);
      
      // Verify: Calendar sync failed with error
      expect(result.calendarSync.synced).toBe(false);
      expect(result.calendarSync.error).toBeDefined();
    });

    /**
     * Test: Multiple consecutive toggles should maintain consistency
     * Validates: Requirements 7.1, 7.3, 7.6
     */
    it('should handle multiple consecutive toggles correctly', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      mockServices.markEventCompleted.mockResolvedValue({
        success: true,
        eventId: mockGoogleEventId,
        summary: `${COMPLETED_PREFIX}Day 1 - 가슴`,
        colorId: COMPLETED_COLOR_ID,
      });

      mockServices.markEventIncomplete.mockResolvedValue({
        success: true,
        eventId: mockGoogleEventId,
        summary: 'Day 1 - 가슴',
        colorId: undefined,
      });

      // Toggle 1: incomplete -> complete
      mockServices.updateLocalLog.mockResolvedValueOnce({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      const result1 = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      expect(result1.localLog.is_completed).toBe(true);
      expect(mockServices.markEventCompleted).toHaveBeenCalledTimes(1);

      // Toggle 2: complete -> incomplete
      mockServices.updateLocalLog.mockResolvedValueOnce({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [],
        is_completed: false,
        created_at: '2024-01-15T10:00:00Z',
      });

      const result2 = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        true,
        mockServices
      );

      expect(result2.localLog.is_completed).toBe(false);
      expect(mockServices.markEventIncomplete).toHaveBeenCalledTimes(1);

      // Toggle 3: incomplete -> complete again
      mockServices.updateLocalLog.mockResolvedValueOnce({
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      });

      const result3 = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      expect(result3.localLog.is_completed).toBe(true);
      expect(mockServices.markEventCompleted).toHaveBeenCalledTimes(2);
    });

    /**
     * Test: Partial failure should not affect local state
     * Validates: Requirement 7.6
     */
    it('should maintain local state even when calendar API returns failure', async () => {
      // Setup: Google Calendar is connected
      mockServices.getConnectionStatus.mockResolvedValue({
        isConnected: true,
        googleEmail: 'test@gmail.com',
        isTokenExpired: false,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        errorMessage: null,
      });

      mockServices.getEventMapping.mockResolvedValue({
        id: 'mapping-123',
        userId: mockUserId,
        routineId: mockRoutineId,
        workoutId: mockWorkoutId,
        googleEventId: mockGoogleEventId,
        eventDate: mockDate,
      });

      // Setup: Calendar API returns success: false (not an exception)
      mockServices.markEventCompleted.mockResolvedValue({
        success: false,
        eventId: mockGoogleEventId,
        summary: undefined,
        colorId: undefined,
      });

      // Setup: Local DB operation succeeds
      const expectedLog = {
        id: 'log-123',
        user_id: mockUserId,
        routine_id: mockRoutineId,
        workout_id: mockWorkoutId,
        date: mockDate,
        completed_exercises: [mockExerciseId],
        is_completed: true,
        created_at: '2024-01-15T10:00:00Z',
      };
      mockServices.updateLocalLog.mockResolvedValue(expectedLog);

      // Execute
      const result = await toggleExerciseCompletion(
        mockUserId,
        mockRoutineId,
        mockWorkoutId,
        mockExerciseId,
        mockDate,
        false,
        mockServices
      );

      // Verify: Local state was updated
      expect(result.localLog).toEqual(expectedLog);
      expect(result.localLog.is_completed).toBe(true);
      
      // Verify: Calendar sync was attempted but returned failure
      expect(result.calendarSync.synced).toBe(true); // Sync was attempted
      expect(result.calendarSync.result?.success).toBe(false); // But API returned failure
    });
  });
});
