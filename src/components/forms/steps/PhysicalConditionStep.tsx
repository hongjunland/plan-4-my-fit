import React from 'react';
import Button from '../../ui/Button';
import type { FitnessLevel, UncomfortableArea } from '../../../types';

interface PhysicalConditionData {
  fitnessLevel: FitnessLevel | '';
  uncomfortableAreas: UncomfortableArea[];
}

interface PhysicalConditionStepProps {
  data: PhysicalConditionData;
  onChange: (data: Partial<PhysicalConditionData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

const PhysicalConditionStep: React.FC<PhysicalConditionStepProps> = ({
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

  const isValid = data.fitnessLevel;

  const fitnessLevelOptions = [
    { 
      value: 'beginner', 
      label: '입문자', 
      icon: '🌱', 
      description: '운동을 거의 해본 적이 없어요' 
    },
    { 
      value: 'novice', 
      label: '초급자', 
      icon: '🚶', 
      description: '가끔 운동하지만 체계적이지 않아요' 
    },
    { 
      value: 'intermediate', 
      label: '중급자', 
      icon: '🏃', 
      description: '꾸준히 운동하고 기본기가 있어요' 
    },
    { 
      value: 'advanced', 
      label: '상급자', 
      icon: '💪', 
      description: '오랫동안 체계적으로 운동했어요' 
    }
  ];

  const uncomfortableAreaOptions = [
    { value: 'neck', label: '목', icon: '🦴' },
    { value: 'shoulder', label: '어깨', icon: '💪' },
    { value: 'back', label: '허리', icon: '🦴' },
    { value: 'knee', label: '무릎', icon: '🦵' },
    { value: 'ankle', label: '발목', icon: '🦶' },
    { value: 'wrist', label: '손목', icon: '✋' }
  ];

  const handleUncomfortableAreaToggle = (area: UncomfortableArea) => {
    const currentAreas = data.uncomfortableAreas || [];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    onChange({ uncomfortableAreas: newAreas });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          신체 조건을 알려주세요
        </h3>
        <p className="text-gray-600 mb-6">
          체력 수준과 불편한 부위를 고려한 안전한 루틴을 만들어드릴게요
        </p>
      </div>

      <div className="space-y-6">
        {/* Fitness Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            현재 체력 수준은 어느 정도인가요? *
          </label>
          <div className="space-y-2">
            {fitnessLevelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ fitnessLevel: option.value as FitnessLevel })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  data.fitnessLevel === option.value
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
          {errors.fitnessLevel && (
            <p className="text-red-500 text-xs mt-1">{errors.fitnessLevel}</p>
          )}
        </div>

        {/* Uncomfortable Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            불편하거나 조심해야 할 부위가 있나요? (선택사항)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            해당 부위에 무리가 가지 않는 운동으로 구성해드릴게요
          </p>
          <div className="grid grid-cols-3 gap-3">
            {uncomfortableAreaOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleUncomfortableAreaToggle(option.value as UncomfortableArea)}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${
                  data.uncomfortableAreas?.includes(option.value as UncomfortableArea)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
          {data.uncomfortableAreas && data.uncomfortableAreas.length === 0 && (
            <button
              type="button"
              onClick={() => onChange({ uncomfortableAreas: [] })}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              없음 (모든 부위 운동 가능)
            </button>
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

export default PhysicalConditionStep;