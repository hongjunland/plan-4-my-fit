import React, { useEffect } from 'react';
import useProgressStats from '../hooks/useProgressStats';
import useWorkoutLogs from '../hooks/useWorkoutLogs';
import { useActiveRoutine } from '../hooks/queries/useRoutines';
import useAuth from '../hooks/useAuth';
import ProgressStats from '../components/progress/ProgressStats';
import MiniCalendar from '../components/progress/MiniCalendar';
import MuscleGroupChart from '../components/progress/MuscleGroupChart';

const ProgressPage = () => {
  const { user } = useAuth();
  const { 
    progressStats, 
    routineProgress, 
    motivationMessage, 
    isLoading, 
    error, 
    refreshStats 
  } = useProgressStats();
  
  const { getMonthlyLogs } = useWorkoutLogs();
  const { data: activeRoutine } = useActiveRoutine(user?.id);
  const [monthlyLogs, setMonthlyLogs] = React.useState<any[]>([]);

  // 현재 월의 운동 기록 가져오기 (활성 루틴 기준)
  useEffect(() => {
    const fetchMonthlyLogs = async () => {
      if (!activeRoutine) {
        setMonthlyLogs([]);
        return;
      }
      
      const now = new Date();
      const logs = await getMonthlyLogs(now.getFullYear(), now.getMonth() + 1);
      // 활성 루틴의 운동 기록만 필터링
      const filteredLogs = logs.filter(log => log.routine_id === activeRoutine.id);
      setMonthlyLogs(filteredLogs);
    };

    fetchMonthlyLogs();
  }, [getMonthlyLogs, activeRoutine]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <h3 className="font-semibold text-red-900">오류가 발생했습니다</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refreshStats}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!progressStats || !routineProgress) {
    return (
      <div className="p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">진행 상황이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            루틴을 활성화하고 운동을 시작하면 진행 상황을 확인할 수 있습니다
          </p>
          <button
            onClick={refreshStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 월간 캘린더 데이터 준비
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const workoutDates = monthlyLogs.map(log => log.date);
  const completedDates = monthlyLogs
    .filter(log => log.is_completed)
    .map(log => log.date);

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* 진행 상황 통계 */}
        <ProgressStats
          weeklyCompletionRate={progressStats.weekly.completionRate}
          routineCompletionRate={routineProgress.completionRate}
          streakDays={progressStats.streakDays}
          motivationMessage={motivationMessage}
        />
        
        {/* 이번 달 운동 기록 미니 캘린더 */}
        <MiniCalendar
          year={currentYear}
          month={currentMonth}
          workoutDates={workoutDates}
          completedDates={completedDates}
        />
        
        {/* 근육 그룹별 운동 빈도 */}
        <MuscleGroupChart muscleGroupStats={progressStats.muscleGroups} />
        
        {/* 상세 통계 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">상세 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressStats.monthly.workoutDays}
              </div>
              <div className="text-sm text-gray-600">이번 달 운동일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {routineProgress.remainingDays}
              </div>
              <div className="text-sm text-gray-600">남은 운동일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressStats.weekly.completedWorkouts}
              </div>
              <div className="text-sm text-gray-600">이번 주 완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progressStats.monthly.completedWorkouts}
              </div>
              <div className="text-sm text-gray-600">이번 달 완료</div>
            </div>
          </div>
        </div>
        
        {/* 새로고침 버튼 */}
        <div className="text-center">
          <button
            onClick={refreshStats}
            disabled={isLoading}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? '새로고침 중...' : '통계 새로고침'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;