-- 날짜별 운동 일정 테이블 추가
-- 기존 계산 방식에서 날짜별 저장 방식으로 변경

-- scheduled_workouts 테이블 생성
CREATE TABLE public.scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 일정 정보
  scheduled_date DATE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL, -- 휴식일이면 NULL
  is_rest_day BOOLEAN DEFAULT FALSE,
  
  -- 메타 정보
  notes TEXT, -- 사용자 메모 (선택)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 루틴에서 같은 날짜에 중복 일정 방지
  UNIQUE(routine_id, scheduled_date)
);

-- 인덱스 생성
CREATE INDEX idx_scheduled_workouts_routine_id ON public.scheduled_workouts(routine_id);
CREATE INDEX idx_scheduled_workouts_user_id ON public.scheduled_workouts(user_id);
CREATE INDEX idx_scheduled_workouts_date ON public.scheduled_workouts(scheduled_date);
CREATE INDEX idx_scheduled_workouts_user_date ON public.scheduled_workouts(user_id, scheduled_date);
CREATE INDEX idx_scheduled_workouts_routine_date_range ON public.scheduled_workouts(routine_id, scheduled_date);

-- updated_at 트리거
CREATE TRIGGER update_scheduled_workouts_updated_at 
    BEFORE UPDATE ON public.scheduled_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security 활성화
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own scheduled workouts" ON public.scheduled_workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled workouts" ON public.scheduled_workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled workouts" ON public.scheduled_workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled workouts" ON public.scheduled_workouts
    FOR DELETE USING (auth.uid() = user_id);

-- 일정 생성 함수 (루틴 활성화 시 호출)
CREATE OR REPLACE FUNCTION generate_routine_schedule(
  p_routine_id UUID,
  p_user_id UUID,
  p_start_date DATE,
  p_duration_weeks INTEGER
)
RETURNS void AS $$
DECLARE
  v_workout RECORD;
  v_workouts UUID[];
  v_workout_count INTEGER;
  v_current_date DATE;
  v_end_date DATE;
  v_day_index INTEGER := 0;
  v_workout_index INTEGER := 0;
  v_cycle_length INTEGER;
BEGIN
  -- 기존 일정 삭제
  DELETE FROM public.scheduled_workouts 
  WHERE routine_id = p_routine_id;
  
  -- 워크아웃 목록 가져오기 (day_number 순서대로)
  SELECT ARRAY_AGG(id ORDER BY day_number) INTO v_workouts
  FROM public.workouts
  WHERE routine_id = p_routine_id;
  
  v_workout_count := COALESCE(array_length(v_workouts, 1), 0);
  
  IF v_workout_count = 0 THEN
    RETURN;
  END IF;
  
  -- 사이클 길이: 워크아웃 수 + 휴식 1일
  v_cycle_length := v_workout_count + 1;
  
  v_current_date := p_start_date;
  v_end_date := p_start_date + (p_duration_weeks * 7);
  
  -- 기간 동안 일정 생성
  WHILE v_current_date < v_end_date LOOP
    v_workout_index := v_day_index % v_cycle_length;
    
    IF v_workout_index < v_workout_count THEN
      -- 운동일
      INSERT INTO public.scheduled_workouts (routine_id, user_id, scheduled_date, workout_id, is_rest_day)
      VALUES (p_routine_id, p_user_id, v_current_date, v_workouts[v_workout_index + 1], FALSE);
    ELSE
      -- 휴식일
      INSERT INTO public.scheduled_workouts (routine_id, user_id, scheduled_date, workout_id, is_rest_day)
      VALUES (p_routine_id, p_user_id, v_current_date, NULL, TRUE);
    END IF;
    
    v_current_date := v_current_date + 1;
    v_day_index := v_day_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
