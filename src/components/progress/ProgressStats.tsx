import React from 'react';
import { ProgressBar } from '../ui';

interface ProgressStatsProps {
  weeklyCompletionRate: number;
  routineCompletionRate: number;
  streakDays: number;
  motivationMessage: string;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  weeklyCompletionRate,
  routineCompletionRate,
  streakDays,
  motivationMessage
}) => {
  return (
    <div className="space-y-4">
      {/* 동기부여 메시지 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">{motivationMessage}</p>
        </div>
      </div>

      {/* 이번 주 완료율 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">이번 주 완료율</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">진행률</span>
            <span className="text-sm font-medium text-gray-900">{weeklyCompletionRate}%</span>
          </div>
          <ProgressBar 
            value={weeklyCompletionRate} 
            className="h-3"
            color="primary"
          />
        </div>
      </div>
      
      {/* 전체 루틴 진행률 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">전체 루틴 진행률</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">완료율</span>
            <span className="text-sm font-medium text-gray-900">{routineCompletionRate}%</span>
          </div>
          <ProgressBar 
            value={routineCompletionRate} 
            className="h-3"
            color="success"
          />
        </div>
      </div>
      
      {/* 연속 운동 일수 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">연속 운동 일수</h3>
        <div className="flex items-center space-x-2">
          <div className="text-3xl font-bold text-blue-600">{streakDays}</div>
          <div className="text-lg text-gray-600">일</div>
          {streakDays > 0 && (
            <div className="text-2xl">🔥</div>
          )}
        </div>
        {streakDays >= 7 && (
          <p className="text-sm text-gray-500 mt-2">
            일주일 연속 달성! 👏
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressStats;