// Google Calendar Sync Edge Function
// Handles routine synchronization with Google Calendar
// Requirements: 3.2, 6.4

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Google Calendar API configuration
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ============================================================================
// Types
// ============================================================================

interface CalendarEvent {
  id?: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

interface WorkoutData {
  id: string;
  name: string;
  dayNumber: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    muscleGroup: string;
  }>;
}

interface SyncRoutineRequest {
  routineId: string;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  timeZone?: string;
  defaultStartTime?: string; // HH:mm format
  durationMinutes?: number;
}

interface SyncAllRequest {
  startDate?: string;
  timeZone?: string;
  defaultStartTime?: string;
  durationMinutes?: number;
}

interface SyncResult {
  success: boolean;
  routineId?: string;
  createdCount: number;
  deletedCount: number;
  errors: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function createSupabaseAdmin() {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseServiceKey);
}

function createSupabaseClient(authHeader: string) {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  
  // Extract the token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

async function getUserIdFromAuth(authHeader: string): Promise<string> {
  const supabase = createSupabaseClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid or expired token');
  }
  
  return user.id;
}

// ============================================================================
// Token Management
// ============================================================================

async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createSupabaseAdmin();
  
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    throw new Error('Google Calendar not connected. Please connect your account first.');
  }

  // Check if token is expired (with 5 minute buffer)
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (tokenExpiry.getTime() - now.getTime() < bufferMs) {
    return await refreshAccessToken(userId, tokenData.refresh_token);
  }

  return tokenData.access_token;
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const clientId = getEnvVar('GOOGLE_CLIENT_ID');
  const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token. Please reconnect Google Calendar.');
  }

  const tokens = await tokenResponse.json();
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const supabase = createSupabaseAdmin();
  await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: tokens.access_token,
      token_expiry: tokenExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return tokens.access_token;
}

// ============================================================================
// Event Data Transformation
// ============================================================================

/**
 * Converts workout data to Google Calendar event format
 */
function workoutToCalendarEvent(
  workout: WorkoutData,
  routineName: string,
  eventDate: string,
  startTime: string = '09:00',
  durationMinutes: number = 60,
  timeZone: string = 'Asia/Seoul'
): CalendarEvent {
  const exerciseList = workout.exercises
    .map((ex, idx) => `${idx + 1}. ${ex.name} - ${ex.sets}세트 x ${ex.reps}`)
    .join('\n');

  const estimatedMinutes = Math.max(
    durationMinutes,
    workout.exercises.length * 5 + 10
  );

  const startDateTime = `${eventDate}T${startTime}:00`;
  const endDate = new Date(`${eventDate}T${startTime}:00`);
  endDate.setMinutes(endDate.getMinutes() + estimatedMinutes);
  const endDateTime = endDate.toISOString().slice(0, 19);

  return {
    summary: `🏋️ ${workout.name} (${routineName})`,
    description: `📋 운동 목록:\n${exerciseList}\n\n⏱️ 예상 소요 시간: ${estimatedMinutes}분\n\n🎯 루틴: ${routineName}`,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    colorId: '9',
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 30 }],
    },
  };
}

// ============================================================================
// Google Calendar API Operations
// ============================================================================

async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<string> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create calendar event: ${response.status} - ${errorData}`);
  }

  const createdEvent = await response.json();
  return createdEvent.id;
}

async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  // 404 is acceptable - event might already be deleted
  return response.ok || response.status === 404;
}

// ============================================================================
// Sync Operations
// ============================================================================

/**
 * Delete all existing calendar events for a routine
 */
async function deleteRoutineEvents(
  userId: string,
  routineId: string,
  accessToken: string
): Promise<{ deletedCount: number; errors: string[] }> {
  const supabase = createSupabaseAdmin();
  const errors: string[] = [];
  
  // Get all event mappings for this routine
  const { data: mappings, error } = await supabase
    .from('calendar_event_mappings')
    .select('google_event_id')
    .eq('routine_id', routineId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  if (!mappings || mappings.length === 0) {
    return { deletedCount: 0, errors: [] };
  }

  let deletedCount = 0;

  // Delete each event from Google Calendar
  for (const mapping of mappings) {
    try {
      const success = await deleteGoogleCalendarEvent(accessToken, mapping.google_event_id);
      if (success) {
        deletedCount++;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Failed to delete event ${mapping.google_event_id}: ${errorMessage}`);
    }
  }

  // Delete mappings from database
  await supabase
    .from('calendar_event_mappings')
    .delete()
    .eq('routine_id', routineId)
    .eq('user_id', userId);

  return { deletedCount, errors };
}

