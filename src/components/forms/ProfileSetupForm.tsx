import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressIndicator from './ProgressIndicator';
import {
  BasicInfoStep,
  WorkoutEnvironmentStep,
  GoalsStep,
  PhysicalConditionStep,
  ExperienceStep,
  PlanDurationStep
} from './steps';
import { profileService, ProfileValidationError } from '../../services/database';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../constants';
import type { Profile } from '../../types';

interface ProfileFormData {
  // Basic info
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  height: number | '';
  weight: number | '';
  // Workout environment
  workoutLocation: 'gym' | 'home' | 'outdoor' | 'mixed' | '';
  weeklyWorkouts: number | '';
  // Goals
  goal: 'strength' | 'weight_loss' | 'endurance' | 'muscle_gain' | 'body_correction' | '';
  focus: 'upper_body' | 'lower_body' | 'full_body' | 'core' | '';
  // Physical condition
  fitnessLevel: 'beginner' | 'novice' | 'intermediate' | 'advanced' | '';
  uncomfortableAreas: ('neck' | 'shoulder' | 'back' | 'knee' | 'ankle' | 'wrist')[];
  // Experience
  experienceLevel: 'none' | 'under_6months' | '6months_1year' | '1year_3years' | 'over_3years' | '';
  exerciseHistory: { exerciseName: string; maxWeight: number; reps: number; }[];
  // Plan duration
  planDuration: number | '';
}

const ProfileSetupForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileFormData>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    workoutLocation: '',
    weeklyWorkouts: '',
    goal: '',
    focus: '',
    fitnessLevel: '',
    uncomfortableAreas: [],
    experienceLevel: '',
    exerciseHistory: [],
    planDuration: ''
  });

  const stepTitles = [
    '기본 정보',
    '운동 환경',
    '목표 설정',
    '신체 조건',
    '운동 경력',
    '플랜 기간'
  ];

  const totalSteps = stepTitles.length;

  const updateFormData = (stepData: Partial<ProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setErrors({});
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Basic Info
        if (!formData.age) stepErrors.age = '연령을 입력해주세요';
        else if (formData.age < 15 || formData.age > 80) stepErrors.age = '연령은 15세에서 80세 사이여야 합니다';
        
        if (!formData.gender) stepErrors.gender = '성별을 선택해주세요';
        
        if (!formData.height) stepErrors.height = '키를 입력해주세요';
        else if (formData.height < 100 || formData.height > 250) stepErrors.height = '키는 100cm에서 250cm 사이여야 합니다';
        
        if (!formData.weight) stepErrors.weight = '몸무게를 입력해주세요';
        else if (formData.weight < 30 || formData.weight > 300) stepErrors.weight = '몸무게는 30kg에서 300kg 사이여야 합니다';
        break;

      case 2: // Workout Environment
        if (!formData.workoutLocation) stepErrors.workoutLocation = '운동 장소를 선택해주세요';
        if (!formData.weeklyWorkouts) stepErrors.weeklyWorkouts = '주간 운동 횟수를 선택해주세요';
        break;

      case 3: // Goals
        if (!formData.goal) stepErrors.goal = '운동 목표를 선택해주세요';
        if (!formData.focus) stepErrors.focus = '운동 초점을 선택해주세요';
        break;

      case 4: // Physical Condition
        if (!formData.fitnessLevel) stepErrors.fitnessLevel = '체력 수준을 선택해주세요';
        break;

      case 5: // Experience
        if (!formData.experienceLevel) stepErrors.experienceLevel = '운동 경력을 선택해주세요';
        break;

      case 6: // Plan Duration
        if (!formData.planDuration) stepErrors.planDuration = '플랜 기간을 선택해주세요';
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      console.error('User not found');
      return;
    }

    setIsLoading(true);
    try {
      const profileData: Partial<Profile> = {
        userId: user.id,
        age: formData.age as number,
        gender: formData.gender as any,
        height: formData.height as number,
        weight: formData.weight as number,
        workoutLocation: formData.workoutLocation as any,
        weeklyWorkouts: formData.weeklyWorkouts as number,
        goal: formData.goal as any,
        focus: formData.focus as any,
        fitnessLevel: formData.fitnessLevel as any,
        uncomfortableAreas: formData.uncomfortableAreas,
        experienceLevel: formData.experienceLevel as any,
        exerciseHistory: formData.exerciseHistory,
        planDuration: formData.planDuration as number
      };

      await profileService.createProfile(profileData);
      
      // Navigate to routine creation
      navigate(ROUTES.ROUTINES_NEW);
    } catch (error) {
      console.error('Error creating profile:', error);
      if (error instanceof ProfileValidationError) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: '프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      onNext: handleNext,
      onBack: currentStep > 1 ? handleBack : undefined,
      errors
    };

    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={{
              age: formData.age,
              gender: formData.gender,
              height: formData.height,
              weight: formData.weight
            }}
            onChange={updateFormData}
            {...commonProps}
          />
        );

      case 2:
        return (
          <WorkoutEnvironmentStep
            data={{
              workoutLocation: formData.workoutLocation,
              weeklyWorkouts: formData.weeklyWorkouts
            }}
            onChange={updateFormData}
            {...commonProps}
          />
        );

      case 3:
        return (
          <GoalsStep
            data={{
              goal: formData.goal,
              focus: formData.focus
            }}
            onChange={updateFormData}
            {...commonProps}
          />
        );

      case 4:
        return (
          <PhysicalConditionStep
            data={{
              fitnessLevel: formData.fitnessLevel,
              uncomfortableAreas: formData.uncomfortableAreas
            }}
            onChange={updateFormData}
            {...commonProps}
          />
        );

      case 5:
        return (
          <ExperienceStep
            data={{
              experienceLevel: formData.experienceLevel,
              exerciseHistory: formData.exerciseHistory
            }}
            onChange={updateFormData}
            {...commonProps}
          />
        );

      case 6:
        return (
          <PlanDurationStep
            data={{
              planDuration: formData.planDuration
            }}
            onChange={updateFormData}
            {...commonProps}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      {renderCurrentStep()}
    </div>
  );
};

export default ProfileSetupForm;