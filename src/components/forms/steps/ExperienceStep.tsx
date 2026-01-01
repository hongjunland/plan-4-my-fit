import React from 'react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import type { ExperienceLevel, ExerciseHistory } from '../../../types';

interface ExperienceData {
  experienceLevel: ExperienceLevel | '';
  exerciseHistory: ExerciseHistory[];
}

interface ExperienceStepProps {
  data: ExperienceData;
  onChange: (data: Partial<ExperienceData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({
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

  const isValid = data.experienceLevel;

  const experienceLevelOptions = [
    { 
      value: 'none', 
      label: '없음', 
      icon: '🌱', 
      description: '운동 경험이 거의 없어요' 
    },
    { 
      value: 'under_6months', 
      label: '6개월 미만', 
      icon: '🚶', 
      description: '운동을 시작한 지 얼마 안 돼요' 
    },
    { 
      value: '6months_1year', 
      label: '6개월~1년', 
      icon: '🏃', 
      description: '기본적인 운동은 할 수 있어요' 
    },
    { 
      value: '1year_3years', 
      label: '1년~3년', 
      icon: '💪', 
      description: '꾸준히 운동하고 있어요' 
    },
    { 
      value: 'over_3years', 
      label: '3년 이상', 
      icon: '🏆', 
      description: '오랫동안 운동해왔어요' 
    }
  ];

  const commonExercises = [
    '벤치프레스',
    '스쿼트',
    '데드리프트',
    '오버헤드프레스',
    '바벨로우',
    '풀업/턱걸이',
    '딥스'
  ];

  const showExerciseHistory = data.experienceLevel && data.experienceLevel !== 'none';

  const handleExerciseHistoryChange = (index: number, field: keyof ExerciseHistory, value: string | number) => {
    const newHistory = [...(data.exerciseHistory || [])];
    if (!newHistory[index]) {
      newHistory[index] = { exerciseName: '', maxWeight: 0, reps: 0 };
    }
    newHistory[index] = { ...newHistory[index], [field]: value };
    onChange({ exerciseHistory: newHistory });
  };

  const addExerciseHistory = () => {
    const newHistory = [...(data.exerciseHistory || []), { exerciseName: '', maxWeight: 0, reps: 0 }];
    onChange({ exerciseHistory: newHistory });
  };

  const removeExerciseHistory = (index: number) => {
    const newHistory = data.exerciseHistory?.filter((_, i) => i !== index) || [];
    onChange({ exerciseHistory: newHistory });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          운동 경력을 알려주세요
        </h3>
        <p className="text-gray-600 mb-6">
          경험에 맞는 적절한 강도의 운동을 추천해드릴게요
        </p>
      </div>

      <div className="space-y-6">
        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            운동 경력이 어느 정도인가요? *
          </label>
          <div className="space-y-2">
            {experienceLevelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ 
                  experienceLevel: option.value as ExperienceLevel,
                  exerciseHistory: option.value === 'none' ? [] : data.exerciseHistory
                })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  data.experienceLevel === option.value
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
          {errors.experienceLevel && (
            <p className="text-red-500 text-xs mt-1">{errors.experienceLevel}</p>
          )}
        </div>

        {/* Exercise History */}
        {showExerciseHistory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              주요 운동 기록 (선택사항)
            </label>
            <p className="text-sm text-gray-500 mb-4">
              현재 할 수 있는 최대 중량을 입력해주세요. 더 정확한 루틴을 만들어드릴게요.
            </p>
            
            <div className="space-y-4">
              {data.exerciseHistory?.map((exercise, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">운동 기록 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExerciseHistory(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">운동명</label>
                      <select
                        value={exercise.exerciseName}
                        onChange={(e) => handleExerciseHistoryChange(index, 'exerciseName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">운동을 선택하세요</option>
                        {commonExercises.map(ex => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    
                    {exercise.exerciseName === '기타' && (
                      <div>
                        <Input
                          placeholder="운동명을 직접 입력하세요"
                          value={exercise.exerciseName === '기타' ? '' : exercise.exerciseName}
                          onChange={(e) => handleExerciseHistoryChange(index, 'exerciseName', e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">최대 중량 (kg)</label>
                        <Input
                          type="number"
                          placeholder="예: 60"
                          value={exercise.maxWeight || ''}
                          onChange={(e) => handleExerciseHistoryChange(index, 'maxWeight', parseInt(e.target.value) || 0)}
                          min={0}
                          max={1000}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">반복 횟수</label>
                        <Input
                          type="number"
                          placeholder="예: 8"
                          value={exercise.reps || ''}
                          onChange={(e) => handleExerciseHistoryChange(index, 'reps', parseInt(e.target.value) || 0)}
                          min={1}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addExerciseHistory}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + 운동 기록 추가
              </button>
            </div>
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

export default ExperienceStep;