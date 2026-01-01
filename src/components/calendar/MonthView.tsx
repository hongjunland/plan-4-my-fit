import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import useWorkoutLogs from '../../hooks/useWorkoutLogs';
import type { RoutineWithDetails } from '../../services/routines';

interface MonthViewProps {
  className?: string;
  activeRoutine: RoutineWithDetails | null;
  error: string | null;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasWorkout: boolean;
  isCompleted: boolean;
  completionRate: number;
}

interface MonthlyStats {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  streakDays: number;
}

const MonthView = ({ className, activeRoutine, error }: MonthViewProps) => {
  const { user } = useAuth();
  const { getMonthlyLogs, getMonthlyStats } = useWorkoutLogs();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    completionRate: 0,
    streakDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 달력 날짜 생성
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 이번 달 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 달력 시작일 (이전 달의 마지막 주 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 달력 종료일 (다음 달의 첫 주 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      days.push({
        date: new Date(d),
        dateString,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: dateString === todayString,
        hasWorkout: false,
        isCompleted: false,
        completionRate: 0,
      });
    }
    
    return days;
  };

  // 월간 데이터 로드
  useEffect(() => {
    const loadMonthData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);

        // 달력 날짜 생성
        const days = generateCalendarDays(currentDate);
        
        if (!activeRoutine) {
          setCalendarDays(days);
          setMonthlyStats({
            totalWorkouts: 0,
            completedWorkouts: 0,
            completionRate: 0,
            streakDays: 0,
          });
          return;
        }

        // 월간 운동 기록 조회
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const monthlyLogs = await getMonthlyLogs(year, month);
        
        // 각 날짜별 운동 상태 계산
        const routineStartDate = new Date(activeRoutine.createdAt);
        const totalWorkouts = activeRoutine.workouts.length;
        
        for (const day of days) {
          if (!day.isCurrentMonth || totalWorkouts === 0) continue;
          
          // 루틴 시작일 기준으로 운동 계산
          const daysDiff = Math.floor((day.date.getTime() - routineStartDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // 주말 제외 (월~금만 운동)
          const dayOfWeek = day.date.getDay();
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          
          if (isWeekday && daysDiff >= 0) {
            day.hasWorkout = true;
            
            // 해당 날짜의 운동 기록 확인
            const dayLog = monthlyLogs.find(log => log.date === day.dateString);
            if (dayLog) {
              day.isCompleted = dayLog.is_completed;
              
              // 완료율 계산 (완료된 운동 수 / 전체 운동 수)
              const completedExercises = (dayLog.completed_exercises as string[]) || [];
              const workout = activeRoutine.workouts[daysDiff % totalWorkouts];
              if (workout) {
                day.completionRate = (completedExercises.length / workout.exercises.length) * 100;
              }
            }
          }
        }

        // 월간 통계 조회
        const stats = await getMonthlyStats(year, month);
        setMonthlyStats(stats);

        setCalendarDays(days);

      } catch (err) {
        // 월간 데이터 로드 실패는 조용히 처리
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthData();
  }, [activeRoutine, currentDate, user, getMonthlyLogs, getMonthlyStats]);

  // 이전 달
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 다음 달
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 이번 달로 이동
  const goToThisMonth = () => {
    setCurrentDate(new Date());
  };

  // 날짜 셀 렌더링
  const renderDayCell = (day: CalendarDay) => {
    let content = '';
    let bgColor = '';
    let textColor = day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400';
    
    if (!day.hasWorkout) {
      // 휴식일 또는 운동 없는 날
      content = '';
      bgColor = '';
    } else if (day.isCompleted) {
      // 완료된 운동
      content = '✅';
      bgColor = 'bg-green-100';
      textColor = day.isCurrentMonth ? 'text-green-800' : 'text-green-600';
    } else if (day.completionRate > 0) {
      // 부분 완료
      content = '·';
      bgColor = 'bg-yellow-100';
      textColor = day.isCurrentMonth ? 'text-yellow-800' : 'text-yellow-600';
    } else {
      // 예정된 운동
      content = '·';
      bgColor = 'bg-blue-100';
      textColor = day.isCurrentMonth ? 'text-blue-800' : 'text-blue-600';
    }

    return (
      <div
        key={day.dateString}
        className={clsx(
          'aspect-square flex flex-col items-center justify-center p-1 text-sm relative',
          bgColor,
          day.isToday && 'ring-2 ring-blue-500 ring-inset'
        )}
      >
        <span className={clsx('text-xs font-medium', textColor)}>
          {day.dayNumber}
        </span>
        {content && (
          <span className="text-lg leading-none mt-0.5">
            {content}
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-1 mb-6">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded"></div>
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
        <h3 className="font-semibold text-gray-900 mb-4">월간 운동 기록</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm leading-relaxed">
            활성화된 루틴이 없습니다.<br />
            루틴을 먼저 활성화해주세요!
          </p>
        </div>
      </div>
    );
  }

  const monthName = currentDate.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long' 
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">월간 운동 기록</h3>
          <p className="text-sm text-gray-500">{monthName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToThisMonth}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            이번 달
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 달력 */}
      <div className="mb-6">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="aspect-square flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {calendarDays.map(renderDayCell)}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mb-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-800">✅</span>
          </div>
          <span className="text-gray-600">완료</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-blue-800">·</span>
          </div>
          <span className="text-gray-600">예정</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">휴식</span>
        </div>
      </div>

      {/* 월간 통계 */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4">이번 달 통계</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {Math.round(monthlyStats.completionRate)}%
            </div>
            <div className="text-sm text-blue-800">완료율</div>
            <div className="text-xs text-blue-600 mt-1">
              {monthlyStats.completedWorkouts}/{monthlyStats.totalWorkouts} 완료
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {monthlyStats.streakDays}
            </div>
            <div className="text-sm text-green-800">연속 운동</div>
            <div className="text-xs text-green-600 mt-1">
              일 연속 달성
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">월간 목표 달성률</span>
            <span className="text-sm font-medium text-gray-900">
              {monthlyStats.completedWorkouts}/{monthlyStats.totalWorkouts}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${monthlyStats.completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;