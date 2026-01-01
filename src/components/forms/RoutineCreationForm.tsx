import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { aiService, AIServiceError } from '../../services/ai';
import { useAuthStore } from '../../stores/authStore';
import { useProfile } from '../../hooks/queries/useAuth';
import { useRoutineStore } from '../../stores/routineStore';
import { ROUTES } from '../../constants';
import type { RoutineSettings, SplitType } from '../../types';

interface RoutineFormData {
  durationWeeks: number;
  workoutsPerWeek: number;
  splitType: SplitType;
  additionalRequest: string;
}

const RoutineCreationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: profile } = useProfile(user?.id);
  const { addRoutine } = useRoutineStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RoutineFormData>({
    defaultValues: {
      durationWeeks: 4,
      workoutsPerWeek: 3,
      splitType: 'upper_lower',
      additionalRequest: ''
    }
  });

  const workoutsPerWeek = watch('workoutsPerWeek');

  // 주당 운동 횟수에 따른 분할 방식 추천
  const getRecommendedSplit = (workouts: number): SplitType => {
    if (workouts <= 2) return 'full_body';
    if (workouts <= 4) return 'upper_lower';
    return 'push_pull_legs';
  };

  const splitOptions = [
    {
      value: 'full_body' as SplitType,
      label: '전신',
      description: '한 번에 전신을 운동',
      recommended: workoutsPerWeek <= 2
    },
    {
      value: 'upper_lower' as SplitType,
      label: '상체/하체',
      description: '상체와 하체를 번갈아 운동',
      recommended: workoutsPerWeek >= 3 && workoutsPerWeek <= 4
    },
    {
      value: 'push_pull_legs' as SplitType,
      label: '푸쉬/풀/레그',
      description: '밀기/당기기/다리로 분할',
      recommended: workoutsPerWeek >= 5
    }
  ];

  const handleRetry = (formData: RoutineFormData) => {
    setRetryCount(prev => prev + 1);
    setError(null);
    onSubmit(formData);
  };

  const onSubmit = async (data: RoutineFormData) => {
    if (!user || !profile) {
      toast.error('프로필 정보를 먼저 설정해주세요.');
      navigate(ROUTES.PROFILE_SETUP);
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const settings: RoutineSettings = {
        durationWeeks: data.durationWeeks,
        workoutsPerWeek: data.workoutsPerWeek,
        splitType: data.splitType,
        additionalRequest: data.additionalRequest.trim() || undefined
      };

      // AI 루틴 생성
      const routine = await aiService.generateRoutine(profile, settings);
      
      // 루틴 저장
      await addRoutine(routine);
      
      toast.success('AI 루틴이 성공적으로 생성되었습니다!');
      navigate(ROUTES.ROUTINES);
      
    } catch (error) {
      console.error('루틴 생성 오류:', error);
      
      if (error instanceof AIServiceError) {
        setError(error.message);
        
        // 특정 에러에 대한 추가 안내
        switch (error.code) {
          case 'MISSING_API_KEY':
          case 'INVALID_API_KEY':
            toast.error('서비스 설정에 문제가 있습니다. 관리자에게 문의하세요.');
            break;
          case 'RATE_LIMIT_EXCEEDED':
            toast.error('잠시 후 다시 시도해주세요.');
            break;
          case 'NETWORK_ERROR':
            toast.error('인터넷 연결을 확인해주세요.');
            break;
          default:
            toast.error(error.message);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : '루틴 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 에러 메시지 표시 */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">루틴 생성 실패</h4>
                <p className="text-sm text-red-700">{error}</p>
                {retryCount > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    재시도 횟수: {retryCount}/3
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRetry(watch())}
              disabled={isGenerating || retryCount >= 3}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* 루틴 기간 설정 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">루틴 기간</h3>
          <div className="grid grid-cols-2 gap-3">
            {[2, 4, 6, 8, 12].map((weeks) => (
              <label key={weeks} className="relative">
                <input
                  type="radio"
                  value={weeks}
                  {...register('durationWeeks', { required: '루틴 기간을 선택해주세요' })}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 border-gray-200 rounded-2xl cursor-pointer transition-all peer-checked:border-primary-400 peer-checked:bg-primary-50 hover:border-gray-300">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{weeks}주</div>
                    <div className="text-sm text-gray-600">
                      {weeks <= 4 ? '단기' : weeks <= 8 ? '중기' : '장기'}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.durationWeeks && (
            <p className="text-sm text-error-500">{errors.durationWeeks.message}</p>
          )}
        </div>
      </Card>

      {/* 주당 운동 횟수 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">주당 운동 횟수</h3>
          <div className="grid grid-cols-3 gap-3">
            {[2, 3, 4, 5, 6].map((count) => (
              <label key={count} className="relative">
                <input
                  type="radio"
                  value={count}
                  {...register('workoutsPerWeek', { required: '주당 운동 횟수를 선택해주세요' })}
                  className="sr-only peer"
                />
                <div className="p-3 border-2 border-gray-200 rounded-2xl cursor-pointer transition-all peer-checked:border-primary-400 peer-checked:bg-primary-50 hover:border-gray-300">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{count}회</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.workoutsPerWeek && (
            <p className="text-sm text-error-500">{errors.workoutsPerWeek.message}</p>
          )}
        </div>
      </Card>

      {/* 분할 방식 */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">분할 방식</h3>
            <p className="text-sm text-gray-600 mt-1">
              주 {workoutsPerWeek}회 운동에는 <strong>{splitOptions.find(opt => opt.recommended)?.label}</strong>을 추천합니다
            </p>
          </div>
          <div className="space-y-3">
            {splitOptions.map((option) => (
              <label key={option.value} className="relative block">
                <input
                  type="radio"
                  value={option.value}
                  {...register('splitType', { required: '분할 방식을 선택해주세요' })}
                  className="sr-only peer"
                />
                <div className={`p-4 border-2 rounded-2xl cursor-pointer transition-all peer-checked:border-primary-400 peer-checked:bg-primary-50 hover:border-gray-300 ${
                  option.recommended ? 'border-primary-200 bg-primary-25' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{option.label}</span>
                        {option.recommended && (
                          <span className="px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded-full">
                            추천
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.splitType && (
            <p className="text-sm text-error-500">{errors.splitType.message}</p>
          )}
        </div>
      </Card>

      {/* 추가 요청사항 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">추가 요청사항</h3>
          <Input
            {...register('additionalRequest')}
            placeholder="예: 코어 운동을 더 많이 포함해주세요, 무릎에 무리가 가지 않는 운동으로 구성해주세요"
            variant="filled"
            helperText="특별한 요청사항이 있다면 자유롭게 입력해주세요 (선택사항)"
          />
        </div>
      </Card>

      {/* 생성 버튼 */}
      <div className="pt-4">
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isGenerating}
          disabled={isGenerating}
        >
          {isGenerating ? 'AI가 루틴을 생성하고 있습니다...' : 'AI 루틴 생성하기'}
        </Button>
      </div>

      {/* 안내 메시지 */}
      {isGenerating && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-blue-700">
              AI가 당신의 프로필을 분석하여 맞춤형 루틴을 생성하고 있습니다.
            </p>
            <p className="text-xs text-blue-600">
              잠시만 기다려주세요... (약 10-30초 소요)
            </p>
          </div>
        </Card>
      )}
    </form>
  );
};

export default RoutineCreationForm;