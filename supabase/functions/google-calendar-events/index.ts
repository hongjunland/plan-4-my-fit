// Google Calendar Events Edge Function
// Handles event creation, update, and deletion for workout routines
// Requirements: 2.1, 3.1, 4.1, 4.2

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PATCH, DELETE, OPTIONS',
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
  start: { date: string };  // 종일 이벤트: YYYY-MM-DD 형식
  end: { date: string };    // 종일 이벤트: YYYY-MM-DD 형식 (시작일 다음날)
  colorId?: string;
  reminders?: {
    useDefault: boolean;
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

interface CreateEventsRequest {
  routineId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
}

interface UpdateEventRequest {
  eventId: string;
  workout: WorkoutData;
  eventDate: string;
}

interface DeleteEventsRequest {
  eventIds?: string[];
  routineId?: string;
}

interface CompletionStatusRequest {
  eventId: string;
}

// Constants for completion status
const COMPLETION_EMOJI = '✅ ';
const COMPLETED_COLOR_ID = '10';  // Green/Basil
const DEFAULT_COLOR_ID = '9';     // Blue (default for fitness events)

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

async function getUserIdFromAuth(authHeader: string): Promise<string> {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  
  // Extract the token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  
  // Use service role client to verify the user's JWT token
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('Auth error:', error?.message || 'No user found');
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
    // Token expired or about to expire, refresh it
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

  // Update token in database
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
// Event Data Transformation (Requirements 2.2)
// ============================================================================

/**
 * Converts workout data to Google Calendar all-day event format
 * Includes: workout name (summary), exercise list (description)
 * 종일 이벤트로 생성하여 시간대 문제 방지
 */
export function workoutToCalendarEvent(
  workout: WorkoutData,
  routineName: string,
  eventDate: string
): CalendarEvent {
  // Build exercise list for description
  const exerciseList = workout.exercises
    .map((ex, idx) => `${idx + 1}. ${ex.name} - ${ex.sets}세트 x ${ex.reps}`)
    .join('\n');

  // Calculate estimated duration based on exercises
  const estimatedMinutes = Math.max(
    60,
    workout.exercises.length * 5 + 10 // 5 min per exercise + 10 min warmup
  );

  // 종일 이벤트: end date는 시작일 다음날이어야 함
  const endDateObj = new Date(eventDate + 'T00:00:00');
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  return {
    summary: `🏋️ ${workout.name} (${routineName})`,
    description: `📋 운동 목록:\n${exerciseList}\n\n⏱️ 예상 소요 시간: ${estimatedMinutes}분\n\n🎯 루틴: ${routineName}`,
    start: { date: eventDate },
    end: { date: endDate },
    colorId: '9', // Blue color for fitness events
    reminders: {
      useDefault: true,
    },
  };
}

/**
 * Validates that a CalendarEvent has all required fields
 * Property 2: 이벤트 데이터 완전성
 */
export function validateCalendarEvent(event: CalendarEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event.summary || event.summary.trim() === '') {
    errors.push('summary (운동 이름) is required');
  }

  if (!event.description || event.description.trim() === '') {
    errors.push('description (운동 목록) is required');
  }

  if (!event.start?.date) {
    errors.push('start.date is required');
  }

  if (!event.end?.date) {
    errors.push('end.date is required');
  }

  return { valid: errors.length === 0, errors };
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
    console.error('Failed to create calendar event:', errorData);
    throw new Error(`Failed to create calendar event: ${response.status}`);
  }

  const createdEvent = await response.json();
  return createdEvent.id;
}

async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: CalendarEvent
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to update calendar event:', errorData);
    throw new Error(`Failed to update calendar event: ${response.status}`);
  }
}

async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
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
  if (!response.ok && response.status !== 404) {
    const errorData = await response.text();
    console.error('Failed to delete calendar event:', errorData);
    throw new Error(`Failed to delete calendar event: ${response.status}`);
  }
}

