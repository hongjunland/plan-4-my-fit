import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import useAuth from '../hooks/useAuth';
import type { Exercise, WorkoutWithExercises } from '../services/routines';
import { workoutLogService } from '../services/database';
import { scheduledWorkoutsService, type CalendarData } from '../services/scheduledWorkouts';

// 로컬 시간대 기준 날짜 문자열 (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type ToggleExerciseHandler = (workoutId: string, exerciseId: string, date: string, totalExerciseCount: number) => void;

const CalendarPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  
  const tabs = [
    { key: 'today', label: '일일' },
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
  ] as const;

  const userId = user?.id;

  // 데이터 로드 (한 번의 API 호출로 모든 데이터)
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 이번 달 기준으로 데이터 조회 (앞뒤 여유 포함)
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        
        const data = await scheduledWorkoutsService.getCalendarData(
          userId,
          getLocalDateString(startDate),
          getLocalDateString(endDate)
        );
        
        setCalendarData(data);
      } catch {
        // 에러 무시
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // 운동 완료 토글 핸들러
  const handleToggleExercise = useCallback(async (
    workoutId: string,
    exerciseId: string,
    date: string,
    totalExerciseCount: number
  ) => {
    if (!userId || !calendarData?.routine) return;

    // 낙관적 업데이트
    setCalendarData(prev => {
      if (!prev) return prev;
      
      const newLogs = new Map(prev.logs);
      const existing = newLogs.get(date);
      const completedExercises = existing?.completedExercises || [];
      
      const newCompleted = completedExercises.includes(exerciseId)
        ? completedExercises.filter(id => id !== exerciseId)
        : [...completedExercises, exerciseId];
      
      const isCompleted = newCompleted.length === totalExerciseCount && totalExerciseCount > 0;
      
      newLogs.set(date, {
        date,
        workoutId,
        completedExercises: newCompleted,
        isCompleted
      });
      
      return { ...prev, logs: newLogs };
    });

    // DB 저장
    try {
      await workoutLogService.toggleExerciseCompletion(
        userId,
        calendarData.routine.id,
        workoutId,
        exerciseId,
        date,
        totalExerciseCount
      );
    } catch {
      // 에러 시 롤백 (간단히 무시)
    }
  }, [userId, calendarData?.routine]);

  // 워크아웃 ID로 워크아웃 찾기
  const getWorkoutById = useCallback((workoutId: string | null): WorkoutWithExercises | null => {
    if (!workoutId || !calendarData) return null;
    return calendarData.workouts.find(w => w.id === workoutId) || null;
  }, [calendarData]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="flex bg-gray-200 rounded-xl p-1 mb-6 h-12"></div>
          <div className="bg-gray-200 rounded-xl h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'today' && (
        <DailyView 
          calendarData={calendarData}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onToggleExercise={handleToggleExercise}
          getWorkoutById={getWorkoutById}
        />
      )}
      {activeTab === 'week' && (
        <WeekView 
          calendarData={calendarData}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onToggleExercise={handleToggleExercise}
          getWorkoutById={getWorkoutById}
        />
      )}
      {activeTab === 'month' && (
        <MonthView 
          calendarData={calendarData}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveTab('today');
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// 일일 뷰
// ============================================================================
const DailyView = ({ 
  calendarData,
  selectedDate,
  onSelectDate,
  onToggleExercise,
  getWorkoutById
}: { 
  calendarData: CalendarData | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleExercise: ToggleExerciseHandler;
  getWorkoutById: (id: string | null) => WorkoutWithExercises | null;
}) => {
  const today = getLocalDateString();
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isToday = selectedDate === today;
  
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate + 'T00:00:00');
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onSelectDate(getLocalDateString(newDate));
  };

  const goToToday = () => onSelectDate(getLocalDateString());

  // 일정에서 오늘의 운동 가져오기
  const schedule = calendarData?.schedules.get(selectedDate);
  const selectedWorkout = schedule ? getWorkoutById(schedule.workoutId) : null;
  const isRestDay = schedule?.isRestDay ?? true;

  if (!calendarData?.routine) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">일일 운동</h3>
          <button onClick={goToToday} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            오늘로
          </button>
        </div>
        
        <DateSelector
          selectedDateFormatted={selectedDateFormatted}
          isToday={isToday}
          onPrev={() => handleDateChange('prev')}
          onNext={() => handleDateChange('next')}
        />

        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-sm">
            활성화된 루틴이 없습니다.<br />
            루틴을 먼저 활성화해주세요!
          </p>
        </div>
      </div>
    );
  }

  // 일정이 없거나 휴식일
  if (!schedule || isRestDay || !selectedWorkout) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">일일 운동</h3>
          <button onClick={goToToday} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            오늘로
          </button>
        </div>
        
        <DateSelector
          selectedDateFormatted={selectedDateFormatted}
          isToday={isToday}
          onPrev={() => handleDateChange('prev')}
          onNext={() => handleDateChange('next')}
        />

        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            {!schedule ? '일정이 없습니다' : (isToday ? '오늘은 휴식일입니다 💪' : '이 날은 휴식일입니다 💪')}
          </p>
        </div>
      </div>
    );
  }

  const log = calendarData.logs.get(selectedDate);
  const completedExercises = new Set(log?.completedExercises || []);
  const completedCount = completedExercises.size;
  const totalCount = selectedWorkout.exercises.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">일일 운동</h3>
        {!isToday && (
          <button onClick={goToToday} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            오늘로
          </button>
        )}
      </div>
      
      <DateSelector
        selectedDateFormatted={selectedDateFormatted}
        isToday={isToday}
        onPrev={() => handleDateChange('prev')}
        onNext={() => handleDateChange('next')}
      />

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">{selectedWorkout.name}</h4>
        <ProgressBar completedCount={completedCount} totalCount={totalCount} percentage={percentage} />

        {percentage === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="flex items-center">
              <CheckCircleIconSolid className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm font-medium">
                {isToday ? '오늘 운동을 완료했습니다! 🎉' : '이 날의 운동을 완료했습니다! 🎉'}
              </span>
            </div>
          </div>
        )}
      </div>

      <ExerciseList
        exercises={selectedWorkout.exercises}
        completedExercises={completedExercises}
        onToggle={(exerciseId) => onToggleExercise(selectedWorkout.id, exerciseId, selectedDate, totalCount)}
      />
    </div>
  );
};

