import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '../ui';
import { DraggableExerciseItem, ExerciseEditor } from './';
import { routinesService } from '../../services/routines';
import { ROUTES } from '../../constants';
import type { RoutineWithDetails, Exercise } from '../../types';
import type { WorkoutWithExercises } from '../../services/routines';

const RoutineEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [routine, setRoutine] = useState<RoutineWithDetails | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExerciseEditorOpen, setIsExerciseEditorOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 루틴 데이터 로드
  useEffect(() => {
    const loadRoutine = async () => {
      if (!id) {
        setError('루틴 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const routineData = await routinesService.getRoutine(id);
        
        if (!routineData) {
          setError('루틴을 찾을 수 없습니다.');
          return;
        }

        setRoutine(routineData);
        // 첫 번째 워크아웃을 기본 선택
        if (routineData.workouts.length > 0) {
          setSelectedWorkout(routineData.workouts[0]);
        }
      } catch (err) {
        console.error('루틴 로드 실패:', err);
        setError('루틴을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutine();
  }, [id]);

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!selectedWorkout || !routine || !over || active.id === over.id) {
      return;
    }

    const oldIndex = selectedWorkout.exercises.findIndex(ex => ex.id === active.id);
    const newIndex = selectedWorkout.exercises.findIndex(ex => ex.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 로컬 상태 즉시 업데이트 (UI 반응성)
    const newExercises = arrayMove(selectedWorkout.exercises, oldIndex, newIndex);
    const updatedWorkout = { ...selectedWorkout, exercises: newExercises };
    const updatedWorkouts = routine.workouts.map(w => 
      w.id === selectedWorkout.id ? updatedWorkout : w
    );
    
    setRoutine({ ...routine, workouts: updatedWorkouts });
    setSelectedWorkout(updatedWorkout);

    // 서버에 순서 변경 저장
    try {
      const exerciseIds = newExercises.map(ex => ex.id);
      await routinesService.reorderExercises(selectedWorkout.id, exerciseIds);
    } catch (err) {
      console.error('운동 순서 변경 실패:', err);
      // 실패 시 원래 상태로 복원
      setRoutine(routine);
      setSelectedWorkout(selectedWorkout);
      alert('운동 순서 변경에 실패했습니다.');
    }
  };

  // 운동 추가
  const handleAddExercise = () => {
    setEditingExercise(undefined);
    setIsExerciseEditorOpen(true);
  };

  // 운동 수정
  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsExerciseEditorOpen(true);
  };

  // 운동 삭제
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!selectedWorkout || !routine) return;

    if (!confirm('이 운동을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await routinesService.deleteExercise(exerciseId);
      
      // 로컬 상태 업데이트
      const updatedExercises = selectedWorkout.exercises.filter(ex => ex.id !== exerciseId);
      const updatedWorkout = { ...selectedWorkout, exercises: updatedExercises };
      const updatedWorkouts = routine.workouts.map(w => 
        w.id === selectedWorkout.id ? updatedWorkout : w
      );
      
      setRoutine({ ...routine, workouts: updatedWorkouts });
      setSelectedWorkout(updatedWorkout);
    } catch (err) {
      console.error('운동 삭제 실패:', err);
      alert('운동 삭제에 실패했습니다.');
    }
  };

  // 운동 저장 (추가/수정)
  const handleSaveExercise = async (exerciseData: Omit<Exercise, 'id'> | Exercise) => {
    if (!selectedWorkout || !routine) return;

    try {
      let savedExercise: Exercise;

      if ('id' in exerciseData) {
        // 수정 모드
        savedExercise = await routinesService.updateExercise(exerciseData.id, exerciseData);
      } else {
        // 추가 모드
        savedExercise = await routinesService.addExercise(selectedWorkout.id, exerciseData);
      }

      // 로컬 상태 업데이트
      let updatedExercises: Exercise[];
      if ('id' in exerciseData) {
        // 수정된 운동 업데이트
        updatedExercises = selectedWorkout.exercises.map(ex => 
          ex.id === exerciseData.id ? savedExercise : ex
        );
      } else {
        // 새 운동 추가
        updatedExercises = [...selectedWorkout.exercises, savedExercise];
      }

      const updatedWorkout = { ...selectedWorkout, exercises: updatedExercises };
      const updatedWorkouts = routine.workouts.map(w => 
        w.id === selectedWorkout.id ? updatedWorkout : w
      );
      
      setRoutine({ ...routine, workouts: updatedWorkouts });
      setSelectedWorkout(updatedWorkout);
    } catch (err) {
      console.error('운동 저장 실패:', err);
      alert('운동 저장에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || '루틴을 찾을 수 없습니다.'}</p>
          <Button onClick={() => navigate(ROUTES.ROUTINES)}>
            루틴 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.ROUTINES)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {routine.name} 편집
              </h1>
              <p className="text-sm text-gray-500">
                운동 항목을 자유롭게 수정하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 워크아웃 탭 */}
        {routine.workouts.length > 1 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {routine.workouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                    ${selectedWorkout?.id === workout.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {workout.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 선택된 워크아웃의 운동 목록 */}
        {selectedWorkout && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedWorkout.name}
              </h2>
              <span className="text-sm text-gray-500">
                {selectedWorkout.exercises.length}개 운동
              </span>
            </div>

            {/* 드래그 앤 드롭 운동 목록 */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedWorkout.exercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {selectedWorkout.exercises.map((exercise) => (
                    <DraggableExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={handleEditExercise}
                      onDelete={handleDeleteExercise}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* 운동이 없을 때 */}
            {selectedWorkout.exercises.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-4">
                  아직 운동이 없습니다
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddExercise}
                >
                  첫 운동 추가하기
                </Button>
              </div>
            )}

            {/* 운동 추가 버튼 */}
            {selectedWorkout.exercises.length > 0 && (
              <Button
                variant="secondary"
                fullWidth
                onClick={handleAddExercise}
                className="mt-6"
              >
                <Plus size={16} className="mr-2" />
                운동 추가하기
              </Button>
            )}

            {/* 드래그 앤 드롭 안내 */}
            {selectedWorkout.exercises.length > 1 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>운동을 드래그하여 순서를 변경할 수 있습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 운동 편집 모달 */}
      <ExerciseEditor
        isOpen={isExerciseEditorOpen}
        onClose={() => setIsExerciseEditorOpen(false)}
        onSave={handleSaveExercise}
        exercise={editingExercise}
      />
    </div>
  );
};

export default RoutineEditor;