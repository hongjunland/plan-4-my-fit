import React from 'react';
import Button from '../../ui/Button';
import type { WorkoutLocation } from '../../../types';

interface WorkoutEnvironmentData {
  workoutLocation: WorkoutLocation | '';
  weeklyWorkouts: number | '';
}

interface WorkoutEnvironmentStepProps {
  data: WorkoutEnvironmentData;
  onChange: (data: Partial<WorkoutEnvironmentData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

const WorkoutEnvironmentStep: React.FC<WorkoutEnvironmentStepProps> = ({
  data,
  onChange,
  onNext,
  onBack,
  errors = {}
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const isValid = data.workoutLocation && data.weeklyWorkouts;

  const locationOptions = [
    { value: 'gym', label: '헬스장', icon: '🏋️', description: '다양한 기구 사용 가능' },
    { value: 'home', label: '홈트레이닝', icon: '🏠', description: '집에서 편리하게' },
    { value: 'outdoor', label: '야외운동', icon: '🌳', description: '공원이나 야외에서' },
    { value: 'mixed', label: '복합', icon: '🔄', description: '상황에 따라 다양하게' }
  ];

  const weeklyOptions = [
    { value: 1, label: '1회', description: '가볍게 시작' },
    { value: 2, label: '2회', description: '꾸준히 기본' },
    { value: 3, label: '3회', description: '적당한 강도' },
    { value: 4, label: '4회', description: '활발한 운동' },
    { value: 5, label: '5회', description: '높은 강도' },
    { value: 6, label: '6회', description: '매우 활발' },
    { value: 7, label: '7회', description: '매일 운동' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          운동 환경을 알려주세요
        </h3>
        <p className="text-gray-600 mb-6">
          운동 장소와 횟수에 맞는 루틴을 추천해드릴게요
        </p>
      </div>

      <div className="space-y-6">
        {/* Workout Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            주로 어디서 운동하시나요? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {locationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ workoutLocation: option.value as WorkoutLocation })}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  data.workoutLocation === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
          {errors.workoutLocation && (
            <p className="text-red-500 text-xs mt-1">{errors.workoutLocation}</p>
          )}
        </div>

        {/* Weekly Workouts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            주당 몇 회 운동하실 계획인가요? *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {weeklyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ weeklyWorkouts: option.value })}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  data.weeklyWorkouts === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
          {errors.weeklyWorkouts && (
            <p className="text-red-500 text-xs mt-1">{errors.weeklyWorkouts}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            이전
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid}
          className="flex-1"
        >
          다음
        </Button>
      </div>
    </form>
  );
};

export default WorkoutEnvironmentStep;