// ============================================================================
// 공통 컴포넌트
// ============================================================================
const DateSelector = ({
  selectedDateFormatted,
  isToday,
  onPrev,
  onNext
}: {
  selectedDateFormatted: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
    <button onClick={onPrev} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">←</button>
    <div className="text-center">
      <p className="text-sm font-medium text-gray-900">{selectedDateFormatted}</p>
      {isToday && <p className="text-xs text-blue-600">오늘</p>}
    </div>
    <button onClick={onNext} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">→</button>
  </div>
);

const ProgressBar = ({ completedCount, totalCount, percentage }: { completedCount: number; totalCount: number; percentage: number }) => (
  <div className="mb-2">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-gray-600">진행률</span>
      <span className="text-sm font-medium text-blue-600">{completedCount}/{totalCount} ({percentage}%)</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

const ExerciseList = ({
  exercises,
  completedExercises,
  onToggle
}: {
  exercises: Exercise[];
  completedExercises: Set<string>;
  onToggle: (exerciseId: string) => void;
}) => (
  <div className="space-y-3">
    {exercises.map((exercise) => {
      const isCompleted = completedExercises.has(exercise.id);
      return (
        <div
          key={exercise.id}
          onClick={() => onToggle(exercise.id)}
          className={clsx(
            'flex items-center p-4 rounded-lg border cursor-pointer transition-all',
            isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="mr-4 flex-shrink-0">
            {isCompleted ? (
              <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
            ) : (
              <CheckCircleIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className={clsx('font-medium truncate', isCompleted ? 'text-green-800 line-through' : 'text-gray-900')}>
              {exercise.name}
            </h5>
            <p className={clsx('text-sm', isCompleted ? 'text-green-600' : 'text-gray-500')}>
              {exercise.sets}세트 × {exercise.reps}회
            </p>
          </div>
        </div>
      );
    })}
  </div>
);


// ============================================================================
// 주간 뷰
// ============================================================================
const WeekView = ({ 
  calendarData,
  selectedDate,
  onSelectDate,
  onToggleExercise,
  getWorkoutById
}: { 
  calendarData: CalendarData | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleExercise: ToggleExerciseHandler;
  getWorkoutById: (id: string | null) => WorkoutWithExercises | null;
}) => {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = selectedDateObj.getDay();
  const sunday = new Date(selectedDateObj);
  sunday.setDate(selectedDateObj.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    const dateStr = getLocalDateString(date);
    const schedule = calendarData?.schedules.get(dateStr);
    const log = calendarData?.logs.get(dateStr);
    
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      hasWorkout: schedule && !schedule.isRestDay,
      isCompleted: log?.isCompleted || false,
      completedCount: log?.completedExercises?.length || 0,
      isSunday: i === 0,
      isSaturday: i === 6
    };
  });

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate + 'T00:00:00');
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onSelectDate(getLocalDateString(newDate));
  };

  const goToThisWeek = () => onSelectDate(getLocalDateString());

  const weekRangeText = `${weekDays[0].dayNumber}일 - ${weekDays[6].dayNumber}일`;
  const monthText = new Date(sunday).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  if (!calendarData?.routine) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">주간 운동 계획</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">활성화된 루틴이 없습니다.</p>
        </div>
      </div>
    );
  }

  const schedule = calendarData.schedules.get(selectedDate);
  const selectedWorkout = schedule ? getWorkoutById(schedule.workoutId) : null;
  const selectedLog = calendarData.logs.get(selectedDate);
  const completedExercises = new Set(selectedLog?.completedExercises || []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">주간 운동 계획</h3>
          <button onClick={goToThisWeek} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            이번 주
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <button onClick={() => handleWeekChange('prev')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">←</button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{monthText}</p>
            <p className="text-xs text-gray-500">{weekRangeText}</p>
          </div>
          <button onClick={() => handleWeekChange('next')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={clsx(
                'p-2 rounded-lg border text-center transition-all',
                day.isSelected && 'border-blue-500 bg-blue-50',
                day.isToday && !day.isSelected && 'border-blue-300',
                !day.isSelected && !day.isToday && 'border-gray-200 hover:border-gray-300',
                day.hasWorkout && !day.isSelected && !day.isToday && 'bg-blue-50/50',
                !day.hasWorkout && !day.isSelected && !day.isToday && 'bg-gray-50'
              )}
            >
              <div className={clsx(
                'text-xs mb-1 font-medium',
                day.isSunday && 'text-red-500',
                day.isSaturday && 'text-blue-500',
                !day.isSunday && !day.isSaturday && 'text-gray-500'
              )}>{day.dayName}</div>
              
              <div className={clsx(
                'text-sm font-medium mb-1',
                day.isSelected && 'text-blue-600',
                day.isToday && !day.isSelected && 'text-blue-500',
                !day.isSelected && !day.isToday && day.isSunday && 'text-red-500',
                !day.isSelected && !day.isToday && day.isSaturday && 'text-blue-500',
                !day.isSelected && !day.isToday && !day.isSunday && !day.isSaturday && 'text-gray-900'
              )}>
                {day.dayNumber}
              </div>
              
              {day.hasWorkout ? (
                <div className="text-xs">
                  {day.completedCount > 0 ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-blue-400">●</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-300">휴식</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
            {selectedDate === todayStr && <span className="ml-2 text-blue-600 text-sm">(오늘)</span>}
          </h4>
        </div>

        {selectedWorkout ? (
          <>
            <h5 className="text-sm font-medium text-gray-700 mb-3">{selectedWorkout.name}</h5>
            <ExerciseList
              exercises={selectedWorkout.exercises}
              completedExercises={completedExercises}
              onToggle={(exerciseId) => onToggleExercise(selectedWorkout.id, exerciseId, selectedDate, selectedWorkout.exercises.length)}
            />
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">휴식일입니다 💪</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 월간 뷰
// ============================================================================
const MonthView = ({ 
  calendarData,
  onSelectDate,
}: { 
  calendarData: CalendarData | null;
  onSelectDate: (date: string) => void;
}) => {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const monthName = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const calendarDays: (null | {
    day: number;
    dateStr: string;
    isToday: boolean;
    hasWorkout: boolean;
    isCompleted: boolean;
    isSunday: boolean;
    isSaturday: boolean;
  })[] = [];
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    calendarDays.push(null);
  }
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = getLocalDateString(dateObj);
    const schedule = calendarData?.schedules.get(dateStr);
    const log = calendarData?.logs.get(dateStr);
    const dayOfWeek = dateObj.getDay();
    
    calendarDays.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      hasWorkout: schedule ? !schedule.isRestDay : false,
      isCompleted: log?.isCompleted || (log?.completedExercises?.length || 0) > 0,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6
    });
  }

  if (!calendarData?.routine) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">월간 운동 기록</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">활성화된 루틴이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-2">월간 운동 기록</h3>
      <p className="text-sm text-gray-500 mb-4">{monthName}</p>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={day} className={clsx(
            'text-center text-xs font-medium py-2',
            i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
          )}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => (
          <button
            key={index}
            onClick={() => item && onSelectDate(item.dateStr)}
            disabled={!item}
            className={clsx(
              'aspect-square flex flex-col items-center justify-center text-sm rounded transition-all',
              item?.isToday && 'bg-blue-100 font-medium',
              item && !item.isToday && item.hasWorkout && 'bg-blue-50/50 hover:bg-blue-100/50',
              item && !item.isToday && !item.hasWorkout && 'bg-gray-50 hover:bg-gray-100',
              !item && 'text-transparent cursor-default'
            )}
          >
            <span className={clsx(
              item?.isToday && 'text-blue-600',
              item && !item.isToday && item.isSunday && 'text-red-500',
              item && !item.isToday && item.isSaturday && 'text-blue-500',
              item && !item.isToday && !item.isSunday && !item.isSaturday && 'text-gray-700'
            )}>
              {item?.day || ''}
            </span>
            
            {item && (
              <span className="text-xs mt-0.5">
                {item.hasWorkout ? (
                  item.isCompleted ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-blue-400">●</span>
                  )
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-medium">✓</span>
          <span className="text-gray-600">완료</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">●</span>
          <span className="text-gray-600">운동일</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-300">-</span>
          <span className="text-gray-600">휴식</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-gray-600">오늘</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
