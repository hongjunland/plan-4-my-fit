import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { MuscleGroupSelector, ExerciseLibrary } from './';
import type { Exercise, MuscleGroup } from '../../types';

interface ExerciseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Omit<Exercise, 'id'> | Exercise) => void;
  exercise?: Exercise; // 수정 모드일 때 전달
  title?: string;
}

const ExerciseEditor: React.FC<ExerciseEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  exercise,
  title = exercise ? '운동 수정' : '운동 추가',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sets: 3,
    reps: '8-10',
    muscleGroup: 'chest' as MuscleGroup,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        muscleGroup: exercise.muscleGroup,
        description: exercise.description || '',
      });
    } else {
      // 새 운동 추가 모드일 때 초기화
      setFormData({
        name: '',
        sets: 3,
        reps: '8-10',
        muscleGroup: 'chest',
        description: '',
      });
    }
    setErrors({});
  }, [exercise, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '운동명을 입력해주세요';
    }

    if (formData.sets < 1 || formData.sets > 10) {
      newErrors.sets = '세트 수는 1-10 사이여야 합니다';
    }

    if (!formData.reps.trim()) {
      newErrors.reps = '반복 횟수를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const exerciseData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      if (exercise) {
        // 수정 모드
        onSave({ ...exercise, ...exerciseData });
      } else {
        // 추가 모드
        onSave(exerciseData);
      }
      
      onClose();
    } catch (error) {
      console.error('운동 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 운동 라이브러리에서 운동 선택
  const handleSelectFromLibrary = (libraryExercise: any) => {
    setFormData({
      name: libraryExercise.name,
      sets: libraryExercise.defaultSets,
      reps: libraryExercise.defaultReps,
      muscleGroup: libraryExercise.muscleGroup,
      description: libraryExercise.description || '',
    });
    setIsLibraryOpen(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* 운동 라이브러리 버튼 */}
          {!exercise && (
            <div className="mb-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setIsLibraryOpen(true)}
                className="mb-4"
              >
                <BookOpen size={16} className="mr-2" />
                운동 라이브러리에서 선택
              </Button>
              <div className="text-center text-sm text-gray-500 mb-4">
                또는 직접 입력하세요
              </div>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 운동명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운동명 *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="예: 벤치프레스"
                error={errors.name}
              />
            </div>

            {/* 세트 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세트 수 *
              </label>
              <Input
                type="number"
                value={formData.sets}
                onChange={(e) => handleInputChange('sets', parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                error={errors.sets}
              />
            </div>

            {/* 반복 횟수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반복 횟수 *
              </label>
              <Input
                type="text"
                value={formData.reps}
                onChange={(e) => handleInputChange('reps', e.target.value)}
                placeholder="예: 8-10, 30초, 최대한"
                error={errors.reps}
              />
            </div>

            {/* 근육 그룹 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주요 근육 그룹 *
              </label>
              <MuscleGroupSelector
                selected={formData.muscleGroup}
                onChange={(muscleGroup) => handleInputChange('muscleGroup', muscleGroup)}
                multiple={false}
              />
            </div>

            {/* 운동 설명 (선택사항) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운동 설명 (선택사항)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="운동 방법이나 주의사항을 입력하세요"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {exercise ? '수정하기' : '추가하기'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 운동 라이브러리 모달 */}
      <ExerciseLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectExercise={handleSelectFromLibrary}
      />
    </>
  );
};

export default ExerciseEditor;