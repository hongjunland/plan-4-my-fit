-- 🗓️ Google Calendar Integration - Database Schema
-- Tables for OAuth tokens, event mappings, and sync status

-- ============================================================================
-- 1. GOOGLE CALENDAR TOKENS TABLE
-- Stores OAuth tokens for Google Calendar API access
-- ============================================================================
CREATE TABLE public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- OAuth tokens (should be encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Google account info
  google_email TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_google_calendar_tokens_updated_at 
    BEFORE UPDATE ON public.google_calendar_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own tokens
CREATE POLICY "google_calendar_tokens_policy" ON public.google_calendar_tokens
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. CALENDAR EVENT MAPPINGS TABLE
-- Maps routine workouts to Google Calendar events
-- ============================================================================
CREATE TABLE public.calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  
  -- Google Calendar event reference
  google_event_id TEXT NOT NULL,
  event_date DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique mapping per workout per date
  UNIQUE(workout_id, event_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_calendar_event_mappings_user_id ON public.calendar_event_mappings(user_id);
CREATE INDEX idx_calendar_event_mappings_routine_id ON public.calendar_event_mappings(routine_id);
CREATE INDEX idx_calendar_event_mappings_workout_id ON public.calendar_event_mappings(workout_id);
CREATE INDEX idx_calendar_event_mappings_google_event_id ON public.calendar_event_mappings(google_event_id);
CREATE INDEX idx_calendar_event_mappings_event_date ON public.calendar_event_mappings(event_date);

-- Enable RLS
ALTER TABLE public.calendar_event_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own mappings
CREATE POLICY "calendar_event_mappings_policy" ON public.calendar_event_mappings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. CALENDAR SYNC STATUS TABLE
-- Tracks synchronization status for each user
-- ============================================================================
CREATE TABLE public.calendar_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync status tracking
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_calendar_sync_status_user_id ON public.calendar_sync_status(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_sync_status_updated_at 
    BEFORE UPDATE ON public.calendar_sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.calendar_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own sync status
CREATE POLICY "calendar_sync_status_policy" ON public.calendar_sync_status
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
