import React, { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { MuscleGroupBadge, MuscleGroupSelector } from './';
import type { MuscleGroup } from '../../types';

interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description?: string;
  defaultSets: number;
  defaultReps: string;
}

interface ExerciseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Omit<ExerciseLibraryItem, 'id'>) => void;
}

// 운동 라이브러리 데이터
const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  // 가슴 운동
  {
    id: 'bench-press',
    name: '벤치프레스',
    muscleGroup: 'chest',
    description: '가슴 근육을 발달시키는 대표적인 운동',
    defaultSets: 3,
    defaultReps: '8-10',
  },
  {
    id: 'incline-bench-press',
    name: '인클라인 벤치프레스',
    muscleGroup: 'chest',
    description: '상부 가슴을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '8-10',
  },
  {
    id: 'dumbbell-flyes',
    name: '덤벨 플라이',
    muscleGroup: 'chest',
    description: '가슴 근육의 스트레칭과 수축을 강화하는 운동',
    defaultSets: 3,
    defaultReps: '10-12',
  },
  {
    id: 'push-ups',
    name: '푸시업',
    muscleGroup: 'chest',
    description: '자체 중량을 이용한 가슴 운동',
    defaultSets: 3,
    defaultReps: '10-15',
  },

  // 등 운동
  {
    id: 'deadlift',
    name: '데드리프트',
    muscleGroup: 'back',
    description: '전신 근력을 기르는 복합 운동',
    defaultSets: 3,
    defaultReps: '5-8',
  },
  {
    id: 'pull-ups',
    name: '풀업',
    muscleGroup: 'back',
    description: '자체 중량을 이용한 등 운동',
    defaultSets: 3,
    defaultReps: '5-10',
  },
  {
    id: 'lat-pulldown',
    name: '랫 풀다운',
    muscleGroup: 'back',
    description: '광배근을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    id: 'barbell-row',
    name: '바벨 로우',
    muscleGroup: 'back',
    description: '등 중앙부를 강화하는 운동',
    defaultSets: 3,
    defaultReps: '8-10',
  },

  // 어깨 운동
  {
    id: 'shoulder-press',
    name: '숄더 프레스',
    muscleGroup: 'shoulders',
    description: '어깨 전체를 발달시키는 기본 운동',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    id: 'lateral-raise',
    name: '레터럴 레이즈',
    muscleGroup: 'shoulders',
    description: '측면 삼각근을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '12-15',
  },
  {
    id: 'rear-delt-flyes',
    name: '리어 델트 플라이',
    muscleGroup: 'shoulders',
    description: '후면 삼각근을 강화하는 운동',
    defaultSets: 3,
    defaultReps: '12-15',
  },

  // 팔 운동
  {
    id: 'bicep-curls',
    name: '바이셉 컬',
    muscleGroup: 'arms',
    description: '이두근을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '10-12',
  },
  {
    id: 'tricep-dips',
    name: '트라이셉 딥스',
    muscleGroup: 'arms',
    description: '삼두근을 강화하는 자체 중량 운동',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    id: 'hammer-curls',
    name: '해머 컬',
    muscleGroup: 'arms',
    description: '이두근과 전완근을 함께 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '10-12',
  },

  // 복근 운동
  {
    id: 'plank',
    name: '플랭크',
    muscleGroup: 'abs',
    description: '코어 전체를 강화하는 정적 운동',
    defaultSets: 3,
    defaultReps: '30-60초',
  },
  {
    id: 'crunches',
    name: '크런치',
    muscleGroup: 'abs',
    description: '복직근을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '15-20',
  },
  {
    id: 'russian-twists',
    name: '러시안 트위스트',
    muscleGroup: 'abs',
    description: '복사근을 강화하는 회전 운동',
    defaultSets: 3,
    defaultReps: '20-30',
  },

  // 하체 운동
  {
    id: 'squats',
    name: '스쿼트',
    muscleGroup: 'legs',
    description: '하체 전체를 발달시키는 기본 운동',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    id: 'lunges',
    name: '런지',
    muscleGroup: 'legs',
    description: '대퇴근과 둔근을 강화하는 단측 운동',
    defaultSets: 3,
    defaultReps: '10-12',
  },
  {
    id: 'leg-press',
    name: '레그 프레스',
    muscleGroup: 'legs',
    description: '하체 근력을 안전하게 기를 수 있는 운동',
    defaultSets: 3,
    defaultReps: '10-15',
  },
  {
    id: 'calf-raises',
    name: '카프 레이즈',
    muscleGroup: 'legs',
    description: '종아리 근육을 집중적으로 발달시키는 운동',
    defaultSets: 3,
    defaultReps: '15-20',
  },

  // 전신 운동
  {
    id: 'burpees',
    name: '버피',
    muscleGroup: 'full_body',
    description: '전신 근력과 심폐지구력을 기르는 복합 운동',
    defaultSets: 3,
    defaultReps: '8-12',
  },
  {
    id: 'mountain-climbers',
    name: '마운틴 클라이머',
    muscleGroup: 'full_body',
    description: '전신 근력과 유산소 효과를 동시에 얻는 운동',
    defaultSets: 3,
    defaultReps: '20-30',
  },
];

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);

  // 필터링된 운동 목록
  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(exercise => {
      // 검색어 필터
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // 근육 그룹 필터
      const matchesMuscleGroup = selectedMuscleGroups.length === 0 || 
                                selectedMuscleGroups.includes(exercise.muscleGroup);
      
      return matchesSearch && matchesMuscleGroup;
    });
  }, [searchTerm, selectedMuscleGroups]);

  const handleSelectExercise = (exercise: ExerciseLibraryItem) => {
    onSelectExercise({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      description: exercise.description,
      defaultSets: exercise.defaultSets,
      defaultReps: exercise.defaultReps,
    });
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMuscleGroups([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            운동 라이브러리
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* 검색바 */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="운동명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 근육 그룹 필터 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                근육 그룹 필터
              </label>
              {(searchTerm || selectedMuscleGroups.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  필터 초기화
                </button>
              )}
            </div>
            <MuscleGroupSelector
              selectedMuscleGroups={selectedMuscleGroups}
              onSelectionChange={setSelectedMuscleGroups}
              multiple={true}
            />
          </div>
        </div>

        {/* 운동 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredExercises.length > 0 ? (
            <div className="space-y-3">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleSelectExercise(exercise)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {exercise.name}
                        </h3>
                        <MuscleGroupBadge 
                          muscleGroup={exercise.muscleGroup} 
                          size="sm" 
                        />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>{exercise.defaultSets}세트</span>
                        <span>{exercise.defaultReps}회</span>
                      </div>
                      
                      {exercise.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {exercise.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectExercise(exercise);
                      }}
                      className="ml-3 p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                      title="운동 추가"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedMuscleGroups.length > 0
                  ? '검색 조건에 맞는 운동이 없습니다'
                  : '운동 라이브러리가 비어있습니다'
                }
              </p>
              {(searchTerm || selectedMuscleGroups.length > 0) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearFilters}
                >
                  필터 초기화
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            총 {filteredExercises.length}개의 운동
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExerciseLibrary;