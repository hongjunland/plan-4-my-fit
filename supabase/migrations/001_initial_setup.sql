-- 🚀 Plan4MyFit - Initial Database Setup
-- Clean, secure schema for fitness routine planner

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  age INTEGER NOT NULL CHECK (age >= 15 AND age <= 80),
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height INTEGER NOT NULL CHECK (height >= 100 AND height <= 250),
  weight INTEGER NOT NULL CHECK (weight >= 30 AND weight <= 300),
  
  -- Workout Environment
  workout_location VARCHAR(20) NOT NULL CHECK (workout_location IN ('gym', 'home', 'outdoor', 'mixed')),
  weekly_workouts INTEGER NOT NULL CHECK (weekly_workouts >= 1 AND weekly_workouts <= 7),
  
  -- Goals & Focus
  goal VARCHAR(20) NOT NULL CHECK (goal IN ('strength', 'weight_loss', 'endurance', 'muscle_gain', 'body_correction')),
  focus VARCHAR(20) NOT NULL CHECK (focus IN ('upper_body', 'lower_body', 'full_body', 'core')),
  
  -- Physical Condition
  fitness_level VARCHAR(20) NOT NULL CHECK (fitness_level IN ('beginner', 'novice', 'intermediate', 'advanced')),
  uncomfortable_areas JSONB DEFAULT '[]',
  
  -- Experience
  experience_level VARCHAR(20) NOT NULL CHECK (experience_level IN ('none', 'under_6months', '6months_1year', '1year_3years', 'over_3years')),
  exercise_history JSONB DEFAULT '[]',
  
  -- Plan Settings
  plan_duration INTEGER NOT NULL CHECK (plan_duration IN (4, 8, 12, 16)),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout routines
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Routine data stored as JSON for flexibility
  settings JSONB NOT NULL,
  workouts JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily workout completion logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  
  workout_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  
  completed_exercises JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, routine_id, workout_id, date)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routines_active ON public.routines(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, date);
CREATE INDEX idx_workout_logs_routine ON public.workout_logs(routine_id, date);

-- ============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at 
    BEFORE UPDATE ON public.routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Simple, secure policies
CREATE POLICY "profiles_policy" ON public.profiles
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "routines_policy" ON public.routines
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_logs_policy" ON public.workout_logs
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. CONSTRAINTS
-- ============================================================================
-- Only one active routine per user
CREATE UNIQUE INDEX idx_one_active_routine_per_user 
    ON public.routines(user_id) 
    WHERE is_active = true;