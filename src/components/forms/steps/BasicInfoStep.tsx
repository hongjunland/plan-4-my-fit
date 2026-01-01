import React from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface BasicInfoData {
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  height: number | '';
  weight: number | '';
}

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (data: Partial<BasicInfoData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
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

  const isValid = data.age && data.gender && data.height && data.weight;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          기본 정보를 입력해주세요
        </h3>
        <p className="text-gray-600 mb-6">
          정확한 정보를 입력하면 더 맞춤형 루틴을 받을 수 있어요
        </p>
      </div>

      <div className="space-y-4">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연령 *
          </label>
          <Input
            type="number"
            placeholder="예: 25"
            value={data.age}
            onChange={(e) => onChange({ age: e.target.value ? parseInt(e.target.value) : '' })}
            error={errors.age}
            min={15}
            max={80}
          />
          <p className="text-xs text-gray-500 mt-1">15세 ~ 80세</p>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성별 *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: '남성' },
              { value: 'female', label: '여성' },
              { value: 'other', label: '기타' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ gender: option.value as any })}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  data.gender === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
          )}
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키 (cm) *
          </label>
          <Input
            type="number"
            placeholder="예: 170"
            value={data.height}
            onChange={(e) => onChange({ height: e.target.value ? parseInt(e.target.value) : '' })}
            error={errors.height}
            min={100}
            max={250}
          />
          <p className="text-xs text-gray-500 mt-1">100cm ~ 250cm</p>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            몸무게 (kg) *
          </label>
          <Input
            type="number"
            placeholder="예: 70"
            value={data.weight}
            onChange={(e) => onChange({ weight: e.target.value ? parseInt(e.target.value) : '' })}
            error={errors.weight}
            min={30}
            max={300}
          />
          <p className="text-xs text-gray-500 mt-1">30kg ~ 300kg</p>
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

export default BasicInfoStep;