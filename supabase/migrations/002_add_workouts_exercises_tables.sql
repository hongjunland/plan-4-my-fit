-- Add workouts and exercises tables for normalized routine structure

-- Individual workouts within a routine
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  
  day_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual exercises within a workout
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps VARCHAR(20) NOT NULL, -- e.g., "8-10", "12", "AMRAP"
  muscle_group VARCHAR(20) NOT NULL CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body')),
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_workouts_routine_id ON public.workouts(routine_id);
CREATE INDEX idx_workouts_day_number ON public.workouts(routine_id, day_number);
CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_exercises_order ON public.exercises(workout_id, order_index);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "workouts_policy" ON public.workouts
    USING (auth.uid() IN (
        SELECT user_id FROM public.routines WHERE id = routine_id
    ))
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.routines WHERE id = routine_id
    ));

CREATE POLICY "exercises_policy" ON public.exercises
    USING (auth.uid() IN (
        SELECT r.user_id FROM public.routines r
        JOIN public.workouts w ON w.routine_id = r.id
        WHERE w.id = workout_id
    ))
    WITH CHECK (auth.uid() IN (
        SELECT r.user_id FROM public.routines r
        JOIN public.workouts w ON w.routine_id = r.id
        WHERE w.id = workout_id
    ));