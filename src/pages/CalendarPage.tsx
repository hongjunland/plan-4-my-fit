import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import useAuth from '../hooks/useAuth';
import { routinesService, type RoutineWithDetails, type Exercise, type WorkoutWithExercises } from '../services/routines';
import { workoutLogService } from '../services/database';

interface WorkoutLog {
  date: string;
  workoutId: string;
  completedExercises: string[];
  isCompleted: boolean;
}

type ToggleExerciseHandler = (workoutId: string, exerciseId: string, date: string, totalExerciseCount: number) => void;

const CalendarPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [activeRoutine, setActiveRoutine] = useState<RoutineWithDetails | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<Map<string, WorkoutLog>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const tabs = [
    { key: 'today', label: '일일' },
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
  ] as const;

  // user.id를 안정적인 의존성으로 사용
  const userId = user?.id;

  // 초기 데이터 로드 (페이지 진입 시 한 번만)
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 캐시 무시하고 항상 최신 활성 루틴 가져오기
        const routine = await routinesService.getActiveRoutine(userId, false);
        setActiveRoutine(routine);
        
        if (routine) {
          // 이번 달 로그 로드
          const today = new Date();
          const logs = await workoutLogService.getMonthlyLogs(userId, today.getFullYear(), today.getMonth() + 1);
          const logsMap = new Map<string, WorkoutLog>();
          logs.forEach(log => {
            logsMap.set(log.date, {
              date: log.date,
              workoutId: log.workout_id,
              completedExercises: (log.completed_exercises as string[]) || [],
              isCompleted: log.is_completed
            });
          });
          setWorkoutLogs(logsMap);
        } else {
          setWorkoutLogs(new Map());
        }
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
    if (!userId || !activeRoutine) return;

    // 낙관적 업데이트
    setWorkoutLogs(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(date);
      const completedExercises = existing?.completedExercises || [];
      
      const newCompleted = completedExercises.includes(exerciseId)
        ? completedExercises.filter(id => id !== exerciseId)
        : [...completedExercises, exerciseId];
      
      // 100% 완료했을 때만 완료로 처리
      const isCompleted = newCompleted.length === totalExerciseCount && totalExerciseCount > 0;
      
      newMap.set(date, {
        date,
        workoutId,
        completedExercises: newCompleted,
        isCompleted
      });
      
      return newMap;
    });

    // DB 저장 (비동기)
    try {
      await workoutLogService.toggleExerciseCompletion(
        userId,
        activeRoutine.id,
        workoutId,
        exerciseId,
        date,
        totalExerciseCount
      );
    } catch {
      // 에러 시 롤백 (간단히 무시)
    }
  }, [userId, activeRoutine]);

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
          activeRoutine={activeRoutine}
          workoutLogs={workoutLogs}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onToggleExercise={handleToggleExercise}
        />
      )}
      {activeTab === 'week' && (
        <WeekView 
          activeRoutine={activeRoutine}
          workoutLogs={workoutLogs}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onToggleExercise={handleToggleExercise}
        />
      )}
      {activeTab === 'month' && (
        <MonthView 
          activeRoutine={activeRoutine}
          workoutLogs={workoutLogs}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveTab('today'); // 일일 뷰로 이동
          }}
        />
      )}
    </div>
  );
};

// 오늘의 운동 계산 함수
const getTodayWorkout = (routine: RoutineWithDetails, date: string): WorkoutWithExercises | null => {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  
  // 주말은 휴식
  if (dayOfWeek === 0 || dayOfWeek === 6) return null;
  if (routine.workouts.length === 0) return null;

  const routineStartDate = new Date(routine.createdAt);
  const daysDiff = Math.floor((targetDate.getTime() - routineStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return null;
  
  const workoutIndex = daysDiff % routine.workouts.length;
  return routine.workouts[workoutIndex] || null;
};

// 일일 뷰 (날짜 선택 가능)
const DailyView = ({ 
  activeRoutine,
  workoutLogs,
  selectedDate,
  onSelectDate,
  onToggleExercise
}: { 
  activeRoutine: RoutineWithDetails | null;
  workoutLogs: Map<string, WorkoutLog>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleExercise: ToggleExerciseHandler;
}) => {
  const today = new Date().toISOString().split('T')[0];
  const selectedDateObj = new Date(selectedDate);
  const isToday = selectedDate === today;
  
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 날짜 변경 핸들러
  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onSelectDate(newDate.toISOString().split('T')[0]);
  };

  // 오늘로 이동
  const goToToday = () => {
    onSelectDate(today);
  };

  if (!activeRoutine) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">일일 운동</h3>
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            오늘로
          </button>
        </div>
        
        {/* 날짜 선택기 */}
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => handleDateChange('prev')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{selectedDateFormatted}</p>
            {isToday && <p className="text-xs text-blue-600">오늘</p>}
          </div>
          <button
            onClick={() => handleDateChange('next')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

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

  const selectedWorkout = getTodayWorkout(activeRoutine, selectedDate);
  
  if (!selectedWorkout) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">일일 운동</h3>
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            오늘로
          </button>
        </div>
        
        {/* 날짜 선택기 */}
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => handleDateChange('prev')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{selectedDateFormatted}</p>
            {isToday && <p className="text-xs text-blue-600">오늘</p>}
          </div>
          <button
            onClick={() => handleDateChange('next')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            {isToday ? '오늘은 휴식일입니다 💪' : '이 날은 휴식일입니다 💪'}
          </p>
        </div>
      </div>
    );
  }

  const log = workoutLogs.get(selectedDate);
  const completedExercises = new Set(log?.completedExercises || []);
  const completedCount = completedExercises.size;
  const totalCount = selectedWorkout.exercises.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">일일 운동</h3>
        {!isToday && (
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            오늘로
          </button>
        )}
      </div>
      
      {/* 날짜 선택기 */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => handleDateChange('prev')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">{selectedDateFormatted}</p>
          {isToday && <p className="text-xs text-blue-600">오늘</p>}
        </div>
        <button
          onClick={() => handleDateChange('next')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">{selectedWorkout.name}</h4>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {completedCount}/{totalCount} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

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
        onToggle={(exerciseId) => onToggleExercise(selectedWorkout.id, exerciseId, selectedDate, selectedWorkout.exercises.length)}
      />
    </div>
  );
};

// 운동 리스트 컴포넌트
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
            isCompleted 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
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
            <h5 className={clsx(
              'font-medium truncate',
              isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
            )}>
              {exercise.name}
            </h5>
            <p className={clsx(
              'text-sm',
              isCompleted ? 'text-green-600' : 'text-gray-500'
            )}>
              {exercise.sets}세트 × {exercise.reps}회
            </p>
          </div>
        </div>
      );
    })}
  </div>
);

