import { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import useAuth from '../../hooks/useAuth';
import useWorkoutLogs from '../../hooks/useWorkoutLogs';
import type { RoutineWithDetails, WorkoutWithExercises, Exercise } from '../../services/routines';

interface TodayViewProps {
  className?: string;
  activeRoutine: RoutineWithDetails | null;
  error: string | null;
}

const TodayView = ({ className, activeRoutine, error }: TodayViewProps) => {
  const { user } = useAuth();
  const { toggleExerciseCompletion, getWorkoutProgress, isExerciseCompleted } = useWorkoutLogs();
  
  const [todayWorkout, setTodayWorkout] = useState<WorkoutWithExercises | null>(null);
  const [progress, setProgress] = useState({ completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false });
  const [isLoading, setIsLoading] = useState(true);

  // today를 useMemo로 메모이제이션하여 매번 새로 생성되지 않도록 함
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const todayFormatted = useMemo(() => new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }), []);

  // 오늘의 운동 계산 (activeRoutine이 변경될 때만)
  useEffect(() => {
    const calculateTodayWorkout = async () => {
      try {
        setIsLoading(true);

        if (!activeRoutine) {
          setTodayWorkout(null);
          setProgress({ completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false });
          return;
        }

        // 오늘의 운동 계산 (루틴 시작일 기준으로 Day N 계산)
        const routineStartDate = new Date(activeRoutine.createdAt);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - routineStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // 총 운동 수
        const totalWorkouts = activeRoutine.workouts.length;
        
        if (totalWorkouts === 0) {
          setTodayWorkout(null);
          setProgress({ completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false });
          return;
        }

        // 오늘이 운동일인지 확인 (간단한 로직: 주 5일 기준으로 월~금만 운동)
        const dayOfWeek = currentDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // 월~금
        
        if (!isWeekday) {
          setTodayWorkout(null);
          setProgress({ completedCount: 0, totalCount: 0, percentage: 0, isCompleted: false });
          return;
        }

        // 오늘의 운동 결정 (순환 방식)
        const workoutIndex = daysDiff % totalWorkouts;
        const workout = activeRoutine.workouts[workoutIndex];
        setTodayWorkout(workout);

        // 진행률 조회 (비동기)
        if (workout && user) {
          try {
            const workoutProgress = await getWorkoutProgress(activeRoutine.id, workout.id, today);
            setProgress(workoutProgress);
          } catch (err) {
            // 진행률 조회 실패는 무시 (기본값 유지)
          }
        }

      } catch (err) {
        // 오늘의 운동 계산 실패는 무시
      } finally {
        setIsLoading(false);
      }
    };

    calculateTodayWorkout();
  }, [activeRoutine, user, today, getWorkoutProgress]); // 안정적인 의존성만 포함

  // 운동 완료 토글
  const handleExerciseToggle = async (exercise: Exercise) => {
    if (!activeRoutine || !todayWorkout || !user) return;

    try {
      await toggleExerciseCompletion(
        activeRoutine.id, 
        todayWorkout.id, 
        exercise.id, 
        today,
        todayWorkout.exercises.length // 전체 운동 개수 전달
      );
      
      // 진행률 업데이트
      const updatedProgress = await getWorkoutProgress(activeRoutine.id, todayWorkout.id, today);
      setProgress(updatedProgress);
    } catch (err) {
      // 에러 처리는 조용히
    }
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
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
        <h3 className="font-semibold text-gray-900 mb-4">일일 운동</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            활성화된 루틴이 없습니다.<br />
            루틴을 먼저 활성화해주세요!
          </p>
        </div>
      </div>
    );
  }

  if (!todayWorkout) {
    return (
      <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
        <h3 className="font-semibold text-gray-900 mb-4">일일 운동</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            오늘은 휴식일입니다.<br />
            내일 다시 운동해요! 💪
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-xl p-6 shadow-sm', className)}>
      {/* 헤더 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-1">일일 운동</h3>
        <p className="text-sm text-gray-500">{todayFormatted}</p>
      </div>

      {/* 운동 이름과 진행률 */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">{todayWorkout.name}</h4>
        
        {/* 진행률 바 */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {progress.completedCount}/{progress.totalCount} ({Math.round(progress.percentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 완료 메시지 */}
        {progress.isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="flex items-center">
              <CheckCircleIconSolid className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm font-medium">
                오늘 운동을 완료했습니다! 🎉
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 운동 목록 */}
      <div className="space-y-3">
        {todayWorkout.exercises.map((exercise) => {
          const isCompleted = isExerciseCompleted(activeRoutine.id, todayWorkout.id, exercise.id, today);
          
          return (
            <div
              key={exercise.id}
              className={clsx(
                'flex items-center p-4 rounded-lg border transition-all duration-200',
                isCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              )}
            >
              {/* 체크박스 */}
              <button
                onClick={() => handleExerciseToggle(exercise)}
                className="mr-4 flex-shrink-0"
              >
                {isCompleted ? (
                  <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                )}
              </button>

              {/* 운동 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className={clsx(
                    'font-medium truncate',
                    isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                  )}>
                    {exercise.name}
                  </h5>
                  <span className={clsx(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getMuscleGroupColor(exercise.muscleGroup)
                  )}>
                    {getMuscleGroupName(exercise.muscleGroup)}
                  </span>
                </div>
                <p className={clsx(
                  'text-sm',
                  isCompleted ? 'text-green-600' : 'text-gray-500'
                )}>
                  {exercise.sets}세트 × {exercise.reps}회
                </p>
                {exercise.description && (
                  <p className={clsx(
                    'text-xs mt-1',
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  )}>
                    {exercise.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodayView;