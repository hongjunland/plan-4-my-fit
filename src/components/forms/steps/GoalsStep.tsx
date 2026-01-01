import React from 'react';
import Button from '../../ui/Button';
import type { Goal, Focus } from '../../../types';

interface GoalsData {
  goal: Goal | '';
  focus: Focus | '';
}

interface GoalsStepProps {
  data: GoalsData;
  onChange: (data: Partial<GoalsData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

const GoalsStep: React.FC<GoalsStepProps> = ({
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

  const isValid = data.goal && data.focus;

  const goalOptions = [
    { value: 'strength', label: '근력 증가', icon: '💪', description: '더 강해지고 싶어요' },
    { value: 'weight_loss', label: '체중 감량', icon: '⚖️', description: '살을 빼고 싶어요' },
    { value: 'endurance', label: '체력 향상', icon: '🏃', description: '지구력을 늘리고 싶어요' },
    { value: 'muscle_gain', label: '근육량 증가', icon: '🦵', description: '근육을 키우고 싶어요' },
    { value: 'body_correction', label: '체형 교정', icon: '🧘', description: '자세를 바르게 하고 싶어요' }
  ];

  const focusOptions = [
    { value: 'upper_body', label: '상체 중심', icon: '💪', description: '가슴, 등, 어깨, 팔' },
    { value: 'lower_body', label: '하체 중심', icon: '🦵', description: '허벅지, 엉덩이, 종아리' },
    { value: 'full_body', label: '전신 균형', icon: '🤸', description: '상체와 하체 고르게' },
    { value: 'core', label: '코어 강화', icon: '🧘', description: '복근과 허리 중심' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          운동 목표를 설정해주세요
        </h3>
        <p className="text-gray-600 mb-6">
          목표에 맞는 운동 강도와 종목을 추천해드릴게요
        </p>
      </div>

      <div className="space-y-6">
        {/* Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            주요 운동 목표는 무엇인가요? *
          </label>
          <div className="space-y-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ goal: option.value as Goal })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  data.goal === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.goal && (
            <p className="text-red-500 text-xs mt-1">{errors.goal}</p>
          )}
        </div>

        {/* Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            어느 부위에 집중하고 싶으신가요? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {focusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ focus: option.value as Focus })}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  data.focus === option.value
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
          {errors.focus && (
            <p className="text-red-500 text-xs mt-1">{errors.focus}</p>
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

export default GoalsStep;