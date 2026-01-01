import React from 'react';
import type { MuscleGroupStats } from '../../services/progressStats';

interface MuscleGroupChartProps {
  muscleGroupStats: MuscleGroupStats[];
}

const MuscleGroupChart: React.FC<MuscleGroupChartProps> = ({ muscleGroupStats }) => {
  // 근육 그룹별 색상 매핑
  const muscleGroupColors: Record<string, string> = {
    chest: 'bg-red-500',
    back: 'bg-blue-500',
    shoulders: 'bg-orange-500',
    arms: 'bg-green-500',
    abs: 'bg-purple-500',
    legs: 'bg-yellow-500',
    full_body: 'bg-gray-500'
  };

  // 근육 그룹별 한글 이름
  const muscleGroupNames: Record<string, string> = {
    chest: '가슴',
    back: '등',
    shoulders: '어깨',
    arms: '팔',
    abs: '복근',
    legs: '하체',
    full_body: '전신'
  };

  if (muscleGroupStats.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">근육 그룹별 운동 빈도</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">운동 기록이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">운동을 완료하면 통계가 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">근육 그룹별 운동 빈도</h3>
      
      <div className="space-y-3">
        {muscleGroupStats.map((stat) => (
          <div key={stat.muscleGroup} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${muscleGroupColors[stat.muscleGroup] || 'bg-gray-400'}`}
                />
                <span className="text-sm font-medium text-gray-900">
                  {muscleGroupNames[stat.muscleGroup] || stat.muscleGroup}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{stat.frequency}회</span>
                <span className="text-sm font-medium text-gray-900">{stat.percentage}%</span>
              </div>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${muscleGroupColors[stat.muscleGroup] || 'bg-gray-400'}`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* 총 운동 횟수 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">총 운동 횟수</span>
          <span className="text-sm font-medium text-gray-900">
            {muscleGroupStats.reduce((total, stat) => total + stat.frequency, 0)}회
          </span>
        </div>
      </div>
    </div>
  );
};

export default MuscleGroupChart;