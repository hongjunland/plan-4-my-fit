-- Normalize routine structure with separate workouts and exercises tables
-- This migration creates separate tables for workouts and exercises instead of storing them as JSONB

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps VARCHAR(20) NOT NULL, -- "8-10" or "30초" format
  muscle_group VARCHAR(20) NOT NULL CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body')),
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0, -- For maintaining exercise order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workouts_routine_id ON public.workouts(routine_id);
CREATE INDEX idx_workouts_day_number ON public.workouts(day_number);
CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_exercises_muscle_group ON public.exercises(muscle_group);
CREATE INDEX idx_exercises_order ON public.exercises(order_index);

-- Create triggers for updated_at
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Workouts table policies
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.routines 
            WHERE routines.id = workouts.routine_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.routines 
            WHERE routines.id = workouts.routine_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.routines 
            WHERE routines.id = workouts.routine_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.routines 
            WHERE routines.id = workouts.routine_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

-- Exercises table policies
CREATE POLICY "Users can view own exercises" ON public.exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            JOIN public.routines ON routines.id = workouts.routine_id
            WHERE workouts.id = exercises.workout_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own exercises" ON public.exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts 
            JOIN public.routines ON routines.id = workouts.routine_id
            WHERE workouts.id = exercises.workout_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own exercises" ON public.exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            JOIN public.routines ON routines.id = workouts.routine_id
            WHERE workouts.id = exercises.workout_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own exercises" ON public.exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            JOIN public.routines ON routines.id = workouts.routine_id
            WHERE workouts.id = exercises.workout_id 
            AND routines.user_id::text = auth.uid()::text
        )
    );

-- Add constraint to ensure only one active routine per user
CREATE UNIQUE INDEX idx_routines_user_active ON public.routines(user_id) 
WHERE is_active = true;

-- Add constraint to limit maximum routines per user (10)
CREATE OR REPLACE FUNCTION check_routine_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.routines WHERE user_id = NEW.user_id) >= 10 THEN
        RAISE EXCEPTION 'User cannot have more than 10 routines';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_routine_limit
    BEFORE INSERT ON public.routines
    FOR EACH ROW
    EXECUTE FUNCTION check_routine_limit();