// 주간 뷰
const WeekView = ({ 
  activeRoutine,
  workoutLogs,
  selectedDate,
  onSelectDate,
  onToggleExercise
}: { 
  activeRoutine: RoutineWithDetails | null;
  workoutLogs: Map<string, WorkoutLog>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleExercise: ToggleExerciseHandler;
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // 이번 주 월~금 계산
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const log = workoutLogs.get(dateStr);
    
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      hasWorkout: activeRoutine ? getTodayWorkout(activeRoutine, dateStr) !== null : false,
      isCompleted: log?.isCompleted || false,
      completedCount: log?.completedExercises?.length || 0
    };
  });

  if (!activeRoutine) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">주간 운동 계획</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">활성화된 루틴이 없습니다.</p>
        </div>
      </div>
    );
  }

  const selectedWorkout = getTodayWorkout(activeRoutine, selectedDate);
  const selectedLog = workoutLogs.get(selectedDate);
  const completedExercises = new Set(selectedLog?.completedExercises || []);

  return (
    <div className="space-y-4">
      {/* 주간 날짜 선택 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">주간 운동 계획</h3>
        <div className="grid grid-cols-5 gap-2">
          {weekDays.map((day) => (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={clsx(
                'p-3 rounded-lg border text-center transition-all',
                day.isSelected && 'border-blue-500 bg-blue-50',
                day.isToday && !day.isSelected && 'border-blue-300',
                !day.isSelected && !day.isToday && 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="text-xs text-gray-500 mb-1">{day.dayName}</div>
              <div className={clsx(
                'text-sm font-medium mb-1',
                day.isSelected ? 'text-blue-600' : day.isToday ? 'text-blue-500' : 'text-gray-900'
              )}>
                {day.dayNumber}
              </div>
              {day.hasWorkout && (
                <div className="text-xs">
                  {day.completedCount > 0 ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-400">·</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 날짜의 운동 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
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

// 월간 뷰
const MonthView = ({ 
  activeRoutine,
  workoutLogs,
  onSelectDate
}: { 
  activeRoutine: RoutineWithDetails | null;
  workoutLogs: Map<string, WorkoutLog>;
  onSelectDate: (date: string) => void;
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const monthName = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 이번 달 달력 생성
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const calendarDays: (null | { day: number; dateStr: string; isToday: boolean; hasWorkout: boolean; isCompleted: boolean })[] = [];
  
  // 첫 주 빈 칸
  for (let i = 0; i < firstDay.getDay(); i++) {
    calendarDays.push(null);
  }
  
  // 날짜 채우기
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const log = workoutLogs.get(dateStr);
    const hasWorkout = activeRoutine ? getTodayWorkout(activeRoutine, dateStr) !== null : false;
    
    calendarDays.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      hasWorkout,
      isCompleted: log?.isCompleted || (log?.completedExercises?.length || 0) > 0
    });
  }

  if (!activeRoutine) {
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

      {/* 요일 헤더 */}
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

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => (
          <button
            key={index}
            onClick={() => item && onSelectDate(item.dateStr)}
            disabled={!item}
            className={clsx(
              'aspect-square flex flex-col items-center justify-center text-sm rounded transition-all',
              item?.isToday && 'bg-blue-100 text-blue-600 font-medium',
              item && !item.isToday && 'text-gray-700 hover:bg-gray-100',
              !item && 'text-transparent cursor-default'
            )}
          >
            <span>{item?.day || ''}</span>
            {item?.hasWorkout && (
              <span className="text-xs mt-0.5">
                {item.isCompleted ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-gray-300">·</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-green-600">✓</span>
          <span className="text-gray-600">완료</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">예정</span>
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