/**
 * Create calendar events for a routine
 */
async function createRoutineEvents(
  userId: string,
  routineId: string,
  accessToken: string,
  startDate: string,
  timeZone: string,
  defaultStartTime: string,
  durationMinutes: number
): Promise<{ createdCount: number; errors: string[] }> {
  const supabase = createSupabaseAdmin();
  const errors: string[] = [];
  let createdCount = 0;

  // Get routine with settings
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('id, name, settings, is_active')
    .eq('id', routineId)
    .eq('user_id', userId)
    .single();

  if (routineError || !routine) {
    throw new Error('Routine not found');
  }

  // Only sync active routines
  if (!routine.is_active) {
    return { createdCount: 0, errors: ['Routine is not active'] };
  }

  // Get workouts with exercises
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select(`
      id,
      name,
      day_number,
      exercises (
        id,
        name,
        sets,
        reps,
        muscle_group
      )
    `)
    .eq('routine_id', routineId)
    .order('day_number', { ascending: true });

  if (workoutsError) {
    throw workoutsError;
  }

  if (!workouts || workouts.length === 0) {
    return { createdCount: 0, errors: ['No workouts found for routine'] };
  }

  // Calculate event dates based on routine settings
  const settings = routine.settings as { durationWeeks: number; workoutsPerWeek: number };
  const totalDays = (settings.durationWeeks || 4) * 7;
  const workoutsPerWeek = settings.workoutsPerWeek || workouts.length;

  const start = new Date(startDate);
  const currentDate = new Date(start);
  let workoutIndex = 0;
  let weekWorkoutCount = 0;

  for (let day = 0; day < totalDays && workoutIndex < workouts.length * (settings.durationWeeks || 4); day++) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && weekWorkoutCount < workoutsPerWeek) {
      const workout = workouts[workoutIndex % workouts.length];
      const eventDate = currentDate.toISOString().split('T')[0];

      const workoutData: WorkoutData = {
        id: workout.id,
        name: workout.name,
        dayNumber: workout.day_number,
        exercises: ((workout as { exercises?: Array<{ name: string; sets: number; reps: string; muscle_group: string }> }).exercises || []).map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          muscleGroup: ex.muscle_group,
        })),
      };

      const calendarEvent = workoutToCalendarEvent(
        workoutData,
        routine.name,
        eventDate,
        defaultStartTime,
        durationMinutes,
        timeZone
      );

      try {
        const eventId = await createGoogleCalendarEvent(accessToken, calendarEvent);

        // Store mapping in database
        await supabase
          .from('calendar_event_mappings')
          .upsert({
            user_id: userId,
            routine_id: routineId,
            workout_id: workout.id,
            google_event_id: eventId,
            event_date: eventDate,
          }, {
            onConflict: 'workout_id,event_date',
          });

        createdCount++;
        workoutIndex++;
        weekWorkoutCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Failed to create event for ${workout.name} on ${eventDate}: ${errorMessage}`);
      }
    }

    // Reset weekly count on Sunday
    if (dayOfWeek === 0) {
      weekWorkoutCount = 0;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { createdCount, errors };
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /sync/:routineId - Sync a single routine
 * Requirements: 3.2, 6.4
 */
async function handleSyncRoutine(
  userId: string,
  request: SyncRoutineRequest
): Promise<Response> {
  const supabase = createSupabaseAdmin();
  const {
    routineId,
    startDate = new Date().toISOString().split('T')[0],
    timeZone = 'Asia/Seoul',
    defaultStartTime = '09:00',
    durationMinutes = 60,
  } = request;

  // Update sync status to syncing
  await supabase
    .from('calendar_sync_status')
    .upsert({
      user_id: userId,
      sync_status: 'syncing',
      error_message: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  try {
    const accessToken = await getValidAccessToken(userId);

    // Delete existing events for this routine
    const deleteResult = await deleteRoutineEvents(userId, routineId, accessToken);

    // Create new events
    const createResult = await createRoutineEvents(
      userId,
      routineId,
      accessToken,
      startDate,
      timeZone,
      defaultStartTime,
      durationMinutes
    );

    const allErrors = [...deleteResult.errors, ...createResult.errors];

    // Update sync status
    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_status: allErrors.length > 0 ? 'error' : 'idle',
        error_message: allErrors.length > 0 ? allErrors.join('; ') : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    const result: SyncResult = {
      success: allErrors.length === 0,
      routineId,
      createdCount: createResult.createdCount,
      deletedCount: deleteResult.deletedCount,
      errors: allErrors,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        sync_status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /sync-all - Sync all active routines
 * Requirements: 6.4
 */
async function handleSyncAll(
  userId: string,
  request: SyncAllRequest
): Promise<Response> {
  const supabase = createSupabaseAdmin();
  const {
    startDate = new Date().toISOString().split('T')[0],
    timeZone = 'Asia/Seoul',
    defaultStartTime = '09:00',
    durationMinutes = 60,
  } = request;

  // Update sync status to syncing
  await supabase
    .from('calendar_sync_status')
    .upsert({
      user_id: userId,
      sync_status: 'syncing',
      error_message: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  try {
    // Get all active routines for the user
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (routinesError) {
      throw routinesError;
    }

    if (!routines || routines.length === 0) {
      await supabase
        .from('calendar_sync_status')
        .upsert({
          user_id: userId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'idle',
          error_message: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      return new Response(
        JSON.stringify({
          success: true,
          routineCount: 0,
          totalCreated: 0,
          totalDeleted: 0,
          errors: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getValidAccessToken(userId);
    let totalCreated = 0;
    let totalDeleted = 0;
    const allErrors: string[] = [];
    const routineResults: SyncResult[] = [];

    // Sync each routine
    for (const routine of routines) {
      try {
        // Delete existing events
        const deleteResult = await deleteRoutineEvents(userId, routine.id, accessToken);
        totalDeleted += deleteResult.deletedCount;
        allErrors.push(...deleteResult.errors);

        // Create new events
        const createResult = await createRoutineEvents(
          userId,
          routine.id,
          accessToken,
          startDate,
          timeZone,
          defaultStartTime,
          durationMinutes
        );
        totalCreated += createResult.createdCount;
        allErrors.push(...createResult.errors);

        routineResults.push({
          success: deleteResult.errors.length === 0 && createResult.errors.length === 0,
          routineId: routine.id,
          createdCount: createResult.createdCount,
          deletedCount: deleteResult.deletedCount,
          errors: [...deleteResult.errors, ...createResult.errors],
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        allErrors.push(`Routine ${routine.id}: ${errorMessage}`);
        routineResults.push({
          success: false,
          routineId: routine.id,
          createdCount: 0,
          deletedCount: 0,
          errors: [errorMessage],
        });
      }
    }

    // Update sync status
    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_status: allErrors.length > 0 ? 'error' : 'idle',
        error_message: allErrors.length > 0 ? allErrors.slice(0, 5).join('; ') : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({
        success: allErrors.length === 0,
        routineCount: routines.length,
        totalCreated,
        totalDeleted,
        routineResults,
        errors: allErrors.length > 0 ? allErrors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        sync_status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// Main Request Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = await getUserIdFromAuth(authHeader);

    // Parse request body
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        // Body might be empty
      }
    }

    // Route: POST /sync-all - Sync all active routines
    if (req.method === 'POST' && lastPart === 'sync-all') {
      return handleSyncAll(userId, body as SyncAllRequest);
    }

    // Route: POST /sync/:routineId - Sync a single routine
    if (req.method === 'POST' && pathParts.includes('sync')) {
      // Check if there's a routineId in the path or body
      const routineId = body.routineId as string || (lastPart !== 'sync' ? lastPart : undefined);
      
      if (!routineId) {
        return new Response(
          JSON.stringify({ error: 'routineId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return handleSyncRoutine(userId, { ...body, routineId } as SyncRoutineRequest);
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
