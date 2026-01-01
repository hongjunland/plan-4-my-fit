import React from 'react';
import Button from '../../ui/Button';

interface PlanDurationData {
  planDuration: number | '';
}

interface PlanDurationStepProps {
  data: PlanDurationData;
  onChange: (data: Partial<PlanDurationData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
  isLoading?: boolean;
}

const PlanDurationStep: React.FC<PlanDurationStepProps> = ({
  data,
  onChange,
  onNext,
  onBack,
  errors = {},
  isLoading = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const isValid = data.planDuration;

  const durationOptions = [
    { 
      value: 4, 
      label: '4주', 
      icon: '🌱', 
      description: '짧고 집중적으로',
      subtitle: '빠른 변화를 원한다면'
    },
    { 
      value: 8, 
      label: '8주', 
      icon: '🌿', 
      description: '적당한 기간으로',
      subtitle: '꾸준한 발전을 위해'
    },
    { 
      value: 12, 
      label: '12주', 
      icon: '🌳', 
      description: '체계적이고 안정적으로',
      subtitle: '확실한 변화를 위해'
    },
    { 
      value: 16, 
      label: '16주', 
      icon: '🏆', 
      description: '장기적이고 지속적으로',
      subtitle: '완전한 변화를 위해'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          플랜 기간을 설정해주세요
        </h3>
        <p className="text-gray-600 mb-6">
          목표 달성을 위한 최적의 기간을 선택해주세요
        </p>
      </div>

      <div className="space-y-6">
        {/* Plan Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            몇 주 동안 운동하실 계획인가요? *
          </label>
          <div className="space-y-3">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ planDuration: option.value })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  data.planDuration === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-lg">{option.label}</span>
                      <span className="text-sm text-gray-600">{option.description}</span>
                    </div>
                    <div className="text-sm text-gray-500">{option.subtitle}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.planDuration && (
            <p className="text-red-500 text-xs mt-1">{errors.planDuration}</p>
          )}
        </div>

        {/* Summary */}
        {data.planDuration && (
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              🎯 선택하신 플랜
            </h4>
            <p className="text-blue-800 text-sm">
              <strong>{data.planDuration}주 동안</strong> 체계적인 운동 루틴을 진행하게 됩니다.
              {data.planDuration <= 8 
                ? ' 집중적인 단기 플랜으로 빠른 변화를 경험할 수 있어요!'
                : ' 충분한 기간으로 안정적이고 지속적인 변화를 만들어갈 수 있어요!'
              }
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isLoading}
          >
            이전
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              프로필 저장 중...
            </div>
          ) : (
            '프로필 완성'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PlanDurationStep;