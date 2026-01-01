import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import useAuth from '../../hooks/useAuth';
import useWorkoutLogs from '../../hooks/useWorkoutLogs';
import type { RoutineWithDetails, WorkoutWithExercises } from '../../services/routines';

interface WeekViewProps {
  className?: string;
  activeRoutine: RoutineWithDetails | null;
  error: string | null;
}

interface DayInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  workout: WorkoutWithExercises | null;
  isCompleted: boolean;
  completionRate: number;
}

const WeekView = ({ className, activeRoutine, error }: WeekViewProps) => {
  const { user } = useAuth();
  const { getWeeklyLogs, getWorkoutProgress } = useWorkoutLogs();
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 주의 시작일 계산 (월요일 기준)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 1
    return new Date(d.setDate(diff));
  }

  // 주간 데이터 로드
  useEffect(() => {
    const loadWeekData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);

        // 주간 날짜 생성 (월~금)
        const days: DayInfo[] = [];
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        for (let i = 0; i < 5; i++) { // 월~금 (5일)
          const date = new Date(currentWeekStart);
          date.setDate(currentWeekStart.getDate() + i);
          const dateString = date.toISOString().split('T')[0];
          
          let workout: WorkoutWithExercises | null = null;
          
          if (activeRoutine && activeRoutine.workouts.length > 0) {
            // 루틴 시작일 기준으로 운동 계산
            const routineStartDate = new Date(activeRoutine.createdAt);
            const daysDiff = Math.floor((date.getTime() - routineStartDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // 오늘의 운동 결정 (순환 방식)
            const totalWorkouts = activeRoutine.workouts.length;
            workout = activeRoutine.workouts[daysDiff % totalWorkouts];
          }

          days.push({
            date: dateString,
            dayName: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
            dayNumber: date.getDate(),
            isToday: dateString === todayString,
            workout,
            isCompleted: false,
            completionRate: 0,
          });
        }

        // 주간 운동 기록 조회
        if (activeRoutine) {
          const weekStartString = currentWeekStart.toISOString().split('T')[0];
          await getWeeklyLogs(weekStartString);

          // 각 날짜별 완료 상태 업데이트
          for (const day of days) {
            if (day.workout) {
              const progress = await getWorkoutProgress(activeRoutine.id, day.workout.id, day.date);
              day.isCompleted = progress.isCompleted;
              day.completionRate = progress.percentage;
            }
          }
        }

        setWeekDays(days);
        
        // 오늘 날짜가 있으면 선택, 없으면 첫 번째 운동일 선택
        const todayDay = days.find(day => day.isToday);
        const firstWorkoutDay = days.find(day => day.workout);
        setSelectedDay(todayDay || firstWorkoutDay || days[0]);

      } catch (err) {
        // 주간 데이터 로드 실패는 조용히 처리
      } finally {
        setIsLoading(false);
      }
    };

    loadWeekData();
  }, [activeRoutine, currentWeekStart, user, getWeeklyLogs, getWorkoutProgress]);

  // 이전 주
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  // 다음 주
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  // 오늘 주로 이동
  const goToThisWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // 운동 상태 아이콘
  const getWorkoutStatusIcon = (day: DayInfo) => {
    if (!day.workout) {
      return <div className="w-6 h-6 rounded-full bg-gray-100"></div>; // 휴식일
    }
    
    if (day.isCompleted) {
      return <CheckCircleIconSolid className="w-6 h-6 text-green-600" />; // 완료
    }
    
    if (day.completionRate > 0) {
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        </div>
      ); // 부분 완료
    }
    
    return (
      <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
      </div>
    ); // 예정
  };

  // 근육 그룹 색상 매핑
  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = {
      chest: 'bg-red-100 text-red-800',
      back: 'bg-blue-100 text-blue-800',
      shoulders: 'bg-orange-100 text-orange-800',
      arms: 'bg-green-100 text-green-800',
      abs: 'bg-purple-100 text-purple-800',
      legs: 'bg-yellow-100 text-yellow-800',
      full_body: 'bg-gray-100 text-gray-800',
    };
    return colors[muscleGroup as keyof typeof colors] || colors.full_body;
  };

  // 근육 그룹 한글 이름
  const getMuscleGroupName = (muscleGroup: string) => {
    const names = {
      chest: '가슴',
      back: '등',
      shoulders: '어깨',
      arms: '팔',
      abs: '복근',
      legs: '하체',
      full_body: '전신',
    };
    return names[muscleGroup as keyof typeof names] || '전신';
  };

  if (isLoading) {
    return (
      <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!activeRoutine) {
    return (
      <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
        <h3 className="font-semibold text-gray-900 mb-4">주간 운동 계획</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm leading-relaxed">
            활성화된 루틴이 없습니다.<br />
            루틴을 먼저 활성화해주세요!
          </p>
        </div>
      </div>
    );
  }

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(currentWeekStart.getDate() + 4); // 금요일

  return (
    <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">주간 운동 계획</h3>
          <p className="text-sm text-gray-500">
            {currentWeekStart.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} - {' '}
            {weekEndDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToThisWeek}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            이번 주
          </button>
          
          <button
            onClick={goToNextWeek}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 주간 그리드 */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {weekDays.map((day) => (
          <button
            key={day.date}
            onClick={() => setSelectedDay(day)}
            className={clsx(
              'p-3 rounded-lg border transition-all duration-200 text-center',
              selectedDay?.date === day.date
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              day.isToday && 'ring-2 ring-blue-200'
            )}
          >
            <div className="text-xs text-gray-500 mb-1">{day.dayName}</div>
            <div className={clsx(
              'text-sm font-medium mb-2',
              day.isToday ? 'text-blue-600' : 'text-gray-900'
            )}>
              {day.dayNumber}
            </div>
            <div className="flex justify-center">
              {getWorkoutStatusIcon(day)}
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 날짜의 운동 목록 */}
      {selectedDay && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {selectedDay.dayName} ({selectedDay.dayNumber}일) 운동
            </h4>
            {selectedDay.workout && selectedDay.completionRate > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {Math.round(selectedDay.completionRate)}% 완료
              </span>
            )}
          </div>

          {selectedDay.workout ? (
            <div className="space-y-3">
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 mb-2">{selectedDay.workout.name}</h5>
                {selectedDay.isCompleted && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ 완료
                  </div>
                )}
              </div>
              
              {selectedDay.workout.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h6 className="font-medium text-gray-900 truncate">
                        {exercise.name}
                      </h6>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getMuscleGroupColor(exercise.muscleGroup)
                      )}>
                        {getMuscleGroupName(exercise.muscleGroup)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {exercise.sets}세트 × {exercise.reps}회
                    </p>
                    {exercise.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">😴</div>
              <p className="text-gray-500 text-sm">
                오늘은 휴식일입니다
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeekView;