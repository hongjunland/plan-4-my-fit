/**
 * Google Calendar Service
 * 
 * Client-side service for Google Calendar integration.
 * Communicates with Supabase Edge Functions for OAuth and event management.
 * 
 * Requirements: 1.2, 1.4, 5.4, 6.1, 6.4
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface CalendarConnectionState {
  isConnected: boolean;
  googleEmail: string | null;
  isTokenExpired: boolean;
  lastSyncAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage: string | null;
}

export interface AuthUrlResponse {
  authUrl: string;
}

export interface CallbackResponse {
  success: boolean;
  googleEmail: string | null;
  message: string;
}

export interface SyncResult {
  success: boolean;
  createdCount?: number;
  deletedCount?: number;
  errors?: string[];
}

export interface EventMapping {
  id: string;
  userId: string;
  routineId: string;
  workoutId: string;
  googleEventId: string;
  eventDate: string;
}

export interface CompletionStatusResult {
  success: boolean;
  eventId: string;
  summary?: string;
  colorId?: string;
}

export interface CreateEventsOptions {
  routineId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  timeZone?: string;
  defaultStartTime?: string; // HH:mm format
  durationMinutes?: number;
}

// ============================================================================
// Constants
// ============================================================================

const EDGE_FUNCTION_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_FUNCTION_PATH = '/functions/v1/google-calendar-auth';
const EVENTS_FUNCTION_PATH = '/functions/v1/google-calendar-events';
const SYNC_FUNCTION_PATH = '/functions/v1/google-calendar-sync';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current user's access token for Edge Function calls
 */
async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  logger.debug('getAccessToken called', { 
    hasSession: !!session, 
    hasError: !!error,
    errorMessage: error?.message 
  });
  
  if (error || !session) {
    throw new Error('Not authenticated. Please log in first.');
  }
  
  return session.access_token;
}

/**
 * Make an authenticated request to an Edge Function
 */
async function callEdgeFunction<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
): Promise<T> {
  const accessToken = await getAccessToken();
  
  let url = `${EDGE_FUNCTION_BASE_URL}${path}`;
  
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': anonKey,
      'Content-Type': 'application/json',
    },
  };
  
  logger.debug('callEdgeFunction', { 
    url, 
    method, 
    hasAccessToken: !!accessToken,
    hasAnonKey: !!anonKey 
  });
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// OAuth Functions (Requirements: 1.2, 1.4, 5.4)
// ============================================================================

/**
 * Get the Google OAuth authorization URL
 * Requirement 1.2: OAuth 인증 플로우 시작
 */
export async function getAuthUrl(redirectUri?: string): Promise<string> {
  const finalRedirectUri = redirectUri || `${window.location.origin}/auth/google-calendar/callback`;
  
  logger.debug('Getting Google Calendar auth URL', { redirectUri: finalRedirectUri });
  
  const response = await callEdgeFunction<AuthUrlResponse>(
    `${AUTH_FUNCTION_PATH}/auth-url`,
    'GET',
    undefined,
    { redirect_uri: finalRedirectUri }
  );
  
  return response.authUrl;
}

/**
 * Handle the OAuth callback and exchange code for tokens
 * Requirement 1.3: OAuth 토큰 저장
 */
export async function handleCallback(
  code: string,
  redirectUri?: string
): Promise<CallbackResponse> {
  const finalRedirectUri = redirectUri || `${window.location.origin}/auth/google-calendar/callback`;
  
  logger.debug('Handling Google Calendar OAuth callback');
  
  const response = await callEdgeFunction<CallbackResponse>(
    `${AUTH_FUNCTION_PATH}/callback`,
    'POST',
    {
      code,
      redirect_uri: finalRedirectUri,
    }
  );
  
  logger.info('Google Calendar connected successfully', { 
    googleEmail: response.googleEmail 
  });
  
  return response;
}

/**
 * Get the current Google Calendar connection status
 * Requirement 1.4, 6.1: 연동 상태 표시
 */
export async function getConnectionStatus(): Promise<CalendarConnectionState> {
  try {
    const response = await callEdgeFunction<{
      isConnected: boolean;
      googleEmail: string | null;
      isTokenExpired: boolean;
      lastSyncAt: string | null;
      syncStatus: 'idle' | 'syncing' | 'error';
      errorMessage: string | null;
    }>(
      `${AUTH_FUNCTION_PATH}/status`,
      'GET'
    );
    
    return {
      isConnected: response.isConnected,
      googleEmail: response.googleEmail,
      isTokenExpired: response.isTokenExpired,
      lastSyncAt: response.lastSyncAt ? new Date(response.lastSyncAt) : null,
      syncStatus: response.syncStatus,
      errorMessage: response.errorMessage,
    };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get connection status', errorObj);
    
    // Return disconnected state on error
    return {
      isConnected: false,
      googleEmail: null,
      isTokenExpired: false,
      lastSyncAt: null,
      syncStatus: 'idle',
      errorMessage: errorObj.message,
    };
  }
}