async function getGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = await response.text();
    console.error('Failed to get calendar event:', errorData);
    throw new Error(`Failed to get calendar event: ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// Completion Status Helper Functions (Requirements 7.1, 7.2, 7.3, 7.4)
// ============================================================================

/**
 * Adds completion marker to event title
 * Requirements: 7.1
 */
export function addCompletionMarker(summary: string): string {
  // Don't add if already has completion marker
  if (summary.startsWith(COMPLETION_EMOJI)) {
    return summary;
  }
  return `${COMPLETION_EMOJI}${summary}`;
}

/**
 * Removes completion marker from event title
 * Requirements: 7.3
 */
export function removeCompletionMarker(summary: string): string {
  if (summary.startsWith(COMPLETION_EMOJI)) {
    return summary.slice(COMPLETION_EMOJI.length);
  }
  return summary;
}

/**
 * Checks if event title has completion marker
 */
export function hasCompletionMarker(summary: string): boolean {
  return summary.startsWith(COMPLETION_EMOJI);
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /events - Create calendar events for a routine
 * Requirements: 2.1
 */
async function handleCreateEvents(
  userId: string,
  request: CreateEventsRequest
): Promise<Response> {
  const supabase = createSupabaseAdmin();
  const { routineId, startDate } = request;

  try {
    // Get routine with workouts
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id, name, settings')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (routineError || !routine) {
      return new Response(
        JSON.stringify({ error: 'Routine not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Calculate event dates based on routine settings
    const settings = routine.settings as { durationWeeks: number; workoutsPerWeek: number };
    const createdEvents: Array<{ workoutId: string; eventId: string; eventDate: string }> = [];
    const errors: string[] = [];

    // Create events for each workout day
    const start = new Date(startDate);
    const currentDate = new Date(start);
    let workoutIndex = 0;

    // Create events for the duration of the routine
    const totalDays = settings.durationWeeks * 7;
    const workoutsPerWeek = settings.workoutsPerWeek || workouts?.length || 3;

    for (let day = 0; day < totalDays && workouts && workouts.length > 0; day++) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends for simplicity (can be customized)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const workout = workouts[workoutIndex % workouts.length];
        const eventDate = currentDate.toISOString().split('T')[0];

        // Transform workout to calendar event
        const workoutData: WorkoutData = {
          id: workout.id,
          name: workout.name,
          dayNumber: workout.day_number,
          exercises: (workout.exercises || []).map((ex: { name: string; sets: number; reps: string; muscle_group: string }) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            muscleGroup: ex.muscle_group,
          })),
        };

        const calendarEvent = workoutToCalendarEvent(
          workoutData,
          routine.name,
          eventDate
        );

        // Validate event data (Property 2)
        const validation = validateCalendarEvent(calendarEvent);
        if (!validation.valid) {
          errors.push(`Workout ${workout.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        try {
          // Create event in Google Calendar
          const eventId = await createGoogleCalendarEvent(accessToken, calendarEvent);

          // Store mapping in database (Requirements 2.3)
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

          createdEvents.push({
            workoutId: workout.id,
            eventId,
            eventDate,
          });

          workoutIndex++;
          
          // Limit to workoutsPerWeek
          if (workoutIndex % workoutsPerWeek === 0) {
            // Skip to next week
            const daysUntilNextWeek = 7 - (day % 7);
            day += daysUntilNextWeek - 1;
            currentDate.setDate(currentDate.getDate() + daysUntilNextWeek - 1);
          }
        } catch (eventError) {
          const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
          errors.push(`Failed to create event for ${workout.name} on ${eventDate}: ${errorMessage}`);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update sync status
    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_status: errors.length > 0 ? 'error' : 'idle',
        error_message: errors.length > 0 ? errors.join('; ') : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({
        success: true,
        createdCount: createdEvents.length,
        events: createdEvents,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Update sync status to error
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
 * PATCH /events/:id - Update a calendar event
 * Requirements: 3.1
 */
async function handleUpdateEvent(
  userId: string,
  request: UpdateEventRequest
): Promise<Response> {
  const supabase = createSupabaseAdmin();
  const { eventId, workout, eventDate } = request;

  try {
    // Verify the event belongs to this user
    const { data: mapping, error: mappingError } = await supabase
      .from('calendar_event_mappings')
      .select('routine_id')
      .eq('google_event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (mappingError || !mapping) {
      return new Response(
        JSON.stringify({ error: 'Event not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get routine name
    const { data: routine } = await supabase
      .from('routines')
      .select('name')
      .eq('id', mapping.routine_id)
      .single();

    const routineName = routine?.name || 'Workout';

    // Transform workout to calendar event
    const calendarEvent = workoutToCalendarEvent(
      workout,
      routineName,
      eventDate
    );

    // Validate event data (Property 2)
    const validation = validateCalendarEvent(calendarEvent);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid event data', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Update event in Google Calendar
    await updateGoogleCalendarEvent(accessToken, eventId, calendarEvent);

    // Update mapping if date changed
    await supabase
      .from('calendar_event_mappings')
      .update({ event_date: eventDate })
      .eq('google_event_id', eventId)
      .eq('user_id', userId);

    // Update sync status
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
      JSON.stringify({ success: true, eventId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /events - Delete calendar events
 * Requirements: 4.1, 4.2
 */
async function handleDeleteEvents(
  userId: string,
  request: DeleteEventsRequest
): Promise<Response> {
  const supabase = createSupabaseAdmin();
  const { eventIds, routineId } = request;

  try {
    let eventsToDelete: string[] = [];

    if (eventIds && eventIds.length > 0) {
      // Delete specific events
      eventsToDelete = eventIds;
    } else if (routineId) {
      // Delete all events for a routine
      const { data: mappings, error } = await supabase
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('routine_id', routineId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      eventsToDelete = (mappings || []).map(m => m.google_event_id);
    } else {
      return new Response(
        JSON.stringify({ error: 'Either eventIds or routineId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (eventsToDelete.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deletedCount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Delete events from Google Calendar
    const errors: string[] = [];
    for (const eventId of eventsToDelete) {
      try {
        await deleteGoogleCalendarEvent(accessToken, eventId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to delete event ${eventId}: ${errorMessage}`);
      }
    }

    // Delete mappings from database (Requirements 4.3)
    if (routineId) {
      await supabase
        .from('calendar_event_mappings')
        .delete()
        .eq('routine_id', routineId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('calendar_event_mappings')
        .delete()
        .in('google_event_id', eventsToDelete)
        .eq('user_id', userId);
    }

    // Update sync status
    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        sync_status: errors.length > 0 ? 'error' : 'idle',
        error_message: errors.length > 0 ? errors.join('; ') : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: eventsToDelete.length - errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /events/:id/complete - Mark event as completed
 * Requirements: 7.1, 7.2
 * Adds ✅ prefix to title and changes color to green (colorId: 10)
 */
async function handleMarkEventComplete(
  userId: string,
  eventId: string
): Promise<Response> {
  const supabase = createSupabaseAdmin();

  try {
    // Verify the event belongs to this user
    const { data: mapping, error: mappingError } = await supabase
      .from('calendar_event_mappings')
      .select('id')
      .eq('google_event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (mappingError || !mapping) {
      return new Response(
        JSON.stringify({ error: 'Event not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Get current event from Google Calendar
    const currentEvent = await getGoogleCalendarEvent(accessToken, eventId);
    if (!currentEvent) {
      return new Response(
        JSON.stringify({ error: 'Event not found in Google Calendar' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add completion marker to title and change color to green
    const updatedEvent: Partial<CalendarEvent> = {
      summary: addCompletionMarker(currentEvent.summary || ''),
      colorId: COMPLETED_COLOR_ID,
    };

    // Update event in Google Calendar
    await updateGoogleCalendarEvent(accessToken, eventId, updatedEvent as CalendarEvent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId,
        summary: updatedEvent.summary,
        colorId: updatedEvent.colorId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error marking event complete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /events/:id/incomplete - Mark event as incomplete
 * Requirements: 7.3, 7.4
 * Removes ✅ prefix from title and restores default color (colorId: 9)
 */
async function handleMarkEventIncomplete(
  userId: string,
  eventId: string
): Promise<Response> {
  const supabase = createSupabaseAdmin();

  try {
    // Verify the event belongs to this user
    const { data: mapping, error: mappingError } = await supabase
      .from('calendar_event_mappings')
      .select('id')
      .eq('google_event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (mappingError || !mapping) {
      return new Response(
        JSON.stringify({ error: 'Event not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Get current event from Google Calendar
    const currentEvent = await getGoogleCalendarEvent(accessToken, eventId);
    if (!currentEvent) {
      return new Response(
        JSON.stringify({ error: 'Event not found in Google Calendar' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove completion marker from title and restore default color
    const updatedEvent: Partial<CalendarEvent> = {
      summary: removeCompletionMarker(currentEvent.summary || ''),
      colorId: DEFAULT_COLOR_ID,
    };

    // Update event in Google Calendar
    await updateGoogleCalendarEvent(accessToken, eventId, updatedEvent as CalendarEvent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId,
        summary: updatedEvent.summary,
        colorId: updatedEvent.colorId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error marking event incomplete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
    let body: Record<string, any> = {};
    if (req.method !== 'GET') {
      try {
        body = await req.json();
      } catch {
        // Body might be empty
      }
    }

    // Route: POST /events - Create events
    if (req.method === 'POST' && lastPart === 'events') {
      return handleCreateEvents(userId, body as CreateEventsRequest);
    }

    // Route: PATCH /events/:id/complete - Mark event as completed
    // Requirements: 7.1, 7.2
    if (req.method === 'PATCH' && lastPart === 'complete' && pathParts.includes('events')) {
      // Path format: /events/:id/complete
      const eventsIndex = pathParts.indexOf('events');
      const eventId = pathParts[eventsIndex + 1];
      if (eventId && eventId !== 'complete') {
        return handleMarkEventComplete(userId, eventId);
      }
    }

    // Route: PATCH /events/:id/incomplete - Mark event as incomplete
    // Requirements: 7.3, 7.4
    if (req.method === 'PATCH' && lastPart === 'incomplete' && pathParts.includes('events')) {
      // Path format: /events/:id/incomplete
      const eventsIndex = pathParts.indexOf('events');
      const eventId = pathParts[eventsIndex + 1];
      if (eventId && eventId !== 'incomplete') {
        return handleMarkEventIncomplete(userId, eventId);
      }
    }

    // Route: PATCH /events/:id - Update event
    if (req.method === 'PATCH' && pathParts.includes('events') && lastPart !== 'complete' && lastPart !== 'incomplete') {
      const eventId = lastPart;
      return handleUpdateEvent(userId, { ...body, eventId } as UpdateEventRequest);
    }

    // Route: DELETE /events - Delete events
    if (req.method === 'DELETE' && lastPart === 'events') {
      return handleDeleteEvents(userId, body as DeleteEventsRequest);
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