/**
 * Disconnect Google Calendar and clean up all data
 * Requirement 5.4: 연동 해제
 */
export async function disconnect(): Promise<void> {
  logger.debug('Disconnecting Google Calendar');
  
  await callEdgeFunction<{ success: boolean }>(
    `${AUTH_FUNCTION_PATH}/revoke`,
    'DELETE'
  );
  
  logger.info('Google Calendar disconnected successfully');
}

/**
 * Refresh the access token if expired
 */
export async function refreshToken(): Promise<void> {
  logger.debug('Refreshing Google Calendar access token');
  
  await callEdgeFunction<{ success: boolean }>(
    `${AUTH_FUNCTION_PATH}/refresh`,
    'POST'
  );
  
  logger.debug('Token refreshed successfully');
}

// ============================================================================
// Event Management Functions
// ============================================================================

/**
 * Create calendar events for a routine
 * Requirement 2.1: 운동 일정 자동 등록
 */
export async function createEventsForRoutine(
  options: CreateEventsOptions
): Promise<SyncResult> {
  logger.debug('Creating calendar events for routine', { routineId: options.routineId });
  
  const response = await callEdgeFunction<{
    success: boolean;
    createdCount: number;
    events: Array<{ workoutId: string; eventId: string; eventDate: string }>;
    errors?: string[];
  }>(
    `${EVENTS_FUNCTION_PATH}/events`,
    'POST',
    {
      routineId: options.routineId,
      startDate: options.startDate,
      timeZone: options.timeZone || 'Asia/Seoul',
      defaultStartTime: options.defaultStartTime || '09:00',
      durationMinutes: options.durationMinutes || 60,
    }
  );
  
  logger.info('Calendar events created', { 
    routineId: options.routineId,
    createdCount: response.createdCount 
  });
  
  return {
    success: response.success,
    createdCount: response.createdCount,
    errors: response.errors,
  };
}

/**
 * Delete calendar events for a routine
 * Requirement 4.1, 4.2: 운동 일정 삭제
 */
export async function deleteEventsForRoutine(routineId: string): Promise<SyncResult> {
  logger.debug('Deleting calendar events for routine', { routineId });
  
  const response = await callEdgeFunction<{
    success: boolean;
    deletedCount: number;
    errors?: string[];
  }>(
    `${EVENTS_FUNCTION_PATH}/events`,
    'DELETE',
    { routineId }
  );
  
  logger.info('Calendar events deleted', { 
    routineId,
    deletedCount: response.deletedCount 
  });
  
  return {
    success: response.success,
    deletedCount: response.deletedCount,
    errors: response.errors,
  };
}

// ============================================================================
// Sync Functions (Requirement 6.4)
// ============================================================================

/**
 * Sync a single routine to Google Calendar
 * Requirement 6.4: 수동 동기화
 */
export async function syncRoutine(
  routineId: string,
  startDate?: string
): Promise<SyncResult> {
  logger.debug('Syncing routine to Google Calendar', { routineId });
  
  const response = await callEdgeFunction<{
    success: boolean;
    routineId: string;
    createdCount: number;
    deletedCount: number;
    errors: string[];
  }>(
    `${SYNC_FUNCTION_PATH}/sync`,
    'POST',
    {
      routineId,
      startDate: startDate || new Date().toISOString().split('T')[0],
    }
  );
  
  logger.info('Routine synced to Google Calendar', { 
    routineId,
    createdCount: response.createdCount,
    deletedCount: response.deletedCount
  });
  
  return {
    success: response.success,
    createdCount: response.createdCount,
    deletedCount: response.deletedCount,
    errors: response.errors?.length > 0 ? response.errors : undefined,
  };
}

/**
 * Sync all active routines to Google Calendar
 * Requirement 6.4: 전체 동기화
 */
export async function syncAllRoutines(): Promise<SyncResult> {
  logger.debug('Syncing all routines to Google Calendar');
  
  const response = await callEdgeFunction<{
    success: boolean;
    routineCount: number;
    totalCreated: number;
    totalDeleted: number;
    errors?: string[];
  }>(
    `${SYNC_FUNCTION_PATH}/sync-all`,
    'POST',
    {}
  );
  
  logger.info('All routines synced to Google Calendar', { 
    routineCount: response.routineCount,
    totalCreated: response.totalCreated,
    totalDeleted: response.totalDeleted
  });
  
  return {
    success: response.success,
    createdCount: response.totalCreated,
    deletedCount: response.totalDeleted,
    errors: response.errors,
  };
}

// ============================================================================
// Completion Status Functions (Requirements 7.1, 7.3)
// ============================================================================

/**
 * Mark a calendar event as completed
 * Adds ✅ prefix to title and changes color to green
 * Requirement 7.1: 완료 체크 시 캘린더 이벤트 업데이트
 */
export async function markEventCompleted(eventId: string): Promise<CompletionStatusResult> {
  logger.debug('Marking calendar event as completed', { eventId });
  
  const response = await callEdgeFunction<{
    success: boolean;
    eventId: string;
    summary: string;
    colorId: string;
  }>(
    `${EVENTS_FUNCTION_PATH}/events/${eventId}/complete`,
    'PATCH'
  );
  
  logger.info('Calendar event marked as completed', { 
    eventId,
    summary: response.summary 
  });
  
  return {
    success: response.success,
    eventId: response.eventId,
    summary: response.summary,
    colorId: response.colorId,
  };
}

/**
 * Mark a calendar event as incomplete
 * Removes ✅ prefix from title and restores default color
 * Requirement 7.3: 완료 해제 시 캘린더 이벤트 복원
 */
export async function markEventIncomplete(eventId: string): Promise<CompletionStatusResult> {
  logger.debug('Marking calendar event as incomplete', { eventId });
  
  const response = await callEdgeFunction<{
    success: boolean;
    eventId: string;
    summary: string;
    colorId: string;
  }>(
    `${EVENTS_FUNCTION_PATH}/events/${eventId}/incomplete`,
    'PATCH'
  );
  
  logger.info('Calendar event marked as incomplete', { 
    eventId,
    summary: response.summary 
  });
  
  return {
    success: response.success,
    eventId: response.eventId,
    summary: response.summary,
    colorId: response.colorId,
  };
}

// ============================================================================
// Event Mapping Functions (Requirement 7.5)
// ============================================================================

/**
 * Get the event mapping for a specific workout on a specific date
 * Requirement 7.5: 앱의 운동과 캘린더 이벤트 매핑 조회
 */
export async function getEventMapping(
  routineId: string,
  workoutId: string,
  date: string
): Promise<EventMapping | null> {
  logger.debug('Getting event mapping', { routineId, workoutId, date });
  
  try {
    const { data, error } = await supabase
      .from('calendar_event_mappings')
      .select('id, user_id, routine_id, workout_id, google_event_id, event_date')
      .eq('routine_id', routineId)
      .eq('workout_id', workoutId)
      .eq('event_date', date)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error, just no mapping exists
        logger.debug('No event mapping found', { routineId, workoutId, date });
        return null;
      }
      throw error;
    }
    
    logger.debug('Event mapping found', { 
      googleEventId: data.google_event_id 
    });
    
    return {
      id: data.id,
      userId: data.user_id,
      routineId: data.routine_id,
      workoutId: data.workout_id,
      googleEventId: data.google_event_id,
      eventDate: data.event_date,
    };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get event mapping', errorObj);
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Google Calendar is connected
 */
export async function isConnected(): Promise<boolean> {
  const status = await getConnectionStatus();
  return status.isConnected && !status.isTokenExpired;
}

/**
 * Start the OAuth flow by redirecting to Google
 */
export async function startOAuthFlow(redirectUri?: string): Promise<void> {
  const authUrl = await getAuthUrl(redirectUri);
  window.location.href = authUrl;
}

// ============================================================================
// Service Object Export
// ============================================================================

export const googleCalendarService = {
  // OAuth
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnect,
  refreshToken,
  startOAuthFlow,
  isConnected,
  
  // Events
  createEventsForRoutine,
  deleteEventsForRoutine,
  
  // Sync
  syncRoutine,
  syncAllRoutines,
  
  // Completion Status (Requirements 7.1, 7.3)
  markEventCompleted,
  markEventIncomplete,
  
  // Event Mapping (Requirement 7.5)
  getEventMapping,
};

export default googleCalendarService